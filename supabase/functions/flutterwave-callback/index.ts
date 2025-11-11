
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get frontend URL from environment variable or construct from request
  const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 
                       req.headers.get('referer')?.split('/payment')[0] || 
                       'https://venobot.online';

  try {
    let status, txRef, transactionId, paymentId, featureType;

    // Handle GET requests (direct Flutterwave redirects - for backwards compatibility)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      status = url.searchParams.get('status');
      txRef = url.searchParams.get('tx_ref');
      transactionId = url.searchParams.get('transaction_id');
      
      console.log('Flutterwave callback received (GET):', { status, txRef, transactionId });
      
      // Redirect to frontend with parameters
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${FRONTEND_URL}/payment/processing?status=${status || 'failed'}&transaction_id=${transactionId || ''}&tx_ref=${txRef || ''}`
        }
      });
    }

    // Handle POST requests (verification from frontend)
    if (req.method === 'POST') {
      const body = await req.json();
      status = body.status;
      transactionId = body.transaction_id;
      txRef = body.tx_ref;
      paymentId = body.payment_id;
      featureType = body.feature_type;
      
      console.log('Payment verification request received:', { status, txRef, transactionId, paymentId, featureType });
    }

    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!flutterwaveSecretKey || !supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables');
      
      if (req.method === 'GET') {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${FRONTEND_URL}/payment/failed`
          }
        });
      }
      
      return new Response(JSON.stringify({ success: false, error: 'Configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle cancelled or failed payments
    if (status === 'cancelled' || status === 'failed' || !transactionId) {
      console.log('Payment cancelled or failed:', status);
      
      if (req.method === 'GET') {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${FRONTEND_URL}/payment/failed`
          }
        });
      }
      
      return new Response(JSON.stringify({ success: false, status: status || 'failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (status === 'successful' && transactionId) {
      // Verify the transaction with Flutterwave
      const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const verifyData = await verifyResponse.json();
      console.log('Flutterwave verification response:', verifyData);

      if (verifyData.status === 'success' && verifyData.data.status === 'successful') {
        console.log('Payment verified successfully');
        
        // Get payment details from transaction or request
        const transactionPaymentId = verifyData.data.meta?.payment_id || paymentId;
        const transactionFeatureType = verifyData.data.meta?.feature_type || featureType;

        if (transactionPaymentId && transactionFeatureType) {
          // Update payment status
          await supabase
            .from('user_payments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              stripe_payment_intent_id: transactionId
            })
            .eq('id', transactionPaymentId);

          // Get user from payment
          const { data: payment } = await supabase
            .from('user_payments')
            .select('user_id')
            .eq('id', transactionPaymentId)
            .single();

          if (payment) {
            // Calculate expiry date (1 month from now)
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            
            // Grant feature access with unlimited access for monthly subscription
            await supabase
              .from('user_feature_access')
              .upsert({
                user_id: payment.user_id,
                feature_type: transactionFeatureType,
                access_count: -1, // Unlimited for monthly subscription
                unlimited_access: true,
                expires_at: expiryDate.toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,feature_type'
              });
          }
        }

        // Return success response for POST or redirect for GET
        if (req.method === 'GET') {
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${FRONTEND_URL}/payment/success`
            }
          });
        }
        
        return new Response(JSON.stringify({ success: true, status: 'successful' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.log('Payment verification failed:', verifyData);
        
        if (req.method === 'GET') {
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${FRONTEND_URL}/payment/failed`
            }
          });
        }
        
        return new Response(JSON.stringify({ success: false, error: 'Verification failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Redirect to failure page for any other case
    console.log('Payment not successful, redirecting to failed page');
    
    if (req.method === 'GET') {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${FRONTEND_URL}/payment/failed`
        }
      });
    }
    
    return new Response(JSON.stringify({ success: false, status: 'unknown' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in flutterwave-callback function:', error);
    
    if (req.method === 'GET') {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${FRONTEND_URL}/payment/failed`
        }
      });
    }
    
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
