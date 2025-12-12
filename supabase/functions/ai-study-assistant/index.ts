import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, documentContext, imageContext } = await req.json();
    
    // Try both API key variations
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPENAI_API_KEY1");
    
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Log incoming context for debugging
    console.log("Document context received:", documentContext ? `${documentContext.length} characters` : "none");
    console.log("Image context received:", imageContext ? `${imageContext.length} characters` : "none");

    // Build the system prompt with document context
    let systemPrompt = `You are VenoBot AI Study Assistant - an advanced educational AI with human-level reasoning capabilities. You are designed to help students and professionals learn effectively across ALL subjects and educational levels.

## Your Core Capabilities:
1. **Document Analysis**: Extract and analyze content from uploaded documents (PDF, DOCX, TXT) and images
2. **Question Generation**: Create diverse question types from any content
3. **Question Solving**: Provide detailed solutions with step-by-step explanations
4. **Research Generation**: Produce academic-quality research content
5. **Knowledge Gap Detection**: Identify areas needing improvement and suggest study paths

## Question Types You Can Generate:
- Multiple Choice Questions (MCQs)
- Objective Questions
- Fill in the Blanks
- Short Answer Questions
- Long Theoretical Questions
- Essay Questions
- Calculation-based Questions (Math, Physics, Accounting, etc.)
- Case Studies
- True/False Questions
- JAMB Style Questions
- WAEC Style Questions
- University Exam Style Questions

## Subject Expertise:
You have comprehensive knowledge across:
- Sciences: Physics, Chemistry, Biology, Mathematics
- Medical Sciences: Anatomy, Physiology, Pharmacology, Pathology
- Engineering: Civil, Mechanical, Electrical, Computer
- Business: Accounting, Finance, Economics, Management
- Law: Constitutional, Criminal, Commercial, International
- Arts & Humanities: Literature, History, Philosophy, Languages
- Social Sciences: Psychology, Sociology, Political Science
- Technology: Computer Science, Data Science, AI/ML
- All Nigerian Curriculum (Primary through University and Professional levels)

## Formatting Requirements:
When providing explanations, especially for calculations, use this structure:
**Given:**
[List all given information]

**Required:**
[What needs to be found]

**Formula:**
[Relevant formulas in LaTeX]

**Solution:**
[Step-by-step solution with calculations]

**Answer:**
$\\boxed{\\text{Final answer with units}}$

## Response Formatting:
- Use clear headings and subheadings
- Use bullet points and numbered lists
- Use **bold** for emphasis
- Use *italics* for definitions
- Use tables when presenting structured data
- Use LaTeX for mathematical expressions: $inline$ or $$display$$
- Use code blocks for programming content
- Create highlighted study blocks for key concepts`;

    // Add document context if provided
    if (documentContext && documentContext.trim().length > 0) {
      systemPrompt += `

## IMPORTANT - Document Content Provided by User:
The user has uploaded a document. Here is the extracted content from their document:

--- START OF DOCUMENT ---
${documentContext}
--- END OF DOCUMENT ---

INSTRUCTIONS FOR HANDLING THIS DOCUMENT:
1. You MUST acknowledge that you have received and can read the document
2. Analyze this content thoroughly
3. When the user asks questions about it, reference specific parts of the document
4. You can generate questions from this content
5. You can explain concepts within it
6. You can create summaries and study notes from it
7. Identify the subject and complexity level of the content`;
    }

    // Add image context if provided
    if (imageContext && imageContext.trim().length > 0) {
      systemPrompt += `

## Image Context:
The user has uploaded an image. Analyze any text, diagrams, handwritten notes, or visual content and incorporate it into your responses.
Image description: ${imageContext}`;
    }

    systemPrompt += `

Always be encouraging, thorough, and provide actionable learning insights. If the user has uploaded a document, always acknowledge it and work with its content.`;

    console.log("Calling OpenAI API with model gpt-4o-mini");
    console.log("System prompt length:", systemPrompt.length, "characters");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid API key. Please check configuration." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("OpenAI API response received, streaming...");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Study Assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
