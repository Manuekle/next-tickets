import { AiProviderType } from '@prisma/client';
import { AiAdapter } from './base.adapter';
import { OpenAiAdapter } from './openai.adapter';
import { AnthropicAdapter } from './anthropic.adapter';
import { GeminiAdapter } from './gemini.adapter';
import { OpenRouterAdapter } from './openrouter.adapter';
import { GroqAdapter } from './groq.adapter';

const registry: Record<AiProviderType, AiAdapter> = {
  OPENAI: new OpenAiAdapter(),
  ANTHROPIC: new AnthropicAdapter(),
  GEMINI: new GeminiAdapter(),
  OPENROUTER: new OpenRouterAdapter(),
  GROQ: new GroqAdapter(),
};

export function getAdapter(type: AiProviderType): AiAdapter {
  const adapter = registry[type];
  if (!adapter) throw new Error(`Unknown AI provider type: ${type}`);
  return adapter;
}
