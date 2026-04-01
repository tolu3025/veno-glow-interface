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
    const ALOC_TOKEN = Deno.env.get('ALOC_ACCESS_TOKEN');
    if (!ALOC_TOKEN) {
      throw new Error('ALOC access token not configured');
    }

    const { subjects } = await req.json();
    if (!subjects || !Array.isArray(subjects) || subjects.length !== 3) {
      throw new Error('Exactly 3 additional subjects required');
    }

    // Build fetch list: English 60, Literature (englishlit) 10, + 3 subjects × 40
    const fetchList = [
      { subject: 'english', count: 60, label: 'English' },
      { subject: 'englishlit', count: 10, label: 'Literature (Lekki Headmaster)' },
      ...subjects.map((s: string) => ({
        subject: s,
        count: 40,
        label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '),
      })),
    ];

    const results = await Promise.all(
      fetchList.map(async (item) => {
        const url = `https://questions.aloc.com.ng/api/v2/q/${item.count}?subject=${item.subject}&type=utme`;
        const res = await fetch(url, {
          headers: { 'AccessToken': ALOC_TOKEN },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(`ALOC error for ${item.subject}:`, text);
          throw new Error(`Failed to fetch ${item.label} questions`);
        }

        const data = await res.json();
        const allQuestions = data.data || [];
        // Remove last 10 questions (less reliable)
        const trimmed = allQuestions.length > 10 ? allQuestions.slice(0, -10) : allQuestions;
        return {
          subject: item.subject,
          label: item.label,
          questions: trimmed,
        };
      })
    );

    return new Response(
      JSON.stringify({ questions: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
