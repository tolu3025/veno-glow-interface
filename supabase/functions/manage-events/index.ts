import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "create_event": {
        const { title, description, venue, event_date, end_date, category, image_url, ticket_types, settlement_bank_name, settlement_account_number, settlement_account_name } = params;

        // Check organizer role
        const { data: roleCheck } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "organizer")
          .single();

        if (!roleCheck) {
          return jsonResponse({ success: false, error: "You must be approved as an organizer by an admin to create events" });
        }

        // Create event
        const { data: event, error: eventError } = await supabaseAdmin
          .from("events")
          .insert({
            organizer_id: user.id,
            title, description, venue, event_date, end_date,
            category: category || "general",
            image_url,
            settlement_bank_name, settlement_account_number, settlement_account_name,
          })
          .select()
          .single();

        if (eventError) {
          return jsonResponse({ success: false, error: eventError.message });
        }

        // Create ticket types
        if (ticket_types && ticket_types.length > 0) {
          const types = ticket_types.map((t: any) => ({
            event_id: event.id,
            name: t.name,
            price: t.price,
            quantity: t.quantity,
            description: t.description || null,
          }));
          await supabaseAdmin.from("ticket_types").insert(types);
        }

        return jsonResponse({ success: true, event_id: event.id });
      }

      case "purchase_ticket": {
        const { event_id, ticket_type_id, pin } = params;

        // Verify PIN
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("transaction_pin_hash, full_name, matric_number")
          .eq("id", user.id)
          .single();

        if (!profile?.transaction_pin_hash) {
          return jsonResponse({ success: false, error: "Transaction PIN not set" });
        }

        const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
        const pinValid = bcrypt.compareSync(pin, profile.transaction_pin_hash);
        if (!pinValid) {
          await supabaseAdmin.rpc("record_failed_pin", { p_user_id: user.id });
          return jsonResponse({ success: false, error: "Incorrect PIN" });
        }

        await supabaseAdmin.rpc("reset_pin_attempts", { p_user_id: user.id });

        // Use the database function to purchase
        const { data: result, error } = await supabaseAdmin.rpc("purchase_ticket_from_wallet", {
          p_buyer_id: user.id,
          p_event_id: event_id,
          p_ticket_type_id: ticket_type_id,
          p_buyer_name: profile.full_name,
          p_buyer_matric: profile.matric_number,
        });

        if (error) {
          return jsonResponse({ success: false, error: error.message });
        }

        return jsonResponse(result);
      }

      case "verify_ticket": {
        const { qr_code } = params;

        // Find the ticket
        const { data: ticket, error } = await supabaseAdmin
          .from("tickets")
          .select("*, events(*), ticket_types(name, price)")
          .eq("qr_code", qr_code)
          .single();

        if (error || !ticket) {
          return jsonResponse({ success: false, error: "Invalid ticket" });
        }

        // Check organizer
        if (ticket.events.organizer_id !== user.id) {
          return jsonResponse({ success: false, error: "You are not the organizer of this event" });
        }

        return jsonResponse({
          success: true,
          ticket: {
            id: ticket.id,
            buyer_name: ticket.buyer_name,
            buyer_matric: ticket.buyer_matric,
            ticket_type: ticket.ticket_types.name,
            amount_paid: ticket.amount_paid,
            status: ticket.status,
            checked_in_at: ticket.checked_in_at,
            event_title: ticket.events.title,
            event_date: ticket.events.event_date,
          },
        });
      }

      case "check_in_ticket": {
        const { qr_code } = params;

        // Find ticket
        const { data: ticket } = await supabaseAdmin
          .from("tickets")
          .select("*, events(organizer_id)")
          .eq("qr_code", qr_code)
          .single();

        if (!ticket) {
          return jsonResponse({ success: false, error: "Ticket not found" });
        }

        if (ticket.events.organizer_id !== user.id) {
          return jsonResponse({ success: false, error: "Not authorized" });
        }

        if (ticket.status === "used") {
          return jsonResponse({ success: false, error: "Ticket already used", checked_in_at: ticket.checked_in_at });
        }

        if (ticket.status !== "valid") {
          return jsonResponse({ success: false, error: `Ticket is ${ticket.status}` });
        }

        await supabaseAdmin
          .from("tickets")
          .update({ status: "used", checked_in_at: new Date().toISOString(), checked_in_by: user.id })
          .eq("id", ticket.id);

        return jsonResponse({ success: true, message: "Check-in successful!" });
      }

      case "get_organizer_stats": {
        const { event_id } = params;

        // Verify organizer
        const { data: event } = await supabaseAdmin
          .from("events")
          .select("*")
          .eq("id", event_id)
          .eq("organizer_id", user.id)
          .single();

        if (!event) {
          return jsonResponse({ success: false, error: "Event not found or not authorized" });
        }

        // Get ticket types with sales
        const { data: ticketTypes } = await supabaseAdmin
          .from("ticket_types")
          .select("*")
          .eq("event_id", event_id);

        // Get all tickets
        const { data: tickets } = await supabaseAdmin
          .from("tickets")
          .select("*")
          .eq("event_id", event_id)
          .order("created_at", { ascending: false });

        const totalCheckedIn = (tickets || []).filter(t => t.status === "used").length;
        const totalValid = (tickets || []).filter(t => t.status === "valid").length;

        return jsonResponse({
          success: true,
          event,
          ticketTypes: ticketTypes || [],
          tickets: tickets || [],
          stats: {
            totalSold: event.total_tickets_sold,
            totalRevenue: event.total_revenue,
            totalCheckedIn,
            totalValid,
            checkInRate: event.total_tickets_sold > 0 ? Math.round((totalCheckedIn / event.total_tickets_sold) * 100) : 0,
          },
        });
      }

      default:
        return jsonResponse({ success: false, error: "Unknown action" });
    }
  } catch (err) {
    console.error("Event operation error:", err);
    return jsonResponse({ error: "An unexpected error occurred" }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
