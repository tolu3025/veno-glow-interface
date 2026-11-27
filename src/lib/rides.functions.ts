import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toyesek, pickPrice, verifyPinWithEdge } from "./rides.server";

/** Routes, pickup landmarks and travel windows offered by Toyesek. */
export const getRideCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const [routes, periods] = await Promise.all([
      toyesek("/routes"),
      toyesek("/vacation-periods"),
    ]);
    const routeList = ((routes.data?.routes ?? []) as any[]).map((r) => ({
      ...r,
      price: pickPrice(r),
    }));

    // The partner's /landmarks endpoint fails without a route, so ask per route.
    const landmarkGroups = await Promise.all(
      routeList.map(async (r) => {
        const res = await toyesek(`/landmarks?route_id=${encodeURIComponent(r.id)}`);
        return ((res.data?.landmarks ?? []) as any[]).filter(
          (l) => !l.route_id || l.route_id === r.id,
        );
      }),
    );
    const byId = new Map<string, any>();
    for (const group of landmarkGroups) {
      for (const l of group) if (l?.id) byId.set(l.id, l);
    }

    return {
      routes: routeList,
      landmarks: [...byId.values()],
      periods: ((periods.data?.vacation_periods ?? []) as any[]).map((p) => ({
        ...p,
        price: pickPrice(p),
      })),
      error: routes.ok ? null : "Could not reach the transport partner.",
    };
  });

/** Seat availability + fare for a given travel window and date. */
export const getRideAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        vacation_period_id: z.string().min(1),
        travel_date: z.string().min(4),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const res = await toyesek(
      `/availability?vacation_period_id=${encodeURIComponent(data.vacation_period_id)}&travel_date=${encodeURIComponent(data.travel_date)}`,
    );
    if (!res.ok) {
      return { available: null as number | null, price: 0, error: "Could not check seats for that date." };
    }
    const payload = res.data?.availability ?? res.data ?? {};
    const seats =
      Number(payload.available_seats ?? payload.seats_available ?? payload.available) ;
    return {
      available: Number.isFinite(seats) ? seats : null,
      price: pickPrice(payload),
      error: null as string | null,
    };
  });

/** The signed-in student's ride bookings. */
export const listMyRides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ride_bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    return { bookings: (data ?? []) as any[] };
  });

/** Debits the wallet, books the seat with Toyesek, refunds on provider failure. */
export const bookRide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        vacation_period_id: z.string().min(1),
        landmark_id: z.string().min(1),
        travel_date: z.string().min(4),
        pin: z.string().regex(/^\d{4}$/),
        amount: z.number().positive().max(1_000_000),
        seats: z.number().int().min(1).max(5).default(1),
        route_id: z.string().optional(),
        route_name: z.string().optional(),
        landmark_name: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    const pinCheck = await verifyPinWithEdge(data.pin);
    if (!pinCheck.ok) {
      return { success: false, error: pinCheck.error ?? "We couldn't verify your PIN." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const total = Math.round(data.amount * data.seats * 100) / 100;
    const reference = `RIDE-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const { data: pay, error: payErr } = await supabaseAdmin.rpc(
      "pay_bill_from_wallet" as any,
      {
        p_user_id: userId,
        p_amount: total,
        p_reference: reference,
        p_bill_type: "ride_booking",
        p_metadata: {
          provider: "toyesek",
          route_name: data.route_name ?? null,
          travel_date: data.travel_date,
          seats: data.seats,
        },
      } as any,
    );
    const payResult = pay as any;
    if (payErr || !payResult?.success) {
      const raw = String(payResult?.error ?? payErr?.message ?? "");
      console.error("[bookRide] payment failed", raw, payErr);
      let friendly = "We couldn't complete this payment. Please try again in a moment.";
      if (/insufficient/i.test(raw)) {
        friendly = "You don't have enough money in your wallet for this trip.";
      } else if (/wallet not found/i.test(raw)) {
        friendly = "We couldn't find your wallet. Please contact support.";
      } else if (/invalid amount/i.test(raw)) {
        friendly = "That fare amount isn't valid. Please pick your trip again.";
      } else if (raw) {
        friendly = `Payment failed: ${raw}`;
      }
      return { success: false, error: friendly };
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone_number")
      .eq("id", userId)
      .maybeSingle();

    const { data: authUser, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    const passengerEmail = authUser.user?.email;
    if (authUserError || !passengerEmail) {
      console.error("[bookRide] passenger email unavailable", authUserError);
      await supabaseAdmin.rpc("post_ledger_entry" as any, {
        _debit_user_id: null,
        _credit_user_id: userId,
        _amount_kobo: Math.round(total * 100),
        _purpose: "ride_booking_refund",
        _reference: `${reference}-RF`,
        _metadata: { reason: "passenger_email_unavailable", provider: "toyesek", original_reference: reference },
        _external_kind: "external",
      } as any);
      await supabaseAdmin
        .from("transactions")
        .update({ status: "reversed" } as any)
        .eq("reference", reference);
      return {
        success: false,
        error: "We couldn't load the email linked to your account. Your payment has been refunded; please sign in again.",
      };
    }

    const res = await toyesek("/bookings", {
      method: "POST",
      body: JSON.stringify({
        vacation_period_id: data.vacation_period_id,
        landmark_id: data.landmark_id,
        travel_date: data.travel_date,
        seats: data.seats,
        amount: total,
        payment_reference: reference,
        passenger: {
          full_name: (profile as any)?.full_name ?? "Kukapay Student",
          email: passengerEmail,
          phone: (profile as any)?.phone_number ?? undefined,
        },
      }),
    });

    if (!res.ok) {
      console.error("[bookRide] provider error", res.status, JSON.stringify(res.data));
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (wallet) {
        const refundReference = `${reference}-RF`;
        const { data: refund, error: refundError } = await supabaseAdmin.rpc("post_ledger_entry" as any, {
          _debit_user_id: null,
          _credit_user_id: userId,
          _amount_kobo: Math.round(total * 100),
          _purpose: "ride_booking_refund",
          _reference: refundReference,
          _metadata: { reason: "ride_booking_failed", provider: "toyesek", original_reference: reference },
          _external_kind: "external",
        } as any);
        if (!refundError && (refund as any)?.success) {
          await supabaseAdmin.from("transactions").insert({
            user_id: userId,
            type: "REFUND",
            amount: total,
            status: "completed",
            reference: refundReference,
            metadata: { reason: "ride_booking_failed", provider: "toyesek", original_reference: reference },
          } as any);
          await supabaseAdmin
            .from("transactions")
            .update({ status: "reversed" } as any)
            .eq("reference", reference);
        } else {
          console.error("[bookRide] refund failed", refundError, refund);
          return {
            success: false,
            error: "The transport partner could not confirm this seat. Your payment needs review; please contact KukaPay support.",
          };
        }
      }
      return {
        success: false,
        error: "The transport partner could not confirm this seat. You have been refunded.",
      };
    }

    const booking = res.data?.booking ?? res.data ?? {};

    await supabaseAdmin.from("ride_bookings").insert({
      user_id: userId,
      provider: "toyesek",
      provider_booking_id: booking.id ?? booking.booking_id ?? null,
      provider_reference: booking.reference ?? booking.booking_reference ?? null,
      route_id: data.route_id ?? null,
      route_name: data.route_name ?? null,
      landmark_id: data.landmark_id,
      landmark_name: data.landmark_name ?? null,
      vacation_period_id: data.vacation_period_id,
      travel_date: data.travel_date,
      seats: data.seats,
      amount: total,
      payment_reference: reference,
      status: booking.status ?? "confirmed",
      passenger_name: (profile as any)?.full_name ?? null,
      passenger_email: passengerEmail,
      passenger_phone: (profile as any)?.phone_number ?? null,
      metadata: booking,
    } as any);

    await supabaseAdmin.rpc("create_notification" as any, {
      p_user_id: userId,
      p_title: "Ride booked",
      p_message: `Your seat${data.seats > 1 ? "s" : ""} for ${data.travel_date} ${data.route_name ? `on ${data.route_name} ` : ""}is confirmed. ₦${total.toLocaleString()} paid.`,
      p_type: "bill_payment",
      p_metadata: { reference, provider: "toyesek" },
    } as any);

    return {
      success: true,
      reference,
      amount: total,
      verification_code: booking.verification_code ?? null,
      qr_payload: booking.qr_payload ?? booking.verification_code ?? null,
      error: null as string | null,
    };
  });
