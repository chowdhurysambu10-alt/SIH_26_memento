import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChallengePayload {
  id: string;
  title: string;
  description: string;
  district?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const gemmaApiKey = Deno.env.get('GEMMA_API_KEY') || Deno.env.get('GEMINI_API_KEY') || '';
    const ollamaBaseUrl = Deno.env.get('OLLAMA_BASE_URL') || 'http://localhost:11434';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: ChallengePayload = await req.json();

    const { id: challengeId, title, description, district } = body;

    if (!challengeId || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: challengeId and title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `
You are an expert AI analysis engine for Jharkhand Societal Challenges (SIH 2026 Problem Statement 26043).
Analyze the given local problem title and description.
Extract:
1. "category": ONE of [Water & Sanitation, Education, Healthcare, Agriculture, Environment & Forestry, Clean Energy, Urban Infrastructure, Accessibility & Inclusion, Rural Livelihoods, Public Administration]
4. "summary": A 1-2 sentence concise summary of the societal challenge and affected population.

Return strictly a JSON object with this format:
{
  "category": "Water & Sanitation",

  "confidence": 0.92,
  "summary": "Severe drinking water contamination reported in Birsa Chowk affecting over 500 families."
}
`;

    const userContent = `District: ${district || 'Jharkhand'}\nTitle: ${title}\nDescription: ${description || 'No detailed description provided.'}`;

    let aiResult: { category: string; confidence: number; summary: string };
    let modelUsed = 'gemma-2';
    let rawResponse: any = null;

    // 1. Attempt Google AI Studio (Gemma 2 / Gemini)
    try {
      if (!gemmaApiKey) throw new Error('GEMMA_API_KEY not configured.');

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gemmaApiKey}`;
      const gemmaReq = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      });

      if (!gemmaReq.ok) {
        throw new Error(`Google AI Studio responded with HTTP ${gemmaReq.status}`);
      }

      const gemmaData = await gemmaReq.json();
      rawResponse = gemmaData;
      const text = gemmaData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      aiResult = JSON.parse(text);
      modelUsed = 'gemma-2';
    } catch (gemmaErr) {
      console.warn('Primary Gemma provider failed:', gemmaErr.message, 'Trying Ollama local fallback...');

      // 2. Fallback to local Ollama
      try {
        const ollamaReq = await fetch(`${ollamaBaseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2:9b',
            prompt: `${systemPrompt}\n\n${userContent}`,
            stream: false,
            format: 'json',
          }),
        });

        if (!ollamaReq.ok) throw new Error(`Ollama responded with HTTP ${ollamaReq.status}`);

        const ollamaData = await ollamaReq.json();
        rawResponse = ollamaData;
        aiResult = JSON.parse(ollamaData.response || '{}');
        modelUsed = 'ollama-local';
      } catch (ollamaErr) {
        console.warn('Ollama fallback also failed. Using deterministic heuristic classifier...');
        // Heuristic fallback
        const descLower = `${title} ${description}`.toLowerCase();
        let cat = 'Public Administration';


        if (descLower.includes('water') || descLower.includes('sanitation') || descLower.includes('drainage')) {
          cat = 'Water & Sanitation';

        } else if (descLower.includes('school') || descLower.includes('teacher') || descLower.includes('student')) {
          cat = 'Education';

        } else if (descLower.includes('hospital') || descLower.includes('doctor') || descLower.includes('health') || descLower.includes('medicine')) {
          cat = 'Healthcare';

        } else if (descLower.includes('crop') || descLower.includes('farmer') || descLower.includes('irrigation')) {
          cat = 'Agriculture';

        } else if (descLower.includes('road') || descLower.includes('pothole') || descLower.includes('traffic') || descLower.includes('bridge')) {
          cat = 'Urban Infrastructure';

        }

        aiResult = {
          category: cat,

          confidence: 0.75,
          summary: `${title} reported in ${district || 'Jharkhand'} requiring societal intervention.`,
        };
        modelUsed = 'heuristic-engine';
      }
    }

    // Sanitize values
    const finalCategory = aiResult.category || 'Public Administration';

    const finalConfidence = Math.min(1.0, Math.max(0.1, Number(aiResult.confidence) || 0.7));
    const finalSummary = aiResult.summary || `${title} in ${district || 'Jharkhand'}`;

    // 3. Write to ai_analysis_log
    const { error: logError } = await supabase.from('ai_analysis_log').insert({
      challenge_id: challengeId,
      model_used: modelUsed,
      ai_category: finalCategory,

      ai_confidence: finalConfidence,
      ai_summary: finalSummary,
      raw_response: rawResponse,
    });

    if (logError) {
      console.error('Failed to write to ai_analysis_log:', logError);
    }

    // 4. Update challenges row
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('challenges')
      .update({
        category: finalCategory,

        ai_summary: finalSummary,
        ai_confidence: finalConfidence,
        model_used: modelUsed,
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update challenge row:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          category: finalCategory,

          confidence: finalConfidence,
          summary: finalSummary,
          model_used: modelUsed,
        },
        challenge: updatedChallenge,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
