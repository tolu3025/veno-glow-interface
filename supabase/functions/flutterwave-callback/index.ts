
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Flutterwave callback invoked:', { method: req.method, url: req.url });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get frontend URL from environment variable or construct from request
  const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 
                       req.headers.get('referer')?.split('/payment')[0] || 
                       'https://venobot.online';

  try {
    let status, txRef, transactionId, paymentId, featureType;

    // Handle GET requests (direct Flutterwave redirects)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      status = url.searchParams.get('status');
      txRef = url.searchParams.get('tx_ref');
      transactionId = url.searchParams.get('transaction_id');
      paymentId = url.searchParams.get('payment_id');
      featureType = url.searchParams.get('feature_type');
      
      console.log('Flutterwave redirect received (GET):', { status, txRef, transactionId, paymentId, featureType });
      
      // Continue processing to verify and then redirect
    }

    // Handle POST requests (both webhooks from Flutterwave and verification from frontend)
    if (req.method === 'POST') {
      let body;
      try {
        body = await req.json();
        console.log('POST request received:', JSON.stringify(body, null, 2));
      } catch (error) {
        console.error('Failed to parse request body:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if this is a Flutterwave webhook
      if (body.event === 'charge.completed' && body.data) {
        console.log('Flutterwave webhook detected');
        status = body.data.status;
        transactionId = body.data.id.toString();
        txRef = body.data.tx_ref;
        
        // Extract payment_id from tx_ref (format: veno_{payment_id}_{timestamp})
        if (txRef && txRef.startsWith('veno_')) {
          const parts = txRef.split('_');
          paymentId = parts[1];
        }
        
        // Get feature_type from metadata
        if (body.data.meta) {
          paymentId = paymentId || body.data.meta.payment_id;
          featureType = body.data.meta.feature_type;
        }
        
        console.log('Extracted from webhook:', { status, transactionId, txRef, paymentId, featureType });
      } else {
        // Manual verification from frontend
        console.log('Manual verification from frontend');
        status = body.status;
        transactionId = body.transaction_id;
        txRef = body.tx_ref;
        paymentId = body.payment_id;
        featureType = body.feature_type;
        console.log('Frontend verification params:', { status, txRef, transactionId, paymentId, featureType });
      }
    }

    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasFlutterwaveKey: !!flutterwaveSecretKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });

    if (!flutterwaveSecretKey || !supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables', {
        flutterwaveSecretKey: !!flutterwaveSecretKey,
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
      
      if (req.method === 'GET') {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${FRONTEND_URL}/payment/failed`
          }
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Configuration error - missing required secrets',
        details: {
          hasFlutterwaveKey: !!flutterwaveSecretKey,
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseKey
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle cancelled or failed payments
    if (status === 'cancelled' || status === 'failed' || !transactionId) {
      console.log('Payment cancelled or failed:', status);
      
      if (req.method === 'GET') {
        // Redirect to /cbt for cancelled payments, /payment/failed for failed
        const redirectPath = status === 'cancelled' ? '/cbt' : '/payment/failed';
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${FRONTEND_URL}${redirectPath}`
          }
        });
      }
      
      return new Response(JSON.stringify({ success: false, status: status || 'failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (status === 'successful' && transactionId) {
      console.log('Verifying transaction with Flutterwave:', transactionId);
      
      // Verify the transaction with Flutterwave
      const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Flutterwave API response status:', verifyResponse.status);
      const verifyData = await verifyResponse.json();
      console.log('Flutterwave verification response:', JSON.stringify(verifyData, null, 2));

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
          // Include payment details in redirect URL
          const successUrl = new URL(`${FRONTEND_URL}/payment/success`);
          if (transactionPaymentId) successUrl.searchParams.set('payment_id', transactionPaymentId);
          if (transactionFeatureType) successUrl.searchParams.set('feature_type', transactionFeatureType);
          
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': successUrl.toString()
            }
          });
        }
        
        return new Response(JSON.stringify({ success: true, status: 'successful' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.log('Payment verification failed:', verifyData);
        
        if (req.method === 'GET') {
          // Include transaction details for retry
          const failedUrl = new URL(`${FRONTEND_URL}/payment/failed`);
          if (transactionId) failedUrl.searchParams.set('transaction_id', transactionId);
          if (txRef) failedUrl.searchParams.set('tx_ref', txRef);
          if (transactionPaymentId) failedUrl.searchParams.set('payment_id', transactionPaymentId);
          if (transactionFeatureType) failedUrl.searchParams.set('feature_type', transactionFeatureType);
          
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': failedUrl.toString()
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
      const failedUrl = new URL(`${FRONTEND_URL}/payment/failed`);
      if (transactionId) failedUrl.searchParams.set('transaction_id', transactionId);
      if (txRef) failedUrl.searchParams.set('tx_ref', txRef);
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': failedUrl.toString()
        }
      });
    }
    
    return new Response(JSON.stringify({ success: false, status: 'unknown' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in flutterwave-callback function:', error);
    
    if (req.method === 'GET') {
      // Get FRONTEND_URL safely in catch block
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://venobot.online';
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${frontendUrl}/payment/failed?error=${encodeURIComponent(error.message)}`
        }
      });
    }
    
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
