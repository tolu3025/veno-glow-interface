import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    console.log('Starting AI question generation');
    
    const { subject, difficulty, count, topic, description } = await req.json();
    console.log(`Generating ${count} questions for ${subject}${topic ? ' - ' + topic : ''} at ${difficulty} level`);
    
    // Use OPENAI_API_KEY1 as that's what's configured in secrets
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY1');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        questions: []
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this is a mathematical subject that needs LaTeX formatting
    const isMathematicalSubject = (subjectName: string) => {
      const mathSubjects = [
        'mathematics', 'math', 'maths', 'physics', 'chemistry', 'engineering', 
        'calculus', 'algebra', 'geometry', 'statistics', 'linear algebra',
        'trigonometry', 'differential', 'integral', 'mechanics', 'thermodynamics',
        'electronics', 'accounting', 'economics', 'finance', 'quantitative'
      ];
      return mathSubjects.some(mathSub => subjectName.toLowerCase().includes(mathSub));
    };

    const topicName = topic || '';
    const isMatematical = isMathematicalSubject(subject) || isMathematicalSubject(topicName);
    const hasCalculationRequest = description && (
      description.toLowerCase().includes('calculation') ||
      description.toLowerCase().includes('formula') ||
      description.toLowerCase().includes('equation') ||
      description.toLowerCase().includes('step') ||
      description.toLowerCase().includes('solve') ||
      description.toLowerCase().includes('derivation') ||
      description.toLowerCase().includes('matrix') ||
      description.toLowerCase().includes('vector')
    );

    const shouldFormatMath = isMatematical || hasCalculationRequest;

    const topicText = topic ? ` about ${topic}` : '';
    const descriptionText = description ? `\n\nSpecific requirements: ${description}` : '';
    
    let formatInstructions = '';
    if (shouldFormatMath) {
      formatInstructions = `

CRITICAL - MATHEMATICAL FORMATTING RULES:
Format all mathematical expressions using LaTeX with \\( \\) for inline math and \\[ \\] for display math.

MUST FOLLOW THESE EXACT RULES:
1. Wrap ALL inline math expressions with \\( and \\): \\(expression\\)
2. Wrap ALL display/block math with \\[ and \\]: \\[expression\\]
3. Use simple notation - AVOID complex environments like \\begin{pmatrix}, \\begin{bmatrix}

CORRECT EXAMPLES (USE THESE):
- Equations: Solve for x: \\(x^2 - 4x + 3 = 0\\)
- Fractions: \\(\\frac{1}{3}\\), \\(\\frac{x^3}{3}\\)
- Integrals: \\(\\int_0^1 x^2 dx\\)
- Logarithms: \\(\\log_2(x) = 5\\)
- Square roots: \\(\\sqrt{16} = 4\\)
- Exponents: \\(2^5 = 32\\)
- Vectors: Given \\(\\vec{a} = [1, 2]\\), \\(\\vec{b} = [3, 4]\\), compute \\(\\vec{a} \\cdot \\vec{b}\\)
- Matrices: For matrix A with elements (2,1), (1,3), find determinant = \\(ad - bc\\)
- Trig: \\(\\sin(\\theta)\\), \\(\\cos(x)\\)
- Greek: \\(\\alpha\\), \\(\\beta\\), \\(\\pi\\)
- Multiplication: \\(2 \\times 3 = 6\\)

WRONG (DO NOT USE):
- $expression$ notation - use \\( \\) instead
- \\begin{pmatrix} or any \\begin{} environments
- Raw text like "log_2" without LaTeX delimiters

FOR MATRICES AND VECTORS:
- Describe matrices in words: "Let A be a 2×2 matrix with entries..."
- Or use simple notation: "Matrix A = [[2,1],[1,3]]"
- Calculate and show final answer: "det(A) = \\((2)(3) - (1)(1) = 5\\)"

EXAMPLE QUESTION FORMAT:
"Solve for x: \\(x^2 - 4x + 3 = 0\\)"

EXAMPLE OPTIONS:
A. \\(x = 1\\) and \\(x = 3\\)
B. \\(x = 2\\) and \\(x = 4\\)
C. \\(x = -1\\) and \\(x = -3\\)
D. \\(x = 1\\) and \\(x = 4\\)

EXAMPLE EXPLANATION:
"Factor: \\((x - 1)(x - 3) = 0\\) so \\(x = 1\\) and \\(x = 3\\)."`;
    }

    // Function to generate questions in batches
    const generateQuestionsInBatch = async (batchSize: number) => {
      const prompt = `Generate ${batchSize} multiple-choice questions for ${subject}${topicText} at ${difficulty} level.${descriptionText}${formatInstructions}

Requirements:
- Each question has exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include clear explanations for correct answers
- Questions should test real understanding
- Make questions educational and meaningful
${shouldFormatMath ? '- Use LaTeX notation with \\\\( \\\\) for inline math and \\\\[ \\\\] for display math - AVOID \\\\begin{} environments' : ''}
${shouldFormatMath ? '- For matrices, describe in words or use simple notation like [[a,b],[c,d]]' : ''}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text with proper LaTeX like \\(x^{2} + 2x = 0\\)",
      "options": ["Option A with $formula$", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Clear explanation with step-by-step calculations using proper LaTeX."
    }
  ]
}

Generate exactly ${batchSize} questions.`;

      console.log(`Making OpenAI API request for ${batchSize} questions`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { 
              role: 'system', 
              content: `You are an expert educator creating high-quality educational questions. You MUST respond with valid JSON only. ${shouldFormatMath ? 'CRITICAL: Use LaTeX with \\\\( \\\\) for inline math and \\\\[ \\\\] for display math. NEVER use $ signs or \\\\begin{pmatrix}, \\\\begin{bmatrix} or any \\\\begin{} environments. For matrices, describe in words or use notation like [[a,b],[c,d]]. Use \\\\(\\\\frac{a}{b}\\\\), \\\\(\\\\sqrt{x}\\\\), \\\\(\\\\log_2(x)\\\\), \\\\(x^2\\\\), etc.' : ''}` 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: batchSize > 30 ? 8000 : 4000,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        console.error('Invalid OpenAI response structure:', data);
        throw new Error('Invalid response from OpenAI');
      }

      const generatedContent = data.choices[0].message.content;
      
      // Parse the JSON response with robust error handling
      let questionsData;
      try {
        const trimmed = (generatedContent ?? '').trim();
        
        // Check if JSON is complete by counting braces
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          console.error('Incomplete JSON detected - mismatched braces:', { openBraces, closeBraces });
          console.error('Content preview:', trimmed.slice(0, 1000));
          throw new Error('Incomplete JSON response from OpenAI - possibly truncated');
        }
        
        // Try to find valid JSON within the response
        let jsonStartIndex = trimmed.indexOf('{');
        let jsonEndIndex = trimmed.lastIndexOf('}');
        
        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
          throw new Error('No valid JSON found in response');
        }
        
        const jsonString = trimmed.substring(jsonStartIndex, jsonEndIndex + 1);
        questionsData = JSON.parse(jsonString);
        
      } catch (parseError) {
        console.error('JSON parse error from OpenAI content:', parseError);
        console.error('Content preview:', (generatedContent ?? '').slice(0, 1000));
        console.error('Content length:', (generatedContent ?? '').length);
        
        // If JSON parsing fails, try to regenerate with smaller batch
        if (batchSize > 5) {
          console.log('Retrying with smaller batch size due to JSON parse error');
          return await generateQuestionsInBatch(Math.floor(batchSize / 2));
        }
        
        throw new Error(`Failed to parse AI response JSON: ${String(parseError)}`);
      }

      if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
        console.error('Invalid questions format:', questionsData);
        throw new Error('Invalid questions format from AI');
      }

      return questionsData.questions;
    };

    // Determine batching strategy - Always ensure we generate the exact count requested
    let allQuestions = [];
    
    if (count > 30) {
      // For large requests, use batching
      console.log(`Large request detected (${count} questions). Using batching strategy.`);
      const batchSize = 20; // Smaller batches for better reliability
      const numBatches = Math.ceil(count / batchSize);
      
      for (let i = 0; i < numBatches; i++) {
        const remainingQuestions = count - allQuestions.length;
        const currentBatchSize = Math.min(batchSize, remainingQuestions);
        
        if (currentBatchSize <= 0) break;
        
        console.log(`Generating batch ${i + 1}/${numBatches} with ${currentBatchSize} questions`);
        const batchQuestions = await generateQuestionsInBatch(currentBatchSize);
        allQuestions.push(...batchQuestions);
        
        // Check if we have enough questions
        if (allQuestions.length >= count) {
          allQuestions = allQuestions.slice(0, count); // Trim to exact count
          break;
        }
        
        // Short delay between batches to avoid rate limiting
        if (i < numBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    } else {
      // For smaller requests, generate all at once
      console.log(`Standard request (${count} questions). Generating all at once.`);
      allQuestions = await generateQuestionsInBatch(count);
    }

    // Validate the questions (keep LaTeX formatting intact)
    const validatedQuestions = allQuestions.map((q: any, index: number) => {
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

    console.log(`Successfully generated ${validatedQuestions.length} questions${shouldFormatMath ? ' with LaTeX math formatting' : ''}`);

    return new Response(JSON.stringify({ 
      success: true,
      questions: validatedQuestions,
      formatted: shouldFormatMath
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      questions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
