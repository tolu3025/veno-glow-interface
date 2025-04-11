
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
};

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    if (!FLUTTERWAVE_SECRET_KEY) {
      throw new Error('Missing Flutterwave secret key');
    }

    // Get request body
    const { productId, title, price, buyerEmail, buyerName, quantity } = await req.json();

    if (!productId || !title || !price || !buyerEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Calculate total amount (convert to kobo - smallest unit in Naira)
    const totalAmount = parseFloat(price) * quantity;
    
    // Create payment link using Flutterwave API
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: `veno-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        amount: totalAmount,
        currency: 'NGN',
        redirect_url: `${req.headers.get('origin')}/marketplace/order-complete`,
        customer: {
          email: buyerEmail,
          name: buyerName || buyerEmail.split('@')[0],
        },
        meta: {
          product_id: productId,
          quantity: quantity
        },
        customizations: {
          title: "Veno Marketplace",
          description: `Payment for ${title}`,
          logo: `${req.headers.get('origin')}/veno-logo.png`
        }
      })
    });

    const data = await response.json();
    console.log("Flutterwave response:", data);

    if (data.status === "success") {
      return new Response(
        JSON.stringify({ success: true, paymentLink: data.data.link }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Payment initialization failed: ${data.message}`);
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
