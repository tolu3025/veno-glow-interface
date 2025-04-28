
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  title: string;
  message: string;
  link?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, title, message, link }: NotificationEmailRequest = await req.json();
    
    // Validate required fields
    if (!to || !title || !message) {
      console.error("Missing required fields:", { to, title, message });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Ensure email is properly formatted
    if (!to.includes('@')) {
      console.error("Invalid email address:", to);
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Add the origin to the link if it exists and is not a full URL
    const fullLink = link && !link.startsWith('http') ? 
      `${new URL(req.url).origin}${link}` : link;

    const emailResponse = await resend.emails.send({
      from: "Veno Notifications <onboarding@resend.dev>",
      to: [to],
      subject: title,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${title}</h2>
          <p>${message}</p>
          ${fullLink ? `<p><a href="${fullLink}" style="color: #2563eb; background-color: #eff6ff; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: 500;">View Details</a></p>` : ''}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #666; font-size: 0.875rem;">This is an automated notification from Veno.</p>
        </div>
      `,
    });

    console.log("Notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
