// ──────────────────────────────────────────────────────────────
// Multi-Provider AI Module — cloud-only, works on any server
//
// Provider priority:
//   1. Groq (Llama 3.3 70B) — FREE, ultra-fast
//   2. Gemini 2.0 Flash — FREE, Google
//   3. OpenRouter (free models) — FREE, many models
//   4. HuggingFace (free inference) — NO KEY NEEDED
//   5. Offline fallback — smart keyword matching (ru/en/tr)
//
// Setup: Add ONE of these env vars for best quality:
//   GROQ_API_KEY       → https://console.groq.com
//   GEMINI_API_KEY     → https://aistudio.google.com/apikey
//   OPENROUTER_API_KEY → https://openrouter.ai
//
// WITHOUT any key, HuggingFace free inference is used automatically.
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
// Provider 1: Groq (Llama 3.3 70B) — FREE, ultra-fast
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
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Provider 2: Google Gemini 2.0 Flash
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

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Provider 3: OpenRouter (multiple free models)
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
          'X-Title': 'AgentBot AI',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      return data?.choices?.[0]?.message?.content?.trim() || null;
    } catch {
      continue;
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Provider 4: Pollinations AI — FREE, NO KEY, works everywhere
// ──────────────────────────────────────────────────────────────

async function callPollinations(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string | null> {
  // Build a single prompt from system + history + user message
  const parts: string[] = [];
  parts.push(`[System instructions]: ${systemPrompt}`);

  const recent = history.slice(-6);
  for (const msg of recent) {
    const label = msg.role === 'assistant' ? 'Assistant' : 'User';
    parts.push(`[${label}]: ${msg.content}`);
  }
  parts.push(`[User]: ${userMessage}`);
  parts.push('[Assistant]:');

  const prompt = parts.join('\n');
  const encodedPrompt = encodeURIComponent(prompt);

  try {
    const res = await fetch(`https://text.pollinations.ai/${encodedPrompt}`, {
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) return null;

    const text = await res.text();
    if (text?.trim()?.length > 3) return text.trim();
    return null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Provider 5: HuggingFace FREE Inference — NO KEY NEEDED
// Uses free community models with rate limits
// ──────────────────────────────────────────────────────────────

async function callHuggingFace(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string | null> {
  // Build a single prompt from system + history + user message
  const parts: string[] = [];
  parts.push(`[System]: ${systemPrompt}`);

  const recent = history.slice(-10);
  for (const msg of recent) {
    const label = msg.role === 'assistant' ? 'Assistant' : 'User';
    parts.push(`[${label}]: ${msg.content}`);
  }
  parts.push(`[User]: ${userMessage}`);
  parts.push('[Assistant]:');

  const prompt = parts.join('\n');

  // Try multiple free models
  const models = [
    'mistralai/Mistral-7B-Instruct-v0.3',
    'microsoft/Phi-3-mini-4k-instruct',
    'HuggingFaceH4/zephyr-7b-beta',
  ];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 1024,
              temperature: 0.7,
              return_full_text: false,
            },
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (!res.ok) continue;

      const data = await res.json();
      if (Array.isArray(data) && data[0]?.generated_text) {
        const text = data[0].generated_text.trim();
        if (text.length > 5) return text;
      }
    } catch {
      continue;
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
  // 1. Groq (fastest, free)
  const groqResult = await callGroq(systemPrompt, userMessage, history);
  if (groqResult) {
    return { ok: true, text: groqResult, provider: 'Groq AI' };
  }

  // 2. Gemini (Google)
  const geminiResult = await callGemini(systemPrompt, userMessage, history);
  if (geminiResult) {
    return { ok: true, text: geminiResult, provider: 'Gemini AI' };
  }

  // 3. OpenRouter (many free models)
  const orResult = await callOpenRouter(systemPrompt, userMessage, history);
  if (orResult) {
    return { ok: true, text: orResult, provider: 'OpenRouter AI' };
  }

  // 4. Pollinations (FREE, no key, works on Vercel)
  const pollResult = await callPollinations(systemPrompt, userMessage, history);
  if (pollResult) {
    return { ok: true, text: pollResult, provider: 'Pollinations AI' };
  }

  // 5. HuggingFace FREE — no key needed
  const hfResult = await callHuggingFace(systemPrompt, userMessage, history);
  if (hfResult) {
    return { ok: true, text: hfResult, provider: 'HuggingFace AI' };
  }

  // 5. Offline fallback
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
    { name: 'Groq AI', key: 'GROQ_API_KEY', available: !!process.env.GROQ_API_KEY },
    { name: 'Gemini AI', key: 'GEMINI_API_KEY', available: !!process.env.GEMINI_API_KEY },
    { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', available: !!process.env.OPENROUTER_API_KEY },
    { name: 'Pollinations AI', key: 'always-free', available: true },
  ];
}

export function isAiAvailable(): boolean {
  // HuggingFace is always available (no key needed)
  return true;
}
