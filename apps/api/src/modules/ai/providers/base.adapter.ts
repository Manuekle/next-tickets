export interface AiCompletionRequest {
  system?: string;
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AiCompletionResponse {
  content: string;
  promptTokens: number;
  outputTokens: number;
  model: string;
  raw?: unknown;
}

export interface AiAdapter {
  readonly name: string;
  complete(req: AiCompletionRequest, apiKey: string): Promise<AiCompletionResponse>;
  ping(apiKey: string, model: string): Promise<void>;
}

export class AiAdapterError extends Error {
  constructor(public adapter: string, public status: number | null, message: string) {
    super(`[${adapter}] ${message}`);
    this.name = 'AiAdapterError';
  }
}
