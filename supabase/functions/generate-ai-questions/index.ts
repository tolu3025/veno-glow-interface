
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

CRITICAL MATHEMATICAL FORMATTING RULES:
You MUST format all mathematical content as PLAIN TEXT. DO NOT use any LaTeX, dollar signs, or special notation.

FORMATTING RULES:
1. Write fractions as: "a/b" or "a divided by b"
   Example: "1/2", "3/4", "x/y"

2. Write exponents as: "x^2" or "x squared" or "x to the power of 2"
   Example: "x^2 + 2x + 1", "a squared plus b squared"

3. Write square roots as: "sqrt(x)" or "square root of x"
   Example: "sqrt(16) = 4", "square root of 25 is 5"

4. Write subscripts as: "x_1" or "x sub 1"
   Example: "a_1, a_2, a_3", "velocity v_0"

5. Greek letters: spell them out
   Example: "alpha", "beta", "theta", "pi", "omega"

6. Special symbols:
   - Summation: "sum of" or "Σ (sigma)"
   - Integration: "integral of"
   - Infinity: "infinity" or "∞"
   - Plus/minus: "+/-" or "plus or minus"

7. Matrices: Write as text descriptions or use simple notation
   Example: "Matrix A = [[1, 2], [3, 4]]" or "a 2x2 matrix with elements..."

8. For step-by-step solutions, format like:
   "Step 1: Given that x = 5 and y = 3...
    Step 2: Substitute values: 2(5) + 3 = 13
    Step 3: Therefore, the answer is 13"

ABSOLUTELY NO: $, $$, \\(, \\), \\[, \\], \\frac, \\sqrt, \\begin, \\end, or any LaTeX commands.
Write everything in plain, readable text format.`;
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
${shouldFormatMath ? '- Write all mathematical expressions in plain text format (NO LaTeX, NO dollar signs)' : ''}
${shouldFormatMath ? '- Include step-by-step solutions with calculations in plain text' : ''}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here with plain text math like x^2 + 2x = 0?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Clear explanation with step-by-step calculations in plain text format."
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
              content: `You are an expert educator creating high-quality educational questions. You MUST respond with valid JSON only. ${shouldFormatMath ? 'CRITICAL: Write ALL mathematical expressions in plain text. DO NOT use LaTeX, dollar signs ($), backslashes, or any special math notation. Write fractions as "a/b", exponents as "x^2", square roots as "sqrt(x)", etc.' : ''}` 
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

    // Clean up any remaining LaTeX artifacts
    const cleanMathContent = (text: string): string => {
      if (!text) return text;
      
      // Remove dollar sign LaTeX delimiters
      let cleaned = text.replace(/\$\$(.*?)\$\$/g, '$1');
      cleaned = cleaned.replace(/\$(.*?)\$/g, '$1');
      
      // Remove backslash LaTeX delimiters
      cleaned = cleaned.replace(/\\\[(.*?)\\\]/g, '$1');
      cleaned = cleaned.replace(/\\\((.*?)\\\)/g, '$1');
      
      // Replace common LaTeX commands with plain text
      cleaned = cleaned.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)');
      cleaned = cleaned.replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)');
      cleaned = cleaned.replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, '$1-root($2)');
      cleaned = cleaned.replace(/\\times/g, '×');
      cleaned = cleaned.replace(/\\div/g, '÷');
      cleaned = cleaned.replace(/\\pm/g, '±');
      cleaned = cleaned.replace(/\\leq/g, '≤');
      cleaned = cleaned.replace(/\\geq/g, '≥');
      cleaned = cleaned.replace(/\\neq/g, '≠');
      cleaned = cleaned.replace(/\\approx/g, '≈');
      cleaned = cleaned.replace(/\\infty/g, '∞');
      cleaned = cleaned.replace(/\\pi/g, 'π');
      cleaned = cleaned.replace(/\\alpha/g, 'α');
      cleaned = cleaned.replace(/\\beta/g, 'β');
      cleaned = cleaned.replace(/\\gamma/g, 'γ');
      cleaned = cleaned.replace(/\\delta/g, 'δ');
      cleaned = cleaned.replace(/\\theta/g, 'θ');
      cleaned = cleaned.replace(/\\lambda/g, 'λ');
      cleaned = cleaned.replace(/\\mu/g, 'μ');
      cleaned = cleaned.replace(/\\sigma/g, 'σ');
      cleaned = cleaned.replace(/\\omega/g, 'ω');
      cleaned = cleaned.replace(/\\sum/g, 'Σ');
      cleaned = cleaned.replace(/\\int/g, '∫');
      cleaned = cleaned.replace(/\\prod/g, 'Π');
      
      // Clean up subscripts and superscripts
      cleaned = cleaned.replace(/\^{([^}]*)}/g, '^$1');
      cleaned = cleaned.replace(/_{([^}]*)}/g, '_$1');
      
      // Remove remaining backslashes before common math terms
      cleaned = cleaned.replace(/\\([a-zA-Z]+)/g, '$1');
      
      // Clean up extra whitespace
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      return cleaned;
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

    // Validate and clean the questions
    const validatedQuestions = allQuestions.map((q: any, index: number) => {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Invalid question format at index ${index}`);
      }
      
      return {
        question: cleanMathContent(q.question),
        options: q.options.map((opt: string) => cleanMathContent(opt)),
        answer: typeof q.answer === 'number' ? q.answer : 0,
        explanation: cleanMathContent(q.explanation || 'No explanation provided')
      };
    });

    console.log(`Successfully generated ${validatedQuestions.length} questions${shouldFormatMath ? ' with plain text math formatting' : ''}`);

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
