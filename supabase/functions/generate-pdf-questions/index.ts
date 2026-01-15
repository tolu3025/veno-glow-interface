import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI Academic Question Generator built for Nigerian tertiary institutions.
Your role is to generate examination and test questions strictly from the provided document content.
You must behave and think like a Nigerian Lecturer when setting questions.

CORE RULES:
1. STRICT DOCUMENT USAGE: Generate questions ONLY from the provided document content. Do NOT use external knowledge.
2. If the answer is not inside the document, respond with: "This information is not contained in the uploaded material."
3. LECTURER MODE: Think like a Nigerian lecturer - test understanding, not memorization. Use real academic tone. Mix theory + application questions. Use Nigerian academic standards (WAEC, JAMB, University style).
4. NO MARKDOWN: Do NOT use *, #, or bullet markdown. Use LaTeX formatting only for equations and numbering.

QUESTION STYLE:
- Cover all major topics in the document
- Increase in difficulty progressively
- Include definitions, explanations, applications, and calculations (if present in document)

OUTPUT FORMAT:
Generate questions in this exact format:

SECTION A: OBJECTIVE QUESTIONS (10 questions)
Each question should have 4 options (A, B, C, D) with only one correct answer.
Format each as:
1. Question text
   A. Option 1
   B. Option 2
   C. Option 3
   D. Option 4
   [Correct: X]

SECTION B: SHORT ANSWER QUESTIONS (5 questions)
Questions requiring brief explanations (2-3 sentences each).
Format each as:
1. Question text
   [Expected Answer: Brief answer]

SECTION C: ESSAY QUESTIONS (5 questions)
Questions requiring detailed explanations and critical thinking.
Format each as:
1. Question text
   [Key Points: Main points to cover]

Use LaTeX notation for any mathematical expressions: \\( \\) for inline and \\[ \\] for display math.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { course_name, course_code, course_title, pdf_content, difficulty = 'intermediate' } = await req.json();

    if (!pdf_content || pdf_content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No document content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Generate examination questions for the following course:
Course Name: ${course_name || 'Not specified'}
Course Code: ${course_code || 'Not specified'}
Course Title: ${course_title || 'Not specified'}
Difficulty Level: ${difficulty}

DOCUMENT CONTENT:
${pdf_content.substring(0, 50000)}

Generate questions strictly based on the above content. Follow the format specified in your instructions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedQuestions = data.choices[0]?.message?.content;

    if (!generatedQuestions) {
      return new Response(
        JSON.stringify({ error: 'No questions generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the generated questions into structured format
    const sections = parseQuestions(generatedQuestions);

    return new Response(
      JSON.stringify({ 
        success: true, 
        questions: generatedQuestions,
        sections,
        course: { course_name, course_code, course_title }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating questions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseQuestions(text: string) {
  const sections = {
    sectionA: [] as any[],
    sectionB: [] as any[],
    sectionC: [] as any[],
  };

  console.log('Parsing questions from text length:', text.length);

  // More flexible section matching
  const sectionAMatch = text.match(/SECTION\s*A[:\s]*(?:OBJECTIVE\s*)?QUESTIONS?[\s\S]*?(?=SECTION\s*B|$)/i);
  const sectionBMatch = text.match(/SECTION\s*B[:\s]*(?:SHORT\s*ANSWER\s*)?QUESTIONS?[\s\S]*?(?=SECTION\s*C|$)/i);
  const sectionCMatch = text.match(/SECTION\s*C[:\s]*(?:ESSAY\s*)?QUESTIONS?[\s\S]*$/i);

  if (sectionAMatch) {
    // Match questions with various formats
    const objectiveQuestions = sectionAMatch[0].match(/(?:^|\n)\s*(\d+)\.\s*[\s\S]*?(?=(?:\n\s*\d+\.)|$)/gm);
    
    if (objectiveQuestions) {
      sections.sectionA = objectiveQuestions.map((q, i) => {
        const lines = q.trim().split('\n').filter(l => l.trim());
        let questionText = lines[0]?.replace(/^\d+\.\s*/, '').trim() || '';
        const options: string[] = [];
        let correctAnswer = '';

        // Check if question continues to next line before options
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j].trim();
          if (line.match(/^[A-Da-d][\.\)]/)) break;
          if (!line.match(/\[Correct|Answer/i)) {
            questionText += ' ' + line;
          }
        }

        lines.forEach(line => {
          // Match various option formats: A. , A), a., (A), etc.
          const optMatch = line.match(/^[\(\s]*([A-Da-d])[\.\)\s]+(.+)/i);
          if (optMatch) {
            options.push(optMatch[2].replace(/\[Correct.*\]/i, '').trim());
          }
          // Match correct answer in various formats
          const correctMatch = line.match(/\[(?:Correct|Answer)[:\s]*([A-Da-d])\]/i) ||
                              line.match(/(?:Correct|Answer)[:\s]*([A-Da-d])/i);
          if (correctMatch) {
            correctAnswer = correctMatch[1].toUpperCase();
          }
        });

        // If no correct answer found, try to find it in the question block
        if (!correctAnswer) {
          const blockMatch = q.match(/\[(?:Correct|Answer)[:\s]*([A-Da-d])\]/i);
          if (blockMatch) {
            correctAnswer = blockMatch[1].toUpperCase();
          }
        }

        return {
          id: i + 1,
          question: questionText.trim(),
          options,
          correctAnswer: ['A', 'B', 'C', 'D'].indexOf(correctAnswer),
          type: 'objective'
        };
      }).filter(q => q.question && q.options.length >= 2);
    }
    
    console.log('Parsed Section A questions:', sections.sectionA.length);
  }

  if (sectionBMatch) {
    const shortQuestions = sectionBMatch[0].match(/(?:^|\n)\s*(\d+)\.\s*[\s\S]*?(?=(?:\n\s*\d+\.)|$)/gm);
    
    if (shortQuestions) {
      sections.sectionB = shortQuestions.map((q, i) => {
        const lines = q.trim().split('\n').filter(l => l.trim());
        let questionText = lines[0]?.replace(/^\d+\.\s*/, '').trim() || '';
        
        // Question might continue on next lines
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j].trim();
          if (line.match(/\[Expected|Answer/i)) break;
          questionText += ' ' + line;
        }
        
        const answerMatch = q.match(/\[Expected\s*Answer[:\s]*([\s\S]*?)\]/i) ||
                           q.match(/Answer[:\s]*([\s\S]*?)(?:\n\d+\.|$)/i);
        
        return {
          id: i + 1,
          question: questionText.replace(/\[Expected.*\]/i, '').trim(),
          expectedAnswer: answerMatch ? answerMatch[1].trim() : '',
          type: 'short_answer'
        };
      }).filter(q => q.question);
    }
    
    console.log('Parsed Section B questions:', sections.sectionB.length);
  }

  if (sectionCMatch) {
    const essayQuestions = sectionCMatch[0].match(/(?:^|\n)\s*(\d+)\.\s*[\s\S]*?(?=(?:\n\s*\d+\.)|$)/gm);
    
    if (essayQuestions) {
      sections.sectionC = essayQuestions.map((q, i) => {
        const lines = q.trim().split('\n').filter(l => l.trim());
        let questionText = lines[0]?.replace(/^\d+\.\s*/, '').trim() || '';
        
        // Question might continue on next lines
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j].trim();
          if (line.match(/\[Key\s*Points/i)) break;
          questionText += ' ' + line;
        }
        
        const keyPointsMatch = q.match(/\[Key\s*Points[:\s]*([\s\S]*?)\]/i);
        
        return {
          id: i + 1,
          question: questionText.replace(/\[Key.*\]/i, '').trim(),
          keyPoints: keyPointsMatch ? keyPointsMatch[1].trim() : '',
          type: 'essay'
        };
      }).filter(q => q.question);
    }
    
    console.log('Parsed Section C questions:', sections.sectionC.length);
  }

  // Log if no questions were parsed
  if (sections.sectionA.length === 0 && sections.sectionB.length === 0 && sections.sectionC.length === 0) {
    console.log('Warning: No questions parsed. Raw text sample:', text.substring(0, 500));
  }

  return sections;
}
