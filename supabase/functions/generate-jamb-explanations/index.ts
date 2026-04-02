import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const { questions } = await req.json();
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error('Questions array is required');
    }

    // Process in batches of up to 10 questions at a time
    const batchSize = 10;
    const allExplanations: Record<string, string> = {};

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);

      const prompt = batch.map((q: any, idx: number) => {
        const options = Object.entries(q.option || {})
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
          .join('\n');

        return `Question ${i + idx + 1}:
${q.question}
Options:
${options}
Correct Answer: ${(q.answer || '').toUpperCase()}
Subject: ${q.subject || 'General'}`;
      }).join('\n\n---\n\n');

      const systemPrompt = `You are a JAMB exam tutor. For each question, provide a clear, concise explanation of WHY the correct answer is right. 

Rules:
- For Mathematics, Physics, Chemistry, Accounting: Show step-by-step workings with calculations
- For English/Literature: Explain grammar rules, comprehension context, or literary analysis
- For other subjects: Give clear factual reasoning
- Keep each explanation 2-5 sentences (longer for math/calculations)
- Use simple language a secondary school student would understand
- For math: Show the formula, substitute values, and solve step by step
- Format math expressions clearly (e.g., "2x + 3 = 7, so 2x = 4, x = 2")

Return a JSON object where keys are question numbers (like "1", "2") and values are the explanation strings. Return ONLY valid JSON, no markdown.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI error:', errorText);
        // Continue without explanations for this batch
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          const parsed = JSON.parse(content);
          Object.entries(parsed).forEach(([key, value]) => {
            // Map batch-relative keys to absolute indices
            const relativeIndex = parseInt(key) - 1;
            const absoluteIndex = i + relativeIndex;
            allExplanations[String(absoluteIndex)] = value as string;
          });
        } catch (parseErr) {
          console.error('Failed to parse explanations:', parseErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ explanations: allExplanations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
