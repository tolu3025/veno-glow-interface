import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name?: string;
  confirmationUrl: string;
  type?: 'confirmation' | 'password_reset';
}

const getEmailTemplate = (name: string, actionUrl: string, type: 'confirmation' | 'password_reset') => {
  const isPasswordReset = type === 'password_reset';
  const title = isPasswordReset ? '🔐 Password Reset Request' : '✉️ Email Verification';
  const subject = isPasswordReset ? '🔐 Password Reset Request - VenoBot' : '✉️ Confirm Your Email - VenoBot';
  const buttonText = isPasswordReset ? 'Reset My Password' : 'Verify My Email';
  const mainMessage = isPasswordReset 
    ? 'We received a request to reset your password for your <strong>VenoBot</strong> account.'
    : 'Welcome to <strong>VenoBot</strong>! Please verify your email address to complete your registration.';
  const actionPrompt = isPasswordReset 
    ? 'Click the button below to securely reset your password:'
    : 'Click the button below to verify your email:';
  const securityNote = isPasswordReset
    ? "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged."
    : "If you didn't create an account with VenoBot, you can safely ignore this email.";
  const footerNote = isPasswordReset
    ? 'For security reasons, we cannot reset your password without clicking the link above.'
    : 'For security reasons, we cannot verify your account without clicking the link above.';

  return {
    subject,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1a1a2e;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #16213e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          
          <!-- Blue Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">${isPasswordReset ? '🔐' : '✉️'}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #1e2a47; padding: 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                
                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">Hello${name ? ', ' + name : ''},</p>
                  </td>
                </tr>
                
                <!-- Main Message -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #b8c5d6; font-size: 16px; line-height: 1.6;">${mainMessage}</p>
                  </td>
                </tr>
                
                <!-- Action Prompt -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0; color: #b8c5d6; font-size: 16px; line-height: 1.6;">${actionPrompt}</p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="text-align: center; padding-bottom: 28px;">
                    <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(0, 102, 204, 0.4);">${buttonText}</a>
                  </td>
                </tr>
                
                <!-- Alternative Link -->
                <tr>
                  <td style="padding-bottom: 12px;">
                    <p style="margin: 0; color: #8899aa; font-size: 14px;">Or copy and paste this link into your browser:</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="background-color: #0d1528; padding: 16px; border-radius: 8px; word-break: break-all;">
                      <a href="${actionUrl}" style="color: #4da6ff; text-decoration: none; font-size: 14px; line-height: 1.5;">${actionUrl}</a>
                    </div>
                  </td>
                </tr>
                
                <!-- Expiry Warning -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="background-color: #3d2a00; border-left: 4px solid #ffaa00; padding: 16px; border-radius: 0 8px 8px 0;">
                      <p style="margin: 0; color: #ffd699; font-size: 14px;">
                        <strong style="color: #ffaa00;">⚠️ Important:</strong> This link will expire in <strong style="color: #ffaa00;">15 minutes</strong> for security reasons.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Security Notice -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #8899aa; font-size: 14px; line-height: 1.6;">${securityNote}</p>
                  </td>
                </tr>
                
                <!-- Footer Note -->
                <tr>
                  <td>
                    <p style="margin: 0; color: #667788; font-size: 13px; line-height: 1.5;">${footerNote}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #2a3a50; padding: 24px 30px; text-align: center;">
              <p style="margin: 0; color: #22c55e; font-size: 14px; font-weight: 600;">VenoBot</p>
              <p style="margin: 8px 0 0; color: #667788; font-size: 12px;">Your AI-Powered Learning Companion</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { email, name, confirmationUrl, type = 'confirmation' }: EmailRequest = await req.json();
    
    if (!email || !confirmationUrl) {
      throw new Error("Email and confirmationUrl are required");
    }

    console.log(`Sending ${type} email to:`, email);
    console.log("Action URL:", confirmationUrl);
    
    // Check if API key is set
    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) {
      console.error("BREVO_API_KEY is not set in environment variables");
      throw new Error("Email API configuration is incomplete");
    }

    const displayName = name || email.split('@')[0];
    const emailContent = getEmailTemplate(displayName, confirmationUrl, type);

    // Send the email using Brevo REST API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'VenoBot', email: 'bot@venobot.online' },
        to: [{ email: email, name: displayName }],
        subject: emailContent.subject,
        htmlContent: emailContent.html,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    const result = await response.json();
    console.log(`${type} email sent successfully to:`, email, "Message ID:", result.messageId);
    
    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      }
    });
    
  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      }
    });
  }
});
