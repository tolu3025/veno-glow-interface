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
  const title = isPasswordReset ? 'Reset Your Password' : 'Confirm Your Email';
  const subject = isPasswordReset ? 'Reset Your VenoBot Password' : 'Confirm Your VenoBot Account';
  const buttonText = isPasswordReset ? 'Reset Password' : 'Confirm Email';
  const mainMessage = isPasswordReset 
    ? 'We received a request to reset your password. Click the button below to create a new password:'
    : 'Thank you for joining VenoBot! Please confirm your email address to unlock all features and start your learning journey:';
  const expiryMessage = isPasswordReset 
    ? 'This link will expire in 1 hour for security reasons.'
    : 'This link will expire in 24 hours for security reasons.';
  const ignoreMessage = isPasswordReset
    ? "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged."
    : "If you didn't create an account with VenoBot, please ignore this email.";

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
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #15803d 50%, #22c55e 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <!-- Logo Circle -->
                    <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: inline-block; line-height: 80px;">
                      <span style="font-size: 40px; color: #ffffff; font-weight: bold;">V</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">VenoBot</h1>
                    <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Smart Learning, Better Results</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <!-- Icon -->
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; margin: 0 auto; display: inline-block; line-height: 64px;">
                      <span style="font-size: 28px;">${isPasswordReset ? '🔐' : '✉️'}</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Title -->
                <tr>
                  <td style="text-align: center; padding-bottom: 16px;">
                    <h2 style="margin: 0; color: #166534; font-size: 24px; font-weight: 600;">${title}</h2>
                  </td>
                </tr>
                
                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">Hello${name ? ' <strong>' + name + '</strong>' : ''},</p>
                  </td>
                </tr>
                
                <!-- Main Message -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">${mainMessage}</p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="text-align: center; padding-bottom: 28px;">
                    <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #166534 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(22, 101, 52, 0.3);">${buttonText}</a>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 20px 0;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);"></div>
                  </td>
                </tr>
                
                <!-- Alternative Link -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">If the button doesn't work, copy and paste this link into your browser:</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <p style="margin: 0; background-color: #f3f4f6; padding: 12px 16px; border-radius: 8px; word-break: break-all;">
                      <a href="${actionUrl}" style="color: #166534; text-decoration: none; font-size: 12px;">${actionUrl}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Expiry Notice -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 13px;">⏰ ${expiryMessage}</p>
                    </div>
                  </td>
                </tr>
                
                <!-- Security Notice -->
                <tr>
                  <td>
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6; font-style: italic;">${ignoreMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #166534; border-radius: 0 0 16px 16px; padding: 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 16px;">
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Stay Connected</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-bottom: 20px;">
                    <!-- Social Links -->
                    <a href="https://twitter.com/venobot" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 6px; line-height: 36px; text-decoration: none;">
                      <span style="color: #ffffff; font-size: 14px;">𝕏</span>
                    </a>
                    <a href="https://facebook.com/venobot" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 6px; line-height: 36px; text-decoration: none;">
                      <span style="color: #ffffff; font-size: 14px;">f</span>
                    </a>
                    <a href="https://instagram.com/venobot" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 6px; line-height: 36px; text-decoration: none;">
                      <span style="color: #ffffff; font-size: 14px;">📷</span>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-bottom: 12px;">
                    <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">
                      Need help? Contact us at <a href="mailto:support@venobot.online" style="color: #86efac; text-decoration: none;">support@venobot.online</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 11px;">
                      © ${new Date().getFullYear()} VenoBot. All rights reserved.<br>
                      <a href="https://venobot.online" style="color: rgba(255,255,255,0.6); text-decoration: none;">venobot.online</a>
                    </p>
                  </td>
                </tr>
              </table>
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
