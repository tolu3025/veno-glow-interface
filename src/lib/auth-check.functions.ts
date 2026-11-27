import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Checks whether a user with the given email exists in auth.users via the
// SECURITY DEFINER RPC `email_exists`. Uses the anon key only — does NOT
// require SUPABASE_SERVICE_ROLE_KEY at runtime, so it works in any deploy.
export const checkEmailExists = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().email().max(255) }).parse(input)
  )
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const anon =
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !anon) {
      // Fail-open so the reset flow still proceeds.
      return { exists: true };
    }

    const client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: result, error } = await client.rpc("email_exists", {
      p_email: data.email.trim().toLowerCase(),
    });
    if (error) {
      console.error("[checkEmailExists] rpc error:", error.message);
      return { exists: true };
    }
    return { exists: !!result };
  });
