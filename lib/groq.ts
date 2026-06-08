import Groq from 'groq-sdk';

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Lazy-init so the client is only created in server-side code that runs after
// env vars are available (Next.js route handlers, not during next build).
let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Missing GROQ_API_KEY environment variable');
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Sleep for `ms` milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Streaming call — fires `onToken` for every token as it arrives, then calls
 * `onComplete` with the concatenated full text when the stream finishes.
 */
export async function streamGroqResponse(
  systemPrompt: string,
  userMessage: string,
  onToken: (token: string) => void,
  onComplete: (fullText: string) => void
): Promise<void> {
  let attempt = 0;
  while (true) {
    try {
      const stream = await getGroq().chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullText += token;
          onToken(token);
        }
      }

      onComplete(fullText);
      return;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = (err as { message?: string })?.message ?? '';

      const isRateLimit =
        status === 429 ||
        msg.includes('429') ||
        msg.toLowerCase().includes('rate limit') ||
        msg.toLowerCase().includes('too many requests');

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s
        console.warn(`Groq rate limited (429). Retrying in ${delay}ms… (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        attempt++;
        continue;
      }
      throw new Error(`Groq streaming error: ${msg || err}`);
    }
  }
}

/**
 * Non-streaming call — waits for the full completion before returning.
 * Use this when the full response is needed before the next step can proceed.
 */
export async function callGroq(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  let attempt = 0;
  while (true) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: false,
        max_tokens: 1024,
        temperature: 0.7,
      });
      return completion.choices[0]?.message?.content ?? '';
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = (err as { message?: string })?.message ?? '';

      const isRateLimit =
        status === 429 ||
        msg.includes('429') ||
        msg.toLowerCase().includes('rate limit') ||
        msg.toLowerCase().includes('too many requests');

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Groq rate limited (429). Retrying in ${delay}ms… (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        attempt++;
        continue;
      }
      throw new Error(`Groq API error: ${msg || err}`);
    }
  }
}
