// ──────────────────────────────────────────────────────────────
// Multi-Provider AI Module
//
// Provider priority:
//   1. z-ai-web-dev-sdk — built-in, always available, server-side
//   2. Groq (Llama 3.3 70B) — FREE, ultra-fast
//   3. OpenRouter (free models) — FREE, many models
//   4. Gemini — FREE, but geo-restricted
//   5. Offline fallback — smart keyword matching
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
// Provider 1: z-ai-web-dev-sdk (built-in, always available)
// ──────────────────────────────────────────────────────────────

let zaiInstance: any = null;

async function getZaiInstance() {
  if (!zaiInstance) {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      zaiInstance = await ZAI.create();
    } catch (err) {
      console.error('[z-ai-sdk] Failed to initialize:', err);
      return null;
    }
  }
  return zaiInstance;
}

async function callZaiSdk(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string | null> {
  try {
    const zai = await getZaiInstance();
    if (!zai) return null;

    const messages: Array<{ role: string; content: string }> = [
      { role: 'assistant', content: systemPrompt },
    ];

    const recent = history.slice(-20);
    for (const msg of recent) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: 'user', content: userMessage });

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const text = completion?.choices?.[0]?.message?.content;
    if (text?.trim()) return text.trim();

    return null;
  } catch (err) {
    console.error('[z-ai-sdk] Error:', err);
    // Reset instance on error so next call retries
    zaiInstance = null;
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Provider 2: Groq (Llama 3.3 70B) — FREE, ultra-fast
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
        top_p: 0.9,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.warn(`[groq] Error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (text?.trim()) return text.trim();
    return null;
  } catch (err) {
    console.error('[groq] Failed:', err);
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
          'X-Title': 'AgentBot AI Assistant',
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
      const text = data?.choices?.[0]?.message?.content;
      if (text?.trim()) return text.trim();
    } catch {
      continue;
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Provider 4: Google Gemini
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
        generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text?.trim()) return text.trim();
    return null;
  } catch (err) {
    console.error('[gemini] Failed:', err);
    return null;
  }
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
  // 1. z-ai-web-dev-sdk (built-in, always available)
  const sdkResult = await callZaiSdk(systemPrompt, userMessage, history);
  if (sdkResult) {
    return { ok: true, text: sdkResult, provider: 'z-ai-sdk' };
  }

  // 2. Groq (fastest external, free)
  const groqResult = await callGroq(systemPrompt, userMessage, history);
  if (groqResult) {
    return { ok: true, text: groqResult, provider: 'groq' };
  }

  // 3. OpenRouter (many free models)
  const orResult = await callOpenRouter(systemPrompt, userMessage, history);
  if (orResult) {
    return { ok: true, text: orResult, provider: 'openrouter' };
  }

  // 4. Gemini (geo-restricted)
  const geminiResult = await callGemini(systemPrompt, userMessage, history);
  if (geminiResult) {
    return { ok: true, text: geminiResult, provider: 'gemini' };
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
    { name: 'AI Assistant', key: 'z-ai-sdk', available: true },
    { name: 'Groq (Llama 3.3 70B)', key: 'GROQ_API_KEY', available: !!process.env.GROQ_API_KEY },
    { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', available: !!process.env.OPENROUTER_API_KEY },
    { name: 'Google Gemini', key: 'GEMINI_API_KEY', available: !!process.env.GEMINI_API_KEY },
  ];
}

export function isAiAvailable(): boolean {
  // z-ai-sdk is always available (built-in)
  return true;
}
