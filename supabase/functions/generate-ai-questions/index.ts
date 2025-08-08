
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
      const mathSubjects = ['mathematics', 'physics', 'chemistry', 'engineering', 'calculus', 'algebra', 'geometry', 'statistics'];
      return mathSubjects.some(mathSub => subjectName.toLowerCase().includes(mathSub));
    };

    const isMatematical = isMathematicalSubject(subject);
    const hasCalculationRequest = description && (
      description.toLowerCase().includes('calculation') ||
      description.toLowerCase().includes('formula') ||
      description.toLowerCase().includes('equation') ||
      description.toLowerCase().includes('step') ||
      description.toLowerCase().includes('solve') ||
      description.toLowerCase().includes('derivation')
    );

    const shouldFormatMath = isMatematical || hasCalculationRequest;

    const topicText = topic ? ` about ${topic}` : '';
    const descriptionText = description ? `\n\nSpecific requirements: ${description}` : '';
    
    let formatInstructions = '';
    if (shouldFormatMath) {
      formatInstructions = `

IMPORTANT - Mathematical Formatting Requirements:
- Use LaTeX notation for all mathematical expressions in questions, options, and explanations
- Inline math: Use $...$ for inline formulas (e.g., $x^2 + 1$)
- Display math: Use $$...$$ for centered equations (e.g., $$\\frac{d}{dx}[x^2] = 2x$$)
- Include step-by-step calculations in explanations using proper LaTeX
- Format fractions as $\\frac{numerator}{denominator}$
- Use proper notation for functions, derivatives, integrals, etc.
- For physics: Include units and proper scientific notation
- Show detailed working steps in explanations with clear mathematical reasoning

Example explanation format:
"Step 1: Apply the formula $F = ma$
$$F = (5 \\text{ kg})(2 \\text{ m/s}^2) = 10 \\text{ N}$$

Step 2: Calculate the work done
$$W = F \\cdot d = 10 \\text{ N} \\times 3 \\text{ m} = 30 \\text{ J}$$"`;
    }

    const prompt = `Generate ${count} multiple-choice questions for ${subject}${topicText} at ${difficulty} level.${descriptionText}${formatInstructions}

Requirements:
- Each question has exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include clear explanations for correct answers
- Questions should test real understanding
- Make questions educational and meaningful
${shouldFormatMath ? '- Use proper LaTeX formatting for all mathematical content' : ''}
${shouldFormatMath ? '- Include step-by-step solutions with calculations where appropriate' : ''}

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON - no additional text before or after
- For LaTeX expressions: Use single backslashes (\\) not double (\\\\)
- Escape all special characters properly in JSON strings
- Use proper JSON string escaping for quotes and backslashes
- Ensure all strings are properly terminated
- Do not include line breaks within JSON string values

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here${shouldFormatMath ? ' with $LaTeX$ formatting if needed' : ''}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Clear explanation${shouldFormatMath ? ' with step-by-step calculations using LaTeX formatting' : ''} of why this answer is correct."
    }
  ]
}

Generate exactly ${count} questions.`;

    console.log('Making OpenAI API request');
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
            content: `You are an expert educator specialized in creating high-quality educational questions${shouldFormatMath ? ' with proper mathematical formatting using LaTeX' : ''}. You MUST respond with valid JSON only - no additional text. Ensure proper JSON escaping for all special characters including backslashes in LaTeX expressions.${shouldFormatMath ? ' When dealing with mathematical content, use LaTeX notation extensively for formulas, equations, and calculations.' : ''}` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status}`,
        questions: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      console.error('Invalid OpenAI response structure:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from OpenAI',
        questions: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generatedContent = data.choices[0].message.content;
    console.log('Generated content received');

    // Sanitize and parse the JSON response
    let questionsData;
    try {
      // Clean the content to handle common JSON issues
      let cleanedContent = generatedContent.trim();
      
      // Remove any text before the first { and after the last }
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No valid JSON structure found');
      }
      
      cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
      
      // Fix common LaTeX escaping issues
      cleanedContent = cleanedContent
        // Fix double-escaped backslashes in LaTeX
        .replace(/\\\\\\\\([a-zA-Z]+)/g, '\\\\$1')
        // Fix unterminated strings by ensuring proper quote escaping
        .replace(/([^\\])"/g, '$1\\"')
        // Fix newlines within JSON strings
        .replace(/\n(?=\s*[^}])/g, '\\n');
      
      questionsData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw content length:', generatedContent.length);
      console.error('First 500 chars:', generatedContent.substring(0, 500));
      console.error('Last 500 chars:', generatedContent.substring(Math.max(0, generatedContent.length - 500)));
      
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response. The AI may have generated malformed JSON.',
        questions: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      console.error('Invalid questions format:', questionsData);
      return new Response(JSON.stringify({ 
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

    console.log(`Successfully generated ${validatedQuestions.length} questions${shouldFormatMath ? ' with mathematical formatting' : ''}`);

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
