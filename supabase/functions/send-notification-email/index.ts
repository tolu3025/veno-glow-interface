
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Send the email using Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': Deno.env.get('BREVO_API_KEY') || '',
      },
      body: JSON.stringify({
        sender: {
          name: 'Veno Notifications',
          email: 'notifications@veno.com'
        },
        to: [{ email: to }],
        subject: title,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${title}</h2>
            <p>${message}</p>
            ${fullLink ? `<p><a href="${fullLink}" style="color: #2563eb; background-color: #eff6ff; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: 500;">View Details</a></p>` : ''}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #666; font-size: 0.875rem;">This is an automated notification from Veno.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    console.log("Notification email sent successfully to:", to);

    return new Response(JSON.stringify({ success: true }), {
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
