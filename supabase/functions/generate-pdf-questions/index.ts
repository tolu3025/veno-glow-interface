import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MCQ_SYSTEM_PROMPT = `You are an AI Academic Question Generator for Nigerian tertiary institutions.
Your task is to generate multiple-choice objective questions from the provided document content.

IMPORTANT RULES:
1. Generate exactly 40 multiple-choice objective questions.
2. Each question MUST have exactly 4 options (A, B, C, D) and one correct answer.
3. Use Nigerian academic tone and style similar to WAEC, JAMB, and University exams.
4. Cover main topics mentioned in the document.
5. Increase difficulty progressively.
6. Do NOT refuse to generate questions. Always produce output.

OUTPUT FORMAT (MUST FOLLOW EXACTLY):

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

(Continue for all 40 questions)`;

const ESSAY_SYSTEM_PROMPT = `You are an AI Academic Question Generator for Nigerian tertiary institutions.
Your task is to generate essay questions from the provided document content.

IMPORTANT RULES:
1. Generate exactly 10 essay questions.
2. Questions should require detailed explanations and analysis.
3. Use Nigerian academic tone and style similar to WAEC, JAMB, and University exams.
4. Cover main topics mentioned in the document.
5. Increase difficulty progressively.
6. Do NOT refuse to generate questions. Always produce output.

OUTPUT FORMAT (MUST FOLLOW EXACTLY):

1. Question requiring detailed explanation and analysis?
   [Key Points: Main points that should be covered in the answer]

2. Next question...
   [Key Points: Key points here]

(Continue for all 10 questions)`;

const LEGACY_SYSTEM_PROMPT = `You are an AI Academic Question Generator for Nigerian tertiary institutions.
Your task is to generate examination questions from the provided document content.

IMPORTANT RULES:
1. Generate questions based on the main topics and concepts found in the document.
2. Always generate ALL 20 questions - 10 objective, 5 short answer, and 5 essay questions.
3. Use Nigerian academic tone and style similar to WAEC, JAMB, and University exams.
4. Do NOT refuse to generate questions. Always produce output.

OUTPUT FORMAT (MUST FOLLOW EXACTLY):

SECTION A: OBJECTIVE QUESTIONS
1. Question text here
   A. First option
   B. Second option
   C. Third option
   D. Fourth option
   [Correct: A]

(Continue for all 10 questions)

SECTION B: SHORT ANSWER QUESTIONS
1. Question requiring brief explanation?
   [Expected Answer: Brief 2-3 sentence answer here]

(Continue for all 5 questions)

SECTION C: ESSAY QUESTIONS
1. Question requiring detailed explanation and analysis?
   [Key Points: Main points that should be covered in the answer]

(Continue for all 5 questions)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { course_name, course_code, course_title, pdf_content, difficulty = 'intermediate', question_type } = await req.json();

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

    const cleanedContent = pdf_content
      .replace(/[^\x20-\x7E\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 40000);

    console.log('Question type:', question_type || 'legacy');
    console.log('Content preview:', cleanedContent.substring(0, 500));

    // Select system prompt and user prompt based on question_type
    let systemPrompt: string;
    let questionInstruction: string;
    let maxTokens: number;

    if (question_type === 'mcq') {
      systemPrompt = MCQ_SYSTEM_PROMPT;
      questionInstruction = 'Generate exactly 40 multiple-choice objective questions based on this content. Each must have 4 options and a correct answer.';
      maxTokens = 8000;
    } else if (question_type === 'essay') {
      systemPrompt = ESSAY_SYSTEM_PROMPT;
      questionInstruction = 'Generate exactly 10 essay questions with key points for each, based on this content.';
      maxTokens = 5000;
    } else {
      systemPrompt = LEGACY_SYSTEM_PROMPT;
      questionInstruction = 'Generate exactly 20 questions (10 objective, 5 short answer, 5 essay) based on this content. Follow the exact format specified.';
      maxTokens = 4500;
    }

    const userPrompt = `Generate examination questions for this course:
Course: ${course_name || 'Academic Course'}
Code: ${course_code || 'N/A'}
Title: ${course_title || 'General Studies'}
Difficulty: ${difficulty}

DOCUMENT CONTENT TO BASE QUESTIONS ON:
${cleanedContent}

${questionInstruction}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
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

    // Parse based on question_type
    let sections;
    if (question_type === 'mcq') {
      sections = parseMCQQuestions(generatedQuestions);
    } else if (question_type === 'essay') {
      sections = parseEssayQuestions(generatedQuestions);
    } else {
      sections = parseLegacyQuestions(generatedQuestions);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        questions: generatedQuestions,
        sections,
        question_type: question_type || 'legacy',
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

function parseMCQQuestions(text: string) {
  const sections = {
    sectionA: [] as any[],
    sectionB: [] as any[],
    sectionC: [] as any[],
  };

  // Split by question numbers
  const questionBlocks = text.split(/\n\s*(\d+)\.\s+/).filter(b => b.trim());
  
  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    if (/^\d+$/.test(block.trim())) continue;
    
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    let questionText = '';
    const options: string[] = [];
    let correctAnswer = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      const optionMatch = trimmedLine.match(/^([A-D])[\.\)]\s*(.+)/i);
      if (optionMatch) {
        options.push(optionMatch[2].replace(/\[Correct.*\]/i, '').trim());
        continue;
      }

      const correctMatch = trimmedLine.match(/\[Correct[:\s]*([A-D])\]/i);
      if (correctMatch) {
        correctAnswer = correctMatch[1].toUpperCase();
        continue;
      }

      if (options.length === 0) {
        questionText += (questionText ? ' ' : '') + trimmedLine.replace(/^\d+\.\s*/, '');
      }
    }

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

  console.log('Parsed MCQ questions:', sections.sectionA.length);
  return sections;
}

function parseEssayQuestions(text: string) {
  const sections = {
    sectionA: [] as any[],
    sectionB: [] as any[],
    sectionC: [] as any[],
  };

  const questionBlocks = text.split(/\n\s*(\d+)\.\s+/).filter(b => b.trim());
  
  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    if (/^\d+$/.test(block.trim())) continue;
    
    const keyPointsMatch = block.match(/\[Key\s*Points[:\s]*([\s\S]*?)\]/i);
    let questionText = block
      .replace(/\[Key\s*Points[:\s]*[\s\S]*?\]/i, '')
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

  console.log('Parsed Essay questions:', sections.sectionC.length);
  return sections;
}

function parseLegacyQuestions(text: string) {
  const sections = {
    sectionA: [] as any[],
    sectionB: [] as any[],
    sectionC: [] as any[],
  };

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

  if (sectionAText) {
    const questionBlocks = sectionAText.split(/\n\s*(\d+)\.\s+/).filter(b => b.trim());
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      if (/^\d+$/.test(block.trim())) continue;
      const lines = block.split('\n').filter(l => l.trim());
      if (lines.length === 0) continue;
      let questionText = '';
      const options: string[] = [];
      let correctAnswer = '';
      for (const line of lines) {
        const trimmedLine = line.trim();
        const optionMatch = trimmedLine.match(/^([A-D])[\.\)]\s*(.+)/i);
        if (optionMatch) { options.push(optionMatch[2].replace(/\[Correct.*\]/i, '').trim()); continue; }
        const correctMatch = trimmedLine.match(/\[Correct[:\s]*([A-D])\]/i);
        if (correctMatch) { correctAnswer = correctMatch[1].toUpperCase(); continue; }
        if (options.length === 0 && !trimmedLine.match(/^SECTION/i)) {
          questionText += (questionText ? ' ' : '') + trimmedLine.replace(/^\d+\.\s*/, '');
        }
      }
      if (questionText && options.length >= 2) {
        sections.sectionA.push({ id: sections.sectionA.length + 1, question: questionText.trim(), options, correctAnswer: ['A', 'B', 'C', 'D'].indexOf(correctAnswer), type: 'objective' });
      }
    }
  }

  if (sectionBText) {
    const questionBlocks = sectionBText.split(/\n\s*(\d+)\.\s+/).filter(b => b.trim());
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      if (/^\d+$/.test(block.trim())) continue;
      const answerMatch = block.match(/\[Expected\s*Answer[:\s]*([\s\S]*?)\]/i);
      let questionText = block.replace(/\[Expected\s*Answer[:\s]*[\s\S]*?\]/i, '').replace(/^SECTION.*$/mi, '').trim();
      if (questionText && questionText.length > 10) {
        sections.sectionB.push({ id: sections.sectionB.length + 1, question: questionText.replace(/^\d+\.\s*/, '').trim(), expectedAnswer: answerMatch ? answerMatch[1].trim() : '', type: 'short_answer' });
      }
    }
  }

  if (sectionCText) {
    const questionBlocks = sectionCText.split(/\n\s*(\d+)\.\s+/).filter(b => b.trim());
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      if (/^\d+$/.test(block.trim())) continue;
      const keyPointsMatch = block.match(/\[Key\s*Points[:\s]*([\s\S]*?)\]/i);
      let questionText = block.replace(/\[Key\s*Points[:\s]*[\s\S]*?\]/i, '').replace(/^SECTION.*$/mi, '').trim();
      if (questionText && questionText.length > 10) {
        sections.sectionC.push({ id: sections.sectionC.length + 1, question: questionText.replace(/^\d+\.\s*/, '').trim(), keyPoints: keyPointsMatch ? keyPointsMatch[1].trim() : '', type: 'essay' });
      }
    }
  }

  return sections;
}
