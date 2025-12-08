import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get difficulty based on streak level
function getDifficultyFromStreak(streak: number, is4MinMode: boolean): string {
  let difficulty: string;
  
  if (streak <= 4) {
    difficulty = 'easy';
  } else if (streak <= 10) {
    difficulty = 'medium';
  } else if (streak <= 20) {
    difficulty = 'hard';
  } else {
    difficulty = 'expert';
  }
  
  // Boost difficulty for 4-minute mode
  if (is4MinMode) {
    if (difficulty === 'easy') difficulty = 'medium';
    else if (difficulty === 'medium') difficulty = 'hard';
    else if (difficulty === 'hard') difficulty = 'expert';
  }
  
  return difficulty;
}

// Get question count based on duration
function getQuestionCount(durationSeconds: number): number {
  switch (durationSeconds) {
    case 30: return 3;
    case 60: return 5;
    case 120: return 10;
    case 240: return 15;
    default: return 5;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, durationSeconds, hostStreak } = await req.json();
    
    console.log(`Generating challenge questions: subject=${subject}, duration=${durationSeconds}, streak=${hostStreak}`);
    
    const is4MinMode = durationSeconds === 240;
    const difficulty = getDifficultyFromStreak(hostStreak || 0, is4MinMode);
    const questionCount = getQuestionCount(durationSeconds);
    
    console.log(`Calculated: difficulty=${difficulty}, questionCount=${questionCount}`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert question generator for educational assessments. Generate exactly ${questionCount} multiple-choice questions about ${subject} at ${difficulty} difficulty level.

Each question must have:
- A clear, concise question text
- Exactly 4 options (labeled A, B, C, D)
- One correct answer (index 0-3)
- A brief explanation

Return a JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

IMPORTANT: 
- Return ONLY the JSON array, no additional text
- For ${difficulty} difficulty: ${difficulty === 'easy' ? 'Basic concepts, straightforward questions' : difficulty === 'medium' ? 'Moderate complexity, requires understanding' : difficulty === 'hard' ? 'Complex scenarios, deeper knowledge needed' : 'Expert-level, highly challenging questions'}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${questionCount} ${difficulty} difficulty questions about ${subject} for a competitive challenge.` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }
    
    // Parse the JSON response
    let questions;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse generated questions');
    }
    
    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }
    
    // Ensure each question has required fields
    questions = questions.map((q: any, idx: number) => ({
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
      answer: typeof q.answer === 'number' ? q.answer : 0,
      explanation: q.explanation || 'No explanation provided',
    }));

    console.log(`Successfully generated ${questions.length} questions`);

    return new Response(JSON.stringify({ 
      questions, 
      difficulty,
      questionCount: questions.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-challenge-questions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
