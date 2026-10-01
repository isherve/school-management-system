import { config } from '../../config/index.js';

export type LlmMode = 'openai' | 'gemini' | 'fallback';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export function resolveLlmMode(): { mode: LlmMode; model: string | null } {
  const provider = config.ai.provider || 'auto';
  const hasOpenAi = config.ai.openaiApiKey.length > 0;
  const hasGemini = config.ai.geminiApiKey.length > 0;

  if (provider === 'fallback') return { mode: 'fallback', model: null };
  if (provider === 'openai') {
    return hasOpenAi ? { mode: 'openai', model: config.ai.openaiModel } : { mode: 'fallback', model: null };
  }
  if (provider === 'gemini') {
    return hasGemini ? { mode: 'gemini', model: config.ai.geminiModel } : { mode: 'fallback', model: null };
  }
  if (hasOpenAi) return { mode: 'openai', model: config.ai.openaiModel };
  if (hasGemini) return { mode: 'gemini', model: config.ai.geminiModel };
  return { mode: 'fallback', model: null };
}

function sanitizeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'request failed';
  return raw.replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted]').replace(/AIza[\w-]{10,}/g, '[redacted]').slice(0, 180);
}

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  return sanitizeError(new Error(text.slice(0, 300) || response.statusText));
}

async function completeOpenAi(system: string, messages: ChatTurn[], model: string): Promise<string> {
  const response = await fetch(`${config.ai.openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.ai.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status}): ${await readError(response)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenAI returned an empty reply');
  return text;
}

async function completeGemini(system: string, messages: ChatTurn[], model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.ai.geminiApiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      generationConfig: { temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status}): ${await readError(response)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned an empty reply');
  return text;
}

export async function completeWithLlm(system: string, messages: ChatTurn[]): Promise<{ text: string; mode: Exclude<LlmMode, 'fallback'>; model: string }> {
  const resolved = resolveLlmMode();
  if (resolved.mode === 'fallback' || !resolved.model) {
    throw new Error('NO_LIVE_MODEL');
  }

  if (resolved.mode === 'openai') {
    const text = await completeOpenAi(system, messages, resolved.model);
    return { text, mode: 'openai', model: resolved.model };
  }

  const text = await completeGemini(system, messages, resolved.model);
  return { text, mode: 'gemini', model: resolved.model };
}

export { sanitizeError };
