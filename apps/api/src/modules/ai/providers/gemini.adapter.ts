import { AiAdapter, AiAdapterError, AiCompletionRequest, AiCompletionResponse } from './base.adapter';

export class GeminiAdapter implements AiAdapter {
  readonly name = 'gemini';
  private base = 'https://generativelanguage.googleapis.com/v1beta';

  async complete(req: AiCompletionRequest, apiKey: string): Promise<AiCompletionResponse> {
    const url = `${this.base}/models/${encodeURIComponent(req.model)}:generateContent?key=${apiKey}`;
    const parts: any[] = [];
    if (req.system) parts.push({ text: `${req.system}\n\n${req.prompt}` });
    else parts.push({ text: req.prompt });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: req.temperature ?? 0.3,
          maxOutputTokens: req.maxTokens ?? 1024,
        },
      }),
      signal: req.signal,
    });
    if (!res.ok) throw new AiAdapterError(this.name, res.status, await res.text());
    const json = await res.json();
    const content = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
    return {
      content,
      promptTokens: json.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
      model: req.model,
      raw: json,
    };
  }

  async ping(apiKey: string, model: string): Promise<void> {
    await this.complete({ prompt: 'ping', model, maxTokens: 1, temperature: 0 }, apiKey);
  }
}
