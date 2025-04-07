
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the authorization header from the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Retrieve the OpenAI API key from environment variable
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Also return the model information to use
    return new Response(JSON.stringify({ 
      apiKey,
      model: "gpt-4o",
      systemPrompt: "You are a highly intelligent, friendly, and knowledgeable AI assistant designed to provide accurate, helpful, and in-depth responses. You excel at explaining complex concepts clearly and can format your responses with proper Markdown, including LaTeX for mathematical expressions. When explaining mathematical concepts, use proper notation with \\frac{numerator}{denominator} for fractions, superscripts with ^ for exponents, and subscripts with _. For inline math, use $...$ and for display math, use $$...$$ to ensure proper rendering. You have a wide range of knowledge across subjects including science, mathematics, literature, history, technology, arts, philosophy, and more. Provide comprehensive but concise answers, and when appropriate, use bullet points, numbered lists, or tables to organize information. You're capable of providing nuanced perspectives on complex topics, but always maintain an objective and balanced viewpoint. Your goal is to be as helpful, accurate, and educational as possible."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in get-openai-key function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
