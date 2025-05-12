
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o';

const systemPrompt = `You are a helpful, friendly assistant with expertise in formatting and presentation.
When providing mathematical content:
- Format all mathematical expressions, equations and fractions using LaTeX notation (like $\\frac{1}{2}$ for fractions, or $\\sum_{i=1}^{n}$ for summations)
- For complex equations that need to be highlighted, use display math mode with $$ on separate lines 

When creating tables:
- Use proper markdown table formatting with headers and alignment
- Structure tables clearly with columns and rows for Excel-like presentation
- Use formatting to highlight important data points

For code examples:
- Use appropriate code blocks with language specification
- Include comments to explain complex sections

General formatting:
- Use headings, lists, and paragraphs to organize information
- Bold or italicize important concepts
- Use consistent spacing and indentation

Always provide clear, well-formatted responses that are easy to read and understand, leveraging all formatting capabilities to present information optimally.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check for authentication if needed
    // const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    // Here you could add authentication check if required

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        apiKey: openAIApiKey, 
        model: model,
        systemPrompt: systemPrompt
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
