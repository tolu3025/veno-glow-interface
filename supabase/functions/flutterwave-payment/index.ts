
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

  try {
    const { paymentId, amount, currency, featureType, userEmail } = await req.json();
    
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    // Generate unique transaction reference
    const txRef = `veno_${paymentId}_${Date.now()}`;

    // Get frontend URL for redirects (remove trailing slash to avoid double slashes)
    const FRONTEND_URL = (Deno.env.get('FRONTEND_URL') || 
                         req.headers.get('referer')?.split('/pricing')[0]?.split('/cbt')[0] || 
                         'https://venobot.online').replace(/\/$/, '');
    
    // Get Supabase URL for webhook callback
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const webhookUrl = `${SUPABASE_URL}/functions/v1/flutterwave-callback`;

    const payload = {
      tx_ref: txRef,
      amount: amount,
      currency: currency,
      redirect_url: `${FRONTEND_URL}/payment/processing?tx_ref=${txRef}&payment_id=${paymentId}&feature_type=${featureType}`,
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: userEmail,
        name: userEmail.split('@')[0]
      },
      customizations: {
        title: `Veno CBT - ${featureType === 'manual_test' ? 'Manual Test Creation' : 'AI Test Creation'}`,
        description: `Payment for ${featureType.replace('_', ' ')} feature access`,
        logo: "https://venobot.online/veno-logo.png"
      },
      meta: {
        payment_id: paymentId,
        feature_type: featureType,
        webhook_url: webhookUrl
      }
    };
    
    console.log('Webhook URL configured:', webhookUrl);

    console.log('Initiating Flutterwave payment with payload:', payload);

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status === 'success') {
      console.log('Flutterwave payment initiated successfully:', data);
      
      return new Response(JSON.stringify({
        success: true,
        link: data.data.link,
        txRef: txRef
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('Flutterwave payment initiation failed:', data);
      throw new Error(data.message || 'Failed to initiate payment');
    }
  } catch (error) {
    console.error('Error in flutterwave-payment function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
