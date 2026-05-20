import { AiAdapter, AiAdapterError, AiCompletionRequest, AiCompletionResponse } from './base.adapter';

export class OpenAiAdapter implements AiAdapter {
  readonly name = 'openai';
  private base = 'https://api.openai.com/v1';

  async complete(req: AiCompletionRequest, apiKey: string): Promise<AiCompletionResponse> {
    const messages: Array<{ role: string; content: string }> = [];
    if (req.system) messages.push({ role: 'system', content: req.system });
    messages.push({ role: 'user', content: req.prompt });

    const res = await fetch(`${this.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: req.model,
        messages,
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 1024,
      }),
      signal: req.signal,
    });
    if (!res.ok) throw new AiAdapterError(this.name, res.status, await res.text());
    const json = await res.json();
    return {
      content: json.choices?.[0]?.message?.content ?? '',
      promptTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
      model: json.model ?? req.model,
      raw: json,
    };
  }

  async ping(apiKey: string, model: string): Promise<void> {
    await this.complete({ prompt: 'ping', model, maxTokens: 1, temperature: 0 }, apiKey);
  }
}
