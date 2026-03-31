// ──────────────────────────────────────────────────────────────
// Unified AI Provider — Google Gemini 2.0 Flash (FREE)
//
// Usage: Just set GEMINI_API_KEY in your environment.
// Get a free key at: https://aistudio.google.com/apikey
//
// Fallback: offline responses if API key is not configured.
// ──────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiResponse {
  ok: boolean;
  text: string;
  provider: 'gemini' | 'offline';
}

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ──────────────────────────────────────────────────────────────
// Call Google Gemini API
// ──────────────────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[ai] GEMINI_API_KEY is not set — AI will use offline mode');
    return null;
  }

  // Build Gemini-compatible content array
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // System instruction (sent separately for Gemini)
  // Gemini uses systemInstruction field, not a message

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  // Retry up to 2 times
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000), // 30s timeout
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[ai] Gemini API error (attempt ${attempt}):`, res.status, errText.slice(0, 300));
        if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const data = await res.json();

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }

      // Check if blocked by safety
      if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
        console.warn('[ai] Gemini response blocked by safety filters');
        return null;
      }

      console.warn(`[ai] Gemini empty response (attempt ${attempt})`);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`[ai] Gemini fetch failed (attempt ${attempt}):`, err);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
    }
  }

  return null;
}

// ──────────────────────────────────────────────────────────────
// Public: chat with AI
// ──────────────────────────────────────────────────────────────

export async function chatWithAi(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
  offlineFallback?: (message: string) => string,
): Promise<AiResponse> {
  // Try Gemini first
  const geminiResponse = await callGemini(systemPrompt, userMessage, history);

  if (geminiResponse) {
    return { ok: true, text: geminiResponse, provider: 'gemini' };
  }

  // Offline fallback
  if (offlineFallback) {
    return { ok: true, text: offlineFallback(userMessage), provider: 'offline' };
  }

  return { ok: false, text: '', provider: 'offline' };
}

// ──────────────────────────────────────────────────────────────
// Public: check if AI is available (for status badges)
// ──────────────────────────────────────────────────────────────

export function isAiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
