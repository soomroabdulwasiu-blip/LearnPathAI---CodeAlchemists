import { GoogleGenAI } from '@google/genai';
import { AIProvider, ChatMessage, CompletionOptions, AIProviderType } from '../types';

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini';
  readonly type: AIProviderType = 'gemini';
  readonly model: string;
  private apiKey: string;
  private aiClient: GoogleGenAI | null = null;
  private defaultTimeoutMs: number;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
  }) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = options?.model || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.defaultTimeoutMs = options?.timeoutMs || Number(process.env.AI_TIMEOUT_MS) || 15000;

    if (this.isConfigured()) {
      try {
        this.aiClient = new GoogleGenAI({
          apiKey: this.apiKey.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch {
        this.aiClient = null;
      }
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('MY_GEMINI_API_KEY'));
  }

  async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
    if (!this.isConfigured() || !this.aiClient) {
      throw new Error('Gemini provider is awaiting configuration (GEMINI_API_KEY is not set).');
    }

    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const nonSystem = messages.filter((m) => m.role !== 'system');
    const promptText = nonSystem.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    const modelsToTry = [this.model];
    if (this.model !== 'gemini-3.1-flash-lite') {
      modelsToTry.push('gemini-3.1-flash-lite');
    }

    let lastError: any = null;
    for (const modelName of modelsToTry) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            systemInstruction: systemInstruction || undefined,
            temperature: options?.temperature ?? 0.3,
            maxOutputTokens: options?.maxTokens ? Math.max(options.maxTokens, 1500) : 2048,
            responseMimeType: options?.jsonMode ? 'application/json' : undefined,
          },
        });
        const text = response.text;
        if (text && typeof text === 'string') {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiProvider] Model ${modelName} error:`, err?.message || err);
      }
    }

    const sanitized = String(lastError?.message || lastError || 'Gemini returned an empty response.').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]');
    throw new Error(sanitized);
  }
}
