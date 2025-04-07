
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name?: string;
  confirmationUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { email, name, confirmationUrl }: EmailRequest = await req.json();
    
    if (!email || !confirmationUrl) {
      throw new Error("Email and confirmationUrl are required");
    }

    console.log("Sending confirmation email to:", email);
    console.log("Confirmation URL:", confirmationUrl);
    
    // Check if SMTP password is set
    const smtpPassword = Deno.env.get("BREVO_SMTP_PASSWORD");
    if (!smtpPassword) {
      console.error("BREVO_SMTP_PASSWORD is not set in environment variables");
      throw new Error("SMTP configuration is incomplete");
    }
    
    // Setup SMTP client with Brevo settings
    const client = new SMTPClient({
      connection: {
        hostname: "smtp-relay.brevo.com",
        port: 587,
        tls: true,
        auth: {
          username: "89756a003@smtp-brevo.com",
          password: smtpPassword,
        },
      },
    });

    // Prepare HTML for the email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirm Your Veno Education Account</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
          }
          .header {
            background-color: #165B33;
            padding: 20px;
            text-align: center;
            border-radius: 4px 4px 0 0;
          }
          .logo {
            color: white;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
            border-left: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }
          .footer {
            background-color: #165B33;
            color: white;
            text-align: center;
            padding: 10px 20px;
            font-size: 12px;
            border-radius: 0 0 4px 4px;
          }
          h1 {
            color: #165B33;
            margin-top: 0;
          }
          p {
            margin-bottom: 15px;
          }
          .button {
            display: inline-block;
            background-color: #165B33;
            color: #ffffff !important;
            font-weight: bold;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 class="logo">Veno Education</h1>
          </div>
          
          <div class="content">
            <h1>Confirm Your Email Address</h1>
            
            <p>Hello${name ? ' ' + name : ''},</p>
            
            <p>Thank you for registering with Veno Education! We're excited to have you join our community of learners.</p>
            
            <p>To complete your registration and access all our features, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
            </div>
            
            <div class="divider"></div>
            
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            
            <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <p>If you did not create an account with Veno Education, please disregard this email.</p>
            
            <p>Best regards,<br>The Veno Education Team</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Veno Education. All rights reserved.</p>
            <p>This email was sent to you because someone (hopefully you) signed up for a Veno account.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    await client.send({
      from: {
        address: "bot@venobot.online",
        name: "Veno",
      },
      to: [
        {
          address: email,
          name: name || email,
        },
      ],
      subject: "Confirm Your Veno Education Account",
      html: htmlContent,
    });

    // Close the connection
    await client.close();
    
    console.log("Email sent successfully to:", email);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      }
    });
    
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      }
    });
  }
});
