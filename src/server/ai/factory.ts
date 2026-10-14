import { AIProvider, ProviderStatus, AIProviderType } from './types';
import { GeminiProvider } from './providers/gemini';
import { DeterministicFallbackProvider } from './providers/fallback';

export class AIProviderFactory {
  static getProvider(): { provider: AIProvider; status: ProviderStatus } {
    const gemini = new GeminiProvider();
    const fallback = new DeterministicFallbackProvider();
    const isConfigured = gemini.isConfigured();

    const features = [
      'AI Python Tutor',
      'Explain My Weak Topics',
      'Generate Practice Questions',
      'Explain My Mistake',
      'Personalized Study Plan',
      'Explain Python Code',
    ];

    if (!isConfigured) {
      const status: ProviderStatus = {
        provider: 'gemini',
        model: gemini.model,
        isConfigured: false,
        status: 'awaiting_configuration',
        message: 'Deterministic Python learning engine is active.',
        features,
      };
      return { provider: fallback, status };
    }

    const status: ProviderStatus = {
      provider: 'gemini',
      model: gemini.model,
      isConfigured: true,
      status: 'active',
      message: `Google Gemini (${gemini.model}) is actively connected.`,
      features,
    };
    return { provider: gemini, status };
  }
}
