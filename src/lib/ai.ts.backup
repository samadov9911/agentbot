// ──────────────────────────────────────────────────────────────
// Multi-Provider AI Module — supports multiple free AI backends
//
// Provider priority:
//   1. Groq (Llama 3.3 70B) — FREE, ultra-fast, works worldwide
//   2. OpenRouter (free models) — FREE, many models
//   3. Gemini — FREE, but geo-restricted
//   4. Offline fallback
//
// Setup: Add ONE of these env vars:
//   GROQ_API_KEY       → https://console.groq.com (recommended!)
//   OPENROUTER_API_KEY → https://openrouter.ai
//   GEMINI_API_KEY     → https://aistudio.google.com/apikey
// ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiResponse {
  ok: boolean;
  text: string;
  provider: string;
}

// ──────────────────────────────────────────────────────────────
// Provider: Groq (Llama 3.3 70B) — FREE, ultra-fast
// ──────────────────────────────────────────────────────────────

async function callGroq(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  const recent = history.slice(-20);
  for (const msg of recent) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: userMessage });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.9,
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[groq] Error (attempt ${attempt}):`, res.status, err.slice(0, 200));
        if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text?.trim()) return text.trim();
      console.warn(`[groq] Empty response (attempt ${attempt})`);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`[groq] Failed (attempt ${attempt}):`, err);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Provider: OpenRouter (multiple free models)
// ──────────────────────────────────────────────────────────────

async function callOpenRouter(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  const recent = history.slice(-20);
  for (const msg of recent) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: userMessage });

  // Free models on OpenRouter (as of 2025):
  // meta-llama/llama-3.3-70b-instruct:free
  // google/gemma-3-27b-it:free
  // qwen/qwen-3-30b-a3b-instruct:free
  const freeModels = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free',
    'qwen/qwen-3-30b-a3b-instruct:free',
  ];

  for (const model of freeModels) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://agentbot-one.vercel.app',
          'X-Title': 'AgentBot AI Assistant',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn(`[openrouter] ${model}: ${res.status} ${err.slice(0, 150)}`);
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text?.trim()) {
        console.log(`[openrouter] Using model: ${model}`);
        return text.trim();
      }
    } catch (err) {
      console.warn(`[openrouter] ${model} failed:`, err);
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Provider: Google Gemini
// ──────────────────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  const recent = history.slice(-20);
  for (const msg of recent) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 2048 },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[gemini] Error (attempt ${attempt}):`, res.status, err.slice(0, 200));
        if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text?.trim()) return text.trim();
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`[gemini] Failed (attempt ${attempt}):`, err);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Public: chat with AI — tries providers in order
// ──────────────────────────────────────────────────────────────

export async function chatWithAi(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
  offlineFallback?: (message: string) => string,
): Promise<AiResponse> {
  // 1. Groq (fastest, free, worldwide)
  const groqResult = await callGroq(systemPrompt, userMessage, history);
  if (groqResult) {
    return { ok: true, text: groqResult, provider: 'groq' };
  }

  // 2. OpenRouter (many free models)
  const orResult = await callOpenRouter(systemPrompt, userMessage, history);
  if (orResult) {
    return { ok: true, text: orResult, provider: 'openrouter' };
  }

  // 3. Gemini (geo-restricted)
  const geminiResult = await callGemini(systemPrompt, userMessage, history);
  if (geminiResult) {
    return { ok: true, text: geminiResult, provider: 'gemini' };
  }

  // 4. Offline fallback
  if (offlineFallback) {
    return { ok: true, text: offlineFallback(userMessage), provider: 'offline' };
  }

  return { ok: false, text: '', provider: 'offline' };
}

// ──────────────────────────────────────────────────────────────
// Public: check which providers are available
// ──────────────────────────────────────────────────────────────

export function getAiProviders(): { name: string; key: string; available: boolean }[] {
  return [
    { name: 'Groq (Llama 3.3 70B)', key: 'GROQ_API_KEY', available: !!process.env.GROQ_API_KEY },
    { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', available: !!process.env.OPENROUTER_API_KEY },
    { name: 'Google Gemini', key: 'GEMINI_API_KEY', available: !!process.env.GEMINI_API_KEY },
  ];
}

export function isAiAvailable(): boolean {
  return !!(process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY);
}
