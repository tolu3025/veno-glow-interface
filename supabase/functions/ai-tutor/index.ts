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
    const { messages, subject, topic, includeImages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt for tutoring
    const systemPrompt = `You are an expert AI tutor specializing in ${subject}${topic ? ` with focus on ${topic}` : ''}.

Your role:
- Explain concepts clearly and thoroughly
- Use analogies and real-world examples
- Break down complex topics into digestible parts
- Encourage critical thinking
- Be patient and supportive
- Adapt explanations to the student's level

${includeImages ? 'When explaining visual concepts in subjects like Anatomy, Biology, Chemistry, Physics, or MLS, describe what diagrams or images would be helpful to illustrate the concept.' : ''}

Keep responses concise but informative. Focus on understanding over memorization.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "I apologize, I couldn't generate a response.";

    // For subjects that benefit from images, check if we should generate one
    const visualSubjects = ['anatomy', 'biology', 'chemistry', 'physics', 'mls'];
    const shouldGenerateImage = includeImages && 
      visualSubjects.some(s => subject.toLowerCase().includes(s)) &&
      assistantMessage.length > 100;

    let imageUrl = null;
    if (shouldGenerateImage) {
      // Generate an image based on the explanation
      try {
        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: `Create a simple, clear educational diagram for ${subject}: ${assistantMessage.substring(0, 200)}`,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        }
      } catch (imageError) {
        console.error("Image generation error:", imageError);
        // Continue without image if generation fails
      }
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        image_url: imageUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI tutor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
