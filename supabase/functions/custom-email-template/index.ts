
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function is triggered by Supabase Auth webhook
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const payload = await req.json();
    console.log("Email template request:", payload);
    
    // This would normally look up the template in a database or external service
    // For now, we'll return a hardcoded HTML template
    
    // Check if this is the confirmation template
    if (payload.type === "signup" || payload.template === "veno-confirmation") {
      const confirmationUrl = payload.confirmation_url || "#";
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Veno Education Account</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9fafb;
            }
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            .header {
              background-color: #165B33;
              padding: 24px;
              text-align: center;
            }
            .logo-container {
              margin-bottom: 12px;
            }
            .logo {
              width: 120px;
              height: auto;
            }
            .logo-text {
              color: white;
              font-size: 28px;
              font-weight: 700;
              margin: 0;
            }
            .tagline {
              color: rgba(255, 255, 255, 0.9);
              font-size: 16px;
              margin-top: 8px;
            }
            .content {
              padding: 32px 24px;
              background-color: #ffffff;
              border-left: 1px solid #e5e7eb;
              border-right: 1px solid #e5e7eb;
            }
            .footer {
              background-color: #165B33;
              color: rgba(255, 255, 255, 0.9);
              text-align: center;
              padding: 16px 24px;
              font-size: 14px;
              border-radius: 0 0 8px 8px;
            }
            .footer p {
              margin: 6px 0;
            }
            h1 {
              color: #165B33;
              margin-top: 0;
              font-size: 24px;
              font-weight: 600;
            }
            p {
              margin-bottom: 16px;
              color: #4b5563;
            }
            .highlight {
              color: #165B33;
              font-weight: 500;
            }
            .button {
              display: inline-block;
              background-color: #165B33;
              color: #ffffff !important;
              font-weight: 600;
              text-decoration: none;
              padding: 12px 30px;
              border-radius: 6px;
              margin: 24px 0;
              text-align: center;
              transition: background-color 0.2s ease;
            }
            .button:hover {
              background-color: #0e4425;
            }
            .divider {
              height: 1px;
              background-color: #e5e7eb;
              margin: 24px 0;
            }
            .confirmation-link {
              word-break: break-all;
              color: #165B33;
              text-decoration: underline;
            }
            .contact-info {
              font-size: 14px;
              color: #6b7280;
            }
            .social-links {
              margin-top: 16px;
            }
            .social-link {
              display: inline-block;
              margin: 0 8px;
              color: white;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo-container">
                <img src="https://oavauprgngpftanumlzs.supabase.co/storage/v1/object/public/public-assets/veno-logo.png" alt="Veno Logo" class="logo">
              </div>
              <h1 class="logo-text">Veno Education</h1>
              <p class="tagline">Empowering Learning Through Innovation</p>
            </div>
            
            <div class="content">
              <h1>Confirm Your Email Address</h1>
              
              <p>Hello,</p>
              
              <p>Thank you for choosing <span class="highlight">Veno Education</span>! We're excited to have you join our community of learners and educators.</p>
              
              <p>To access all our platform features and ensure the security of your account, please confirm your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
              </div>
              
              <div class="divider"></div>
              
              <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
              
              <p><a href="${confirmationUrl}" class="confirmation-link">${confirmationUrl}</a></p>
              
              <p>This link will expire in 24 hours for security reasons.</p>
              
              <p class="contact-info">If you did not create an account with Veno Education or have any questions, please contact our support team at <a href="mailto:support@venoeducation.com">support@venoeducation.com</a>.</p>
              
              <p>Best regards,<br><span class="highlight">The Veno Education Team</span></p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Veno Education. All rights reserved.</p>
              <p>123 Education Street, Learning City, VC 12345</p>
              <div class="social-links">
                <a href="#" class="social-link">Twitter</a> |
                <a href="#" class="social-link">Facebook</a> |
                <a href="#" class="social-link">LinkedIn</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      return new Response(JSON.stringify({ html }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        }
      });
    }
    
    return new Response(JSON.stringify({ message: "Template not found" }), {
      status: 404,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      }
    });
    
  } catch (error) {
    console.error("Error processing email template:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      }
    });
  }
});
