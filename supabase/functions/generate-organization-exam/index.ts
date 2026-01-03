import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface ExamGenerationRequest {
  subject: string;
  academicLevel: string;
  curriculumType: string;
  questionCount: number;
  difficulty: string;
  topic?: string;
}

const academicLevelDescriptions: Record<string, string> = {
  'jss1': 'Junior Secondary School 1 (Grade 7, ages 10-11)',
  'jss2': 'Junior Secondary School 2 (Grade 8, ages 11-12)',
  'jss3': 'Junior Secondary School 3 (Grade 9, ages 12-13)',
  'sss1': 'Senior Secondary School 1 (Grade 10, ages 13-14)',
  'sss2': 'Senior Secondary School 2 (Grade 11, ages 14-15)',
  'sss3': 'Senior Secondary School 3 (Grade 12, ages 15-16)',
  '100_level': 'University 100 Level (First Year)',
  '200_level': 'University 200 Level (Second Year)',
  '300_level': 'University 300 Level (Third Year)',
  '400_level': 'University 400 Level (Fourth Year)',
  '500_level': 'University 500 Level (Fifth Year)',
  'professional': 'Professional/Postgraduate Level',
};

const curriculumDescriptions: Record<string, string> = {
  'waec': 'West African Examinations Council (WAEC) - formal, standardized examination style',
  'neco': 'National Examinations Council (NECO) - Nigerian national examination standards',
  'jamb': 'Joint Admissions and Matriculation Board (JAMB) - university entrance examination style',
  'university': 'University-level academic examination standards',
  'custom': 'General academic examination format',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, academicLevel, curriculumType, questionCount, difficulty, topic } = await req.json() as ExamGenerationRequest;

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const levelDescription = academicLevelDescriptions[academicLevel] || academicLevel;
    const curriculumDescription = curriculumDescriptions[curriculumType] || curriculumType;

    const systemPrompt = `You are an expert examination question generator for Nigerian educational institutions. Your task is to create formal, curriculum-aligned examination questions.

IMPORTANT RULES:
1. Generate questions that are appropriate for formal examinations
2. Use clear, unambiguous academic language
3. Ensure questions test understanding, not just memorization
4. All options must be plausible - no obviously wrong answers
5. Questions should align with Nigerian curriculum standards
6. For mathematical subjects, use proper notation and clear formatting
7. Do NOT include any gamification language, emojis, or casual phrases
8. Each question must have exactly 4 options (A, B, C, D)
9. Provide brief but educational explanations for each answer`;

    const userPrompt = `Generate ${questionCount} formal examination questions for the following:

Subject: ${subject}
Academic Level: ${levelDescription}
Curriculum Standard: ${curriculumDescription}
Difficulty: ${difficulty}
${topic ? `Topic/Focus Area: ${topic}` : ''}

Requirements:
- Questions must be appropriate for formal examination settings
- Language should be academic and formal
- Each question must have exactly 4 options
- Include a brief explanation for the correct answer
- Align with Nigerian ${curriculumType.toUpperCase()} examination standards

Return the questions as a valid JSON array with this exact structure:
[
  {
    "question": "The full question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

The "answer" field should be the index (0-3) of the correct option.
Return ONLY the JSON array, no additional text.`;

    console.log(`Generating ${questionCount} questions for ${subject} at ${academicLevel} level`);

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service credits exhausted.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Extract JSON from the response
    let questions;
    try {
      // Try to parse directly first
      questions = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find array in the content
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          questions = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error('Could not parse questions from AI response');
        }
      }
    }

    // Validate questions structure
    if (!Array.isArray(questions)) {
      throw new Error('Questions must be an array');
    }

    const validatedQuestions = questions.map((q: any, index: number) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.answer !== 'number') {
        console.warn(`Question ${index} has invalid structure, attempting to fix`);
      }
      return {
        question: String(q.question || ''),
        options: (q.options || ['', '', '', '']).slice(0, 4).map(String),
        answer: typeof q.answer === 'number' ? q.answer : 0,
        explanation: String(q.explanation || 'No explanation provided'),
      };
    });

    console.log(`Successfully generated ${validatedQuestions.length} questions`);

    return new Response(JSON.stringify({ questions: validatedQuestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-organization-exam:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
