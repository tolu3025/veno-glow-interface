import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI Academic Question Generator for Nigerian tertiary institutions.
Your task is to generate examination questions from the provided document content.

IMPORTANT RULES:
1. Generate questions based on the main topics and concepts found in the document.
2. If the document content appears garbled or unclear, identify key words and phrases to form questions around.
3. Always generate ALL 20 questions - 10 objective, 5 short answer, and 5 essay questions.
4. Use Nigerian academic tone and style similar to WAEC, JAMB, and University exams.
5. Do NOT refuse to generate questions. Always produce output.

QUESTION STYLE:
- Cover main topics mentioned in the document
- Increase difficulty progressively
- Include definitions, explanations, applications
- Use clear academic English

OUTPUT FORMAT (MUST FOLLOW EXACTLY):

SECTION A: OBJECTIVE QUESTIONS
1. Question text here
   A. First option
   B. Second option
   C. Third option
   D. Fourth option
   [Correct: A]

2. Next question...
   A. Option
   B. Option
   C. Option
   D. Option
   [Correct: B]

(Continue for all 10 questions)

SECTION B: SHORT ANSWER QUESTIONS
1. Question requiring brief explanation?
   [Expected Answer: Brief 2-3 sentence answer here]

2. Next question...
   [Expected Answer: Answer here]

(Continue for all 5 questions)

SECTION C: ESSAY QUESTIONS
1. Question requiring detailed explanation and analysis?
   [Key Points: Main points that should be covered in the answer]

2. Next question...
   [Key Points: Key points here]

(Continue for all 5 questions)`;

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

    // Clean up the content - remove excessive whitespace and non-printable characters
    const cleanedContent = pdf_content
      .replace(/[^\x20-\x7E\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 40000);

    console.log('Content preview:', cleanedContent.substring(0, 500));

    const userPrompt = `Generate examination questions for this course:
Course: ${course_name || 'Academic Course'}
Code: ${course_code || 'N/A'}
Title: ${course_title || 'General Studies'}
Difficulty: ${difficulty}

DOCUMENT CONTENT TO BASE QUESTIONS ON:
${cleanedContent}

Generate exactly 20 questions (10 objective, 5 short answer, 5 essay) based on this content. Follow the exact format specified.`;

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
        max_tokens: 4500,
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

    console.log('Generated response length:', generatedQuestions.length);
    console.log('Response preview:', generatedQuestions.substring(0, 300));

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

  // Split by sections more reliably
  const sectionAStart = text.search(/SECTION\s*A/i);
  const sectionBStart = text.search(/SECTION\s*B/i);
  const sectionCStart = text.search(/SECTION\s*C/i);

  let sectionAText = '';
  let sectionBText = '';
  let sectionCText = '';

  if (sectionAStart !== -1) {
    const endA = sectionBStart !== -1 ? sectionBStart : (sectionCStart !== -1 ? sectionCStart : text.length);
    sectionAText = text.substring(sectionAStart, endA);
  }

  if (sectionBStart !== -1) {
    const endB = sectionCStart !== -1 ? sectionCStart : text.length;
    sectionBText = text.substring(sectionBStart, endB);
  }

  if (sectionCStart !== -1) {
    sectionCText = text.substring(sectionCStart);
  }

  // Parse Section A (Objective Questions)
  if (sectionAText) {
    const questionBlocks = sectionAText.split(/\n\s*(\d+)\.\s+/).filter(b => b.trim());
    
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      if (/^\d+$/.test(block.trim())) continue; // Skip number-only blocks
      
      const lines = block.split('\n').filter(l => l.trim());
      if (lines.length === 0) continue;

      // First line(s) is the question
      let questionText = '';
      const options: string[] = [];
      let correctAnswer = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if it's an option line
        const optionMatch = trimmedLine.match(/^([A-D])[\.\)]\s*(.+)/i);
        if (optionMatch) {
          options.push(optionMatch[2].replace(/\[Correct.*\]/i, '').trim());
          continue;
        }

        // Check for correct answer marker
        const correctMatch = trimmedLine.match(/\[Correct[:\s]*([A-D])\]/i);
        if (correctMatch) {
          correctAnswer = correctMatch[1].toUpperCase();
          continue;
        }

        // It's part of the question
        if (options.length === 0 && !trimmedLine.match(/^SECTION/i)) {
          questionText += (questionText ? ' ' : '') + trimmedLine.replace(/^\d+\.\s*/, '');
        }
      }

      // Only add if we have a valid question with options
      if (questionText && options.length >= 2) {
        sections.sectionA.push({
          id: sections.sectionA.length + 1,
          question: questionText.trim(),
          options,
          correctAnswer: ['A', 'B', 'C', 'D'].indexOf(correctAnswer),
          type: 'objective'
        });
      }
    }
    
    console.log('Parsed Section A questions:', sections.sectionA.length);
  }

  // Parse Section B (Short Answer)
  if (sectionBText) {
    const questionBlocks = sectionBText.split(/\n\s*(\d+)\.\s+/).filter(b => b.trim());
    
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      if (/^\d+$/.test(block.trim())) continue;
      
      const answerMatch = block.match(/\[Expected\s*Answer[:\s]*([\s\S]*?)\]/i);
      let questionText = block
        .replace(/\[Expected\s*Answer[:\s]*[\s\S]*?\]/i, '')
        .replace(/^SECTION.*$/mi, '')
        .trim();

      if (questionText && questionText.length > 10) {
        sections.sectionB.push({
          id: sections.sectionB.length + 1,
          question: questionText.replace(/^\d+\.\s*/, '').trim(),
          expectedAnswer: answerMatch ? answerMatch[1].trim() : '',
          type: 'short_answer'
        });
      }
    }
    
    console.log('Parsed Section B questions:', sections.sectionB.length);
  }

  // Parse Section C (Essay)
  if (sectionCText) {
    const questionBlocks = sectionCText.split(/\n\s*(\d+)\.\s+/).filter(b => b.trim());
    
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      if (/^\d+$/.test(block.trim())) continue;
      
      const keyPointsMatch = block.match(/\[Key\s*Points[:\s]*([\s\S]*?)\]/i);
      let questionText = block
        .replace(/\[Key\s*Points[:\s]*[\s\S]*?\]/i, '')
        .replace(/^SECTION.*$/mi, '')
        .trim();

      if (questionText && questionText.length > 10) {
        sections.sectionC.push({
          id: sections.sectionC.length + 1,
          question: questionText.replace(/^\d+\.\s*/, '').trim(),
          keyPoints: keyPointsMatch ? keyPointsMatch[1].trim() : '',
          type: 'essay'
        });
      }
    }
    
    console.log('Parsed Section C questions:', sections.sectionC.length);
  }

  // Log if no questions were parsed
  if (sections.sectionA.length === 0 && sections.sectionB.length === 0 && sections.sectionC.length === 0) {
    console.log('Warning: No questions parsed. Raw text sample:', text.substring(0, 1000));
  }

  return sections;
}