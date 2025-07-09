
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting generate-ai-questions function');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { subject, difficulty, count, topic } = body;
    
    console.log(`Generating ${count} questions for ${subject}${topic ? ' - ' + topic : ''} at ${difficulty} level`);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OpenAI API key not configured. Please add your API key in the project settings.',
        questions: []
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const difficultyDescriptions = {
      beginner: 'basic level with fundamental concepts',
      intermediate: 'moderate complexity with some analysis required',
      advanced: 'complex problems requiring deep understanding and critical thinking'
    };

    const topicInstruction = topic ? ` specifically about "${topic}"` : '';
    const basePrompt = `Generate ${count} multiple-choice questions for ${subject}${topicInstruction} at ${difficulty} level (${difficultyDescriptions[difficulty as keyof typeof difficultyDescriptions] || 'moderate complexity'}).

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include detailed explanations for the correct answer
- Questions should be educational and test real understanding
- Vary the question types and difficulty appropriately
- Make questions relevant and meaningful

For mathematical expressions, use proper LaTeX syntax:
- Use \\( and \\) for inline math: \\(x^2 + y^2 = z^2\\)
- Use \\[ and \\] for display math: \\[\\frac{a}{b} = c\\]
- Use proper LaTeX commands like \\frac{}{}, \\sqrt{}, \\pi, \\alpha, etc.

Return the response as a valid JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text here with math like \\(x^2\\)?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Detailed explanation with step-by-step reasoning"
    }
  ]
}

The answer should be the index (0-3) of the correct option in the options array.
Generate EXACTLY ${count} questions - no more, no less.`;

    console.log('Making OpenAI request');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educator and test creator. Generate high-quality educational questions with detailed explanations. Always respond with valid JSON only. Generate exactly the number of questions requested.' 
          },
          { role: 'user', content: basePrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `OpenAI API error: ${response.status} - ${errorText}`,
        questions: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      console.error('Invalid response structure from OpenAI:', data);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid response from OpenAI',
        questions: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generatedContent = data.choices[0].message.content;
    console.log('Generated content received');

    // Parse the JSON response
    let questionsData;
    try {
      questionsData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw content:', generatedContent);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to parse AI response as JSON',
        questions: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      console.error('Invalid questions format:', questionsData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid questions format from AI',
        questions: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and clean the questions
    const validatedQuestions = questionsData.questions.map((q: any, index: number) => {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Invalid question format at index ${index}`);
      }
      
      return {
        question: q.question,
        options: q.options,
        answer: typeof q.answer === 'number' ? q.answer : 0,
        explanation: q.explanation || 'No explanation provided'
      };
    });

    console.log(`Successfully generated ${validatedQuestions.length} questions`);

    return new Response(JSON.stringify({
      success: true,
      questions: validatedQuestions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-questions function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      questions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
