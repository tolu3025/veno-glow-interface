
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
    const { subject, difficulty, count, topic, fileUrls, autoMode, extractSubjectAndTopic } = await req.json();
    
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

    // Initialize Supabase client for file processing
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let fileContent = '';
    
    // Process uploaded files if any
    if (fileUrls && Array.isArray(fileUrls) && fileUrls.length > 0) {
      console.log('Processing uploaded files:', fileUrls);
      
      for (const fileUrl of fileUrls) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('chat-files')
            .download(fileUrl);

          if (downloadError) {
            console.error('Error downloading file:', downloadError);
            continue;
          }

          const fileName = fileUrl.split('/').pop()?.toLowerCase() || '';
          const fileExtension = fileName.split('.').pop();
          
          if (fileExtension === 'pdf') {
            const arrayBuffer = await fileData.arrayBuffer();
            const text = await extractTextFromPDF(arrayBuffer);
            fileContent += `\n\n=== Content from ${fileName} ===\n${text}`;
          } else if (fileExtension === 'docx') {
            const arrayBuffer = await fileData.arrayBuffer();
            const text = await extractTextFromDOCX(arrayBuffer);
            fileContent += `\n\n=== Content from ${fileName} ===\n${text}`;
          } else if (fileExtension === 'ppt' || fileExtension === 'pptx') {
            const arrayBuffer = await fileData.arrayBuffer();
            const text = await extractTextFromPPT(arrayBuffer);
            fileContent += `\n\n=== Content from ${fileName} ===\n${text}`;
          }
        } catch (fileError) {
          console.error('Error processing file:', fileError);
          continue;
        }
      }
    }

    const difficultyDescriptions = {
      beginner: 'basic level with fundamental concepts',
      intermediate: 'moderate complexity with some analysis required',
      advanced: 'complex problems requiring deep understanding and critical thinking'
    };

    // Handle large requests by breaking them into batches
    const maxQuestionsPerBatch = 25;
    const totalBatches = Math.ceil(count / maxQuestionsPerBatch);
    let allQuestions: any[] = [];
    let extractedSubject = '';
    let extractedTopic = '';

    console.log(`Breaking request into ${totalBatches} batches of max ${maxQuestionsPerBatch} questions each`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const isFirstBatch = batchIndex === 0;
      const questionsInThisBatch = Math.min(maxQuestionsPerBatch, count - (batchIndex * maxQuestionsPerBatch));
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} with ${questionsInThisBatch} questions`);

      let basePrompt;

      if (autoMode && fileContent.trim()) {
        basePrompt = `Analyze the following document content and automatically determine the most appropriate subject and topic, then generate ${questionsInThisBatch} multiple-choice questions at ${difficulty} level (${difficultyDescriptions[difficulty as keyof typeof difficultyDescriptions] || 'moderate complexity'}):

${fileContent}

Please:
1. First identify the main subject area from the content
2. Identify the specific topic or theme
3. Generate questions that test understanding of the key concepts, facts, and ideas presented`;
      } else if (fileContent.trim()) {
        const topicInstruction = topic ? ` specifically about "${topic}"` : '';
        basePrompt = `Based on the following document content, generate ${questionsInThisBatch} multiple-choice questions for ${subject}${topicInstruction} at ${difficulty} level (${difficultyDescriptions[difficulty as keyof typeof difficultyDescriptions] || 'moderate complexity'}):

${fileContent}

Generate questions that test understanding of the key concepts, facts, and ideas presented in the documents.`;
      } else {
        const topicInstruction = topic ? ` specifically about "${topic}"` : '';
        basePrompt = `Generate ${questionsInThisBatch} multiple-choice questions for ${subject}${topicInstruction} at ${difficulty} level (${difficultyDescriptions[difficulty as keyof typeof difficultyDescriptions] || 'moderate complexity'}).`;
      }

      const prompt = `${basePrompt}

IMPORTANT: Generate EXACTLY ${questionsInThisBatch} questions. Do not generate more or fewer.

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include DETAILED, comprehensive explanations for the correct answer
- For mathematical questions: provide step-by-step calculations with clear reasoning at each step
- For conceptual questions: explain the underlying principles, definitions, and reasoning
- For problem-solving questions: break down the solution process into clear, logical steps
- Questions should be educational and test real understanding
- Vary the question types and difficulty appropriately
- Make questions relevant and meaningful

EXPLANATION REQUIREMENTS:
- Start with a clear statement of why the answer is correct
- For calculations: Show every step of the mathematical process
- For word problems: Break down the problem-solving approach
- Include relevant formulas, definitions, or principles
- Explain why other options are incorrect when helpful
- Use clear, educational language that helps students learn
- Provide context and real-world applications when applicable

${autoMode && extractSubjectAndTopic && isFirstBatch ? `
Return the response as a valid JSON object with this exact structure:
{
  "extractedSubject": "The main subject area identified from content",
  "extractedTopic": "The specific topic or theme identified",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Comprehensive step-by-step explanation with detailed reasoning, calculations if applicable, and educational context"
    }
  ]
}` : `
Return the response as a valid JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Comprehensive step-by-step explanation with detailed reasoning, calculations if applicable, and educational context"
    }
  ]
}`}

The answer should be the index (0-3) of the correct option in the options array.
REMEMBER: Generate EXACTLY ${questionsInThisBatch} questions - no more, no less.`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { 
                role: 'system', 
                content: autoMode && extractSubjectAndTopic && isFirstBatch
                  ? 'You are an expert educator and content analyzer. Create comprehensive, step-by-step explanations that help students learn. For mathematical problems, show every calculation step. For conceptual questions, explain the underlying principles thoroughly. Always respond with valid JSON only. Generate exactly the number of questions requested.'
                  : 'You are an expert educator and test creator. Generate high-quality educational questions with detailed, step-by-step explanations that help students understand not just the correct answer, but the reasoning behind it. Always respond with valid JSON only. Generate exactly the number of questions requested.' 
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenAI API error for batch ${batchIndex + 1}:`, response.status, errorText);
          throw new Error(`OpenAI API error for batch ${batchIndex + 1}: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0]) {
          console.error(`Invalid response structure from OpenAI for batch ${batchIndex + 1}:`, data);
          throw new Error(`Invalid response from OpenAI for batch ${batchIndex + 1}`);
        }

        const generatedContent = data.choices[0].message.content;
        console.log(`Generated content for batch ${batchIndex + 1}`);

        // Parse the JSON response
        let questionsData;
        try {
          questionsData = JSON.parse(generatedContent);
        } catch (parseError) {
          console.error(`Failed to parse OpenAI response as JSON for batch ${batchIndex + 1}:`, parseError);
          console.error('Raw content:', generatedContent);
          throw new Error(`Failed to parse AI response as JSON for batch ${batchIndex + 1}`);
        }

        if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
          console.error(`Invalid questions format for batch ${batchIndex + 1}:`, questionsData);
          throw new Error(`Invalid questions format from AI for batch ${batchIndex + 1}`);
        }

        // Store extracted subject/topic from first batch
        if (isFirstBatch && autoMode && questionsData.extractedSubject) {
          extractedSubject = questionsData.extractedSubject;
          extractedTopic = questionsData.extractedTopic;
        }

        // Validate and clean the questions
        const validatedQuestions = questionsData.questions.map((q: any, index: number) => {
          if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
            throw new Error(`Invalid question format at index ${index} in batch ${batchIndex + 1}`);
          }
          
          return {
            question: q.question,
            options: q.options,
            answer: typeof q.answer === 'number' ? q.answer : 0,
            explanation: q.explanation || 'No explanation provided'
          };
        });

        console.log(`Successfully generated ${validatedQuestions.length} questions for batch ${batchIndex + 1}`);
        allQuestions.push(...validatedQuestions);

        // Add a small delay between batches to avoid rate limiting
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (batchError) {
        console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
        // Continue with other batches even if one fails
        continue;
      }
    }

    if (allQuestions.length === 0) {
      throw new Error('Failed to generate any questions. Please try again with a smaller number of questions.');
    }

    console.log(`Successfully generated ${allQuestions.length} total questions across ${totalBatches} batches`);

    const responseData: any = {
      success: true,
      questions: allQuestions
    };

    // Include extracted subject and topic if in auto mode
    if (autoMode && extractedSubject) {
      responseData.extractedSubject = extractedSubject;
      responseData.extractedTopic = extractedTopic;
      console.log('Extracted subject:', extractedSubject);
      console.log('Extracted topic:', extractedTopic);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-questions function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'An unexpected error occurred',
      questions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions for text extraction
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder().decode(uint8Array);
    
    // Extract readable text between common PDF markers
    const textMatches = text.match(/BT[\s\S]*?ET/g) || [];
    let extractedText = '';
    
    for (const match of textMatches) {
      const textObjects = match.match(/\((.*?)\)/g) || [];
      for (const obj of textObjects) {
        const cleanText = obj.replace(/[()]/g, '').trim();
        if (cleanText.length > 1) {
          extractedText += cleanText + ' ';
        }
      }
    }
    
    return extractedText.trim() || 'PDF content could not be extracted automatically.';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return 'Error processing PDF file.';
  }
}

async function extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder().decode(uint8Array);
    
    // Basic text extraction by looking for XML content
    const xmlMatches = text.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
    let extractedText = '';
    
    for (const match of xmlMatches) {
      const textContent = match.replace(/<[^>]*>/g, '').trim();
      if (textContent.length > 0) {
        extractedText += textContent + ' ';
      }
    }
    
    return extractedText.trim() || 'DOCX content could not be extracted automatically.';
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return 'Error processing DOCX file.';
  }
}

async function extractTextFromPPT(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder().decode(uint8Array);
    
    // Basic text extraction by looking for text content markers
    const textMatches = text.match(/[\w\s.,!?;:'"()-]{10,}/g) || [];
    let extractedText = '';
    
    for (const match of textMatches) {
      const cleanText = match.trim();
      if (cleanText.length > 10 && /^[a-zA-Z0-9\s.,!?;:'"()-]+$/.test(cleanText)) {
        extractedText += cleanText + ' ';
      }
    }
    
    return extractedText.trim() || 'PowerPoint content could not be extracted automatically.';
  } catch (error) {
    console.error('Error extracting PPT text:', error);
    return 'Error processing PowerPoint file.';
  }
}
