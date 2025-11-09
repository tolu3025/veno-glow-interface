
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

  const FRONTEND_URL = req.headers.get('origin') || 'https://veno.app';

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const txRef = url.searchParams.get('tx_ref');
    const transactionId = url.searchParams.get('transaction_id');

    console.log('Flutterwave callback received:', { status, txRef, transactionId });

    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!flutterwaveSecretKey || !supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${FRONTEND_URL}/payment/failed`
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle cancelled or failed payments
    if (status === 'cancelled' || status === 'failed' || !transactionId) {
      console.log('Payment cancelled or failed:', status);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${FRONTEND_URL}/payment/failed`
        }
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
        
        const paymentId = verifyData.data.meta?.payment_id;
        const featureType = verifyData.data.meta?.feature_type;

        if (paymentId && featureType) {
          // Update payment status
          await supabase
            .from('user_payments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              stripe_payment_intent_id: transactionId
            })
            .eq('id', paymentId);

          // Get user from payment
          const { data: payment } = await supabase
            .from('user_payments')
            .select('user_id')
            .eq('id', paymentId)
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
                feature_type: featureType,
                access_count: -1, // Unlimited for monthly subscription
                unlimited_access: true,
                expires_at: expiryDate.toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,feature_type'
              });
          }
        }

        // Redirect to success page
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${FRONTEND_URL}/payment/success`
          }
        });
      } else {
        console.log('Payment verification failed:', verifyData);
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${FRONTEND_URL}/payment/failed`
          }
        });
      }
    }

    // Redirect to failure page for any other case
    console.log('Payment not successful, redirecting to failed page');
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/payment/failed`
      }
    });

  } catch (error) {
    console.error('Error in flutterwave-callback function:', error);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/payment/failed`
      }
    });
  }
});
