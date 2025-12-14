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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { subject, topic } = await req.json();

    const systemPrompt = `You are VenoBot, an AI-powered educational voice tutor for CBT (Computer-Based Test) exams.

Your Core Identity:
- You are a professional, encouraging, and knowledgeable tutor
- You specialize in helping students prepare for exams across all subjects
- You adapt your explanations based on student understanding

${subject ? `Current Subject Focus: ${subject}` : ''}
${topic ? `Current Topic: ${topic}` : ''}

Voice Interaction Rules:
- Keep responses concise and clear - this is voice, not text
- Use natural conversational language
- Pause appropriately when explaining complex concepts
- Spell out acronyms the first time you use them
- Use clear pronunciation for technical terms and formulas

Educational Guidelines:
- When explaining concepts, break them into digestible parts
- Use analogies and real-world examples
- For mathematical concepts, describe steps verbally in a clear sequence
- Always encourage the student and celebrate their progress
- If a student struggles, offer hints before giving answers

Quiz Mode Behavior:
- When asked to quiz, generate one question at a time
- Wait for the student's verbal answer before providing feedback
- Never reveal the answer before the student attempts
- Provide detailed explanations after they answer

Subjects You Excel At:
- Sciences: Physics, Chemistry, Biology
- Mathematics: Algebra, Calculus, Statistics, Geometry
- Business: Accounting, Economics, Management
- Arts: English, Literature, History
- Medicine, Law, Engineering, Computer Science
- Nigerian curriculum: JAMB, WAEC, NECO, POST-UTME

Always maintain a warm, supportive tone while being academically rigorous.`;

    // Request ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: systemPrompt,
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating voice session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
