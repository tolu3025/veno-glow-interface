import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { codeBlock, renderEmail, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, otp_code } = await req.json();

    if (!email || !otp_code) {
      return new Response(JSON.stringify({ error: "Missing email or otp_code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = renderEmail({
      title: "Your KukaPay verification code",
      heading: "Verify it's you",
      intro: "Enter the 6-digit code below to confirm it's you and continue on KukaPay.",
      body: codeBlock(String(otp_code)),
      note: "This code expires in 5 minutes. Never share it with anyone — KukaPay will never ask for your code.",
    });

    const result = await sendEmail(email, `Your KukaPay verification code: ${otp_code}`, html);

    return new Response(JSON.stringify({ success: result.ok, data: result.data }), {
      status: result.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[send-2fa-otp] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
