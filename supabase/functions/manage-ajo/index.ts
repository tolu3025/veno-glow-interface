import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyPin(storedHash: string, pin: string): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    const { compare } = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
    return compare(pin, storedHash);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === storedHash;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const body = await req.json();
    const { action } = body;

    // Public action — no auth required
    if (action === "get_public_group") {
      const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { group_id } = body;
      const { data: group } = await adminClient
        .from("ajo_groups")
        .select("*")
        .eq("id", group_id)
        .single();
      if (!group) return respond({ error: "Group not found" }, 404);
      
      let creator_name = "";
      if (group.creator_id) {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("full_name")
          .eq("id", group.creator_id)
          .single();
        if (profile) creator_name = profile.full_name;
      }
      return respond({ group, creator_name });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return respond({ error: "Unauthorized" }, 401);
    }

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return respond({ error: "Unauthorized" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const userId = user.id;

    const { action: _, ...params } = body;

    switch (action) {
      case "create":
        return await handleCreate(adminClient, userId, params, user.email ?? "");
      case "join":
        return await handleJoin(adminClient, userId, params, user.email ?? "");
      case "contribute":
        return await handleContribute(adminClient, userId, params);
      case "start":
        return await handleStart(adminClient, userId, params);
      case "admin_remind":
        return await handleRemind(adminClient, userId, params);
      case "remove_member":
        return await handleRemoveMember(adminClient, userId, params);
      case "leave":
        return await handleLeave(adminClient, userId, params);
      case "get_details":
        return await handleGetDetails(adminClient, userId, params);
      default:
        return respond({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("manage-ajo error:", err);
    return respond({ error: "An unexpected error occurred" }, 500);
  }
});

const MONITOR_EMAIL = "toluwanimioyetade@gmail.com";

async function handleCreate(
  client: any,
  userId: string,
  params: Record<string, unknown>,
  userEmail: string,
) {
  // Only the monitor account may create Ajo groups.
  if ((userEmail || "").toLowerCase() !== MONITOR_EMAIL) {
    return respond({ error: "Ajo groups are currently curated by KukaPay." }, 403);
  }

  const { title, description, contribution_amount, frequency, total_slots, order_type, min_kyc_level, is_public, image_url } = params as {
    title: string; description?: string; contribution_amount: number; frequency: string;
    total_slots: number; order_type: string; min_kyc_level?: number; is_public?: boolean; image_url?: string;
  };

  if (!title || !contribution_amount || !total_slots || total_slots < 2) {
    return respond({ error: "Invalid parameters" }, 400);
  }

  // Insert group. Monitor is creator only — NOT a participant, so filled_slots starts at 0.
  const { data: group, error: groupErr } = await client
    .from("ajo_groups")
    .insert({
      creator_id: userId,
      title: title.trim().slice(0, 100),
      description: description?.trim().slice(0, 500) || null,
      contribution_amount,
      frequency: frequency || "monthly",
      total_slots,
      filled_slots: 0,
      order_type: order_type || "first_come",
      min_kyc_level: min_kyc_level ?? 1,
      is_public: is_public !== false,
      image_url: image_url || null,
    })
    .select()
    .single();

  if (groupErr) {
    console.error("Create group error:", groupErr);
    return respond({ error: "Failed to create group" }, 500);
  }

  // NOTE: monitor is NOT inserted as a member — they don't contribute,
  // don't receive payouts, and don't occupy a slot.

  return respond({ success: true, group });
}

async function handleJoin(
  client: any,
  userId: string,
  params: Record<string, unknown>,
  userEmail: string,
) {
  if ((userEmail || "").toLowerCase() === MONITOR_EMAIL) {
    return respond({ error: "Monitor account cannot join groups." }, 403);
  }
  const { group_id } = params as { group_id: string };

  // Fetch group
  const { data: group } = await client
    .from("ajo_groups")
    .select("*")
    .eq("id", group_id)
    .single();

  if (!group) return respond({ error: "Group not found" }, 404);
  if (group.status !== "recruiting") return respond({ error: "Group is no longer accepting members" }, 400);
  if (group.filled_slots >= group.total_slots) return respond({ error: "Group is full" }, 400);

  // Check KYC level
  const { data: profile } = await client
    .from("profiles")
    .select("kyc_level")
    .eq("id", userId)
    .single();

  if (!profile || profile.kyc_level < group.min_kyc_level) {
    return respond({ error: `KYC Level ${group.min_kyc_level} required to join` }, 403);
  }

  // Check if already a member
  const { data: existing } = await client
    .from("ajo_members")
    .select("id")
    .eq("group_id", group_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return respond({ success: true, message: "You are already a member of this group", already_member: true });

  // Determine position
  let position: number;
  if (group.order_type === "first_come") {
    position = group.filled_slots + 1;
  } else if (group.order_type === "random_ballot") {
    position = group.filled_slots + 1; // Will be shuffled at start
  } else {
    position = group.filled_slots + 1; // Admin can reassign later
  }

  // Insert member
  const { error: memberErr } = await client
    .from("ajo_members")
    .insert({
      group_id,
      user_id: userId,
      position,
    });

  if (memberErr) {
    console.error("Join error:", memberErr);
    return respond({ error: "Failed to join group" }, 500);
  }

  // Increment filled_slots
  await client
    .from("ajo_groups")
    .update({ filled_slots: group.filled_slots + 1 })
    .eq("id", group_id);

  // Notify creator
  const { data: joinerProfile } = await client
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  await client.rpc("create_notification", {
    p_user_id: group.creator_id,
    p_title: "New Ajo Member",
    p_message: `${joinerProfile?.full_name || "Someone"} joined your Ajo group "${group.title}"`,
    p_type: "ajo",
    p_metadata: { group_id },
  });

  return respond({ success: true, position });
}

async function handleContribute(
  client: any,
  userId: string,
  params: Record<string, unknown>
) {
  const { group_id, pin } = params as { group_id: string; pin: string };

  if (!pin || pin.length < 4) {
    return respond({ error: "Transaction PIN required" }, 400);
  }

  // Verify PIN
  const { data: profile } = await client
    .from("profiles")
    .select("transaction_pin_hash")
    .eq("id", userId)
    .single();

  if (!profile?.transaction_pin_hash) {
    return respond({ error: "Transaction PIN not set" }, 400);
  }

  // Check lockout
  const { data: lockout } = await client.rpc("check_pin_lockout", { p_user_id: userId });
  if (lockout?.locked) {
    return respond({ error: lockout.message }, 403);
  }

  const pinValid = await verifyPin(profile.transaction_pin_hash, pin);
  if (!pinValid) {
    await client.rpc("record_failed_pin", { p_user_id: userId });
    return respond({ error: "Invalid PIN" }, 401);
  }
  await client.rpc("reset_pin_attempts", { p_user_id: userId });

  // Get member
  const { data: member } = await client
    .from("ajo_members")
    .select("id")
    .eq("group_id", group_id)
    .eq("user_id", userId)
    .single();

  if (!member) return respond({ error: "Not a member of this group" }, 403);

  // Get current cycle
  const { data: group } = await client
    .from("ajo_groups")
    .select("current_cycle")
    .eq("id", group_id)
    .single();

  if (!group) return respond({ error: "Group not found" }, 404);

  // Call the DB function
  const { data: result, error } = await client.rpc("contribute_to_ajo", {
    p_member_id: member.id,
    p_group_id: group_id,
    p_cycle: group.current_cycle,
    p_user_id: userId,
  });

  if (error) {
    console.error("Contribute RPC error:", error);
    return respond({ error: "Contribution failed" }, 500);
  }

  return respond(result as Record<string, unknown>);
}

async function handleStart(
  client: any,
  userId: string,
  params: Record<string, unknown>
) {
  const { group_id } = params as { group_id: string };

  const { data: group } = await client
    .from("ajo_groups")
    .select("*")
    .eq("id", group_id)
    .single();

  if (!group) return respond({ error: "Group not found" }, 404);
  if (group.creator_id !== userId) return respond({ error: "Only the creator can start the group" }, 403);
  if (group.status !== "recruiting") return respond({ error: "Group already started" }, 400);
  if (group.filled_slots < 2) return respond({ error: "Need at least 2 members to start" }, 400);

  // If random ballot, shuffle positions
  if (group.order_type === "random_ballot") {
    const { data: members } = await client
      .from("ajo_members")
      .select("id")
      .eq("group_id", group_id)
      .eq("status", "active")
      .order("joined_at");

    if (members) {
      const shuffled = [...members].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i++) {
        await client
          .from("ajo_members")
          .update({ position: i + 1 })
          .eq("id", shuffled[i].id);
      }
    }
  }

  // Calculate due dates based on frequency
  const now = new Date();
  const getDueDate = (cycle: number) => {
    const d = new Date(now);
    if (group.frequency === "daily") d.setDate(d.getDate() + cycle);
    else if (group.frequency === "weekly") d.setDate(d.getDate() + cycle * 7);
    else d.setMonth(d.getMonth() + cycle);
    return d.toISOString();
  };

  // Create contribution records for cycle 1
  const { data: members } = await client
    .from("ajo_members")
    .select("id")
    .eq("group_id", group_id)
    .eq("status", "active");

  if (members) {
    const contributions = members.map((m: any) => ({
      group_id,
      member_id: m.id,
      cycle_number: 1,
      amount: group.contribution_amount,
      due_date: getDueDate(1),
    }));

    await client.from("ajo_contributions").insert(contributions);
  }

  // Create disbursement record for cycle 1
  const { data: recipient } = await client
    .from("ajo_members")
    .select("id")
    .eq("group_id", group_id)
    .eq("position", 1)
    .eq("status", "active")
    .single();

  if (recipient) {
    await client.from("ajo_disbursements").insert({
      group_id,
      recipient_member_id: recipient.id,
      cycle_number: 1,
      amount: group.contribution_amount * group.filled_slots,
    });
  }

  // Update group status
  await client
    .from("ajo_groups")
    .update({ status: "active", current_cycle: 1, start_date: now.toISOString() })
    .eq("id", group_id);

  // Notify all members
  if (members) {
    for (const m of members) {
      const { data: memberData } = await client
        .from("ajo_members")
        .select("user_id")
        .eq("id", m.id)
        .single();

      if (memberData) {
        await client.rpc("create_notification", {
          p_user_id: memberData.user_id,
          p_title: "Ajo Started! 🚀",
          p_message: `"${group.title}" has started. Your first contribution is due soon.`,
          p_type: "ajo",
          p_metadata: { group_id },
        });
      }
    }
  }

  return respond({ success: true });
}

async function handleRemind(
  client: any,
  userId: string,
  params: Record<string, unknown>
) {
  const { group_id } = params as { group_id: string };

  const { data: group } = await client
    .from("ajo_groups")
    .select("creator_id, title, current_cycle")
    .eq("id", group_id)
    .single();

  if (!group) return respond({ error: "Group not found" }, 404);
  if (group.creator_id !== userId) return respond({ error: "Only the creator can send reminders" }, 403);

  // Find unpaid contributions for current cycle
  const { data: pending } = await client
    .from("ajo_contributions")
    .select("member_id, ajo_members(user_id)")
    .eq("group_id", group_id)
    .eq("cycle_number", group.current_cycle)
    .eq("status", "pending");

  if (pending) {
    for (const c of pending) {
      const memberId = (c as any).ajo_members?.user_id;
      if (memberId) {
        await client.rpc("create_notification", {
          p_user_id: memberId,
          p_title: "Ajo Reminder 🔔",
          p_message: `Your contribution for "${group.title}" cycle ${group.current_cycle} is due!`,
          p_type: "ajo",
          p_metadata: { group_id },
        });
      }
    }
  }

  return respond({ success: true, reminded: pending?.length || 0 });
}

async function handleRemoveMember(
  client: any,
  userId: string,
  params: Record<string, unknown>
) {
  const { group_id, member_user_id } = params as { group_id: string; member_user_id: string };

  const { data: group } = await client
    .from("ajo_groups")
    .select("creator_id")
    .eq("id", group_id)
    .single();

  if (!group) return respond({ error: "Group not found" }, 404);
  if (group.creator_id !== userId) return respond({ error: "Only the creator can remove members" }, 403);
  if (member_user_id === userId) return respond({ error: "Cannot remove yourself" }, 400);

  const { data: result } = await client.rpc("remove_ajo_member", {
    p_group_id: group_id,
    p_user_id: member_user_id,
  });

  return respond(result as Record<string, unknown>);
}

async function handleLeave(
  client: any,
  userId: string,
  params: Record<string, unknown>
) {
  const { group_id } = params as { group_id: string };

  const { data: group } = await client
    .from("ajo_groups")
    .select("status, creator_id")
    .eq("id", group_id)
    .single();

  if (!group) return respond({ error: "Group not found" }, 404);
  if (group.creator_id === userId) return respond({ error: "Creator cannot leave the group" }, 400);

  // Only allow leaving during recruiting
  if (group.status !== "recruiting") {
    return respond({ error: "Cannot leave an active group" }, 400);
  }

  const { data: member } = await client
    .from("ajo_members")
    .select("id")
    .eq("group_id", group_id)
    .eq("user_id", userId)
    .single();

  if (!member) return respond({ error: "Not a member" }, 404);

  await client.from("ajo_members").update({ status: "left" }).eq("id", member.id);
  await client.from("ajo_groups").update({ filled_slots: (await client.from("ajo_members").select("id", { count: "exact" }).eq("group_id", group_id).eq("status", "active")).count || 0 }).eq("id", group_id);

  return respond({ success: true });
}

async function handleGetDetails(
  client: any,
  userId: string,
  params: Record<string, unknown>
) {
  const { group_id } = params as { group_id: string };

  const { data: group } = await client
    .from("ajo_groups")
    .select("*")
    .eq("id", group_id)
    .single();

  if (!group) return respond({ error: "Group not found" }, 404);

  // Get members with profile names
  const { data: members } = await client
    .from("ajo_members")
    .select("*, profiles:user_id(full_name, kyc_level)")
    .eq("group_id", group_id)
    .order("position");

  // Get contributions for current cycle
  const { data: contributions } = await client
    .from("ajo_contributions")
    .select("*")
    .eq("group_id", group_id)
    .eq("cycle_number", group.current_cycle);

  // Get disbursements
  const { data: disbursements } = await client
    .from("ajo_disbursements")
    .select("*")
    .eq("group_id", group_id)
    .order("cycle_number");

  // Get creator profile
  const { data: creator } = await client
    .from("profiles")
    .select("full_name")
    .eq("id", group.creator_id)
    .single();

  // Check if user is member
  const isMember = members?.some((m: any) => m.user_id === userId && m.status === "active");
  const isCreator = group.creator_id === userId;
  const userMember = members?.find((m: any) => m.user_id === userId);

  return respond({
    group,
    members,
    contributions,
    disbursements,
    creator_name: creator?.full_name,
    is_member: isMember,
    is_creator: isCreator,
    user_member: userMember,
  });
}
