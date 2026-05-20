import { AiAdapter, AiAdapterError, AiCompletionRequest, AiCompletionResponse } from './base.adapter';

export class AnthropicAdapter implements AiAdapter {
  readonly name = 'anthropic';
  private base = 'https://api.anthropic.com/v1';
  private version = '2023-06-01';

  async complete(req: AiCompletionRequest, apiKey: string): Promise<AiCompletionResponse> {
    const res = await fetch(`${this.base}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': this.version,
      },
      body: JSON.stringify({
        model: req.model,
        system: req.system,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.3,
        messages: [{ role: 'user', content: req.prompt }],
      }),
      signal: req.signal,
    });
    if (!res.ok) throw new AiAdapterError(this.name, res.status, await res.text());
    const json = await res.json();
    const content = Array.isArray(json.content)
      ? json.content.map((c: any) => c.text ?? '').join('')
      : '';
    return {
      content,
      promptTokens: json.usage?.input_tokens ?? 0,
      outputTokens: json.usage?.output_tokens ?? 0,
      model: json.model ?? req.model,
      raw: json,
    };
  }

  async ping(apiKey: string, model: string): Promise<void> {
    await this.complete({ prompt: 'ping', model, maxTokens: 1, temperature: 0 }, apiKey);
  }
}
