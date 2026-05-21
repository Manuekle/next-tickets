'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Robot01Icon, PlusSignIcon, Delete02Icon, PencilEdit01Icon, CheckmarkCircle02Icon, AlertCircleIcon, ZapIcon, StarIcon, FloppyDiskIcon } from '@hugeicons/core-free-icons';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { AiProviderType } from '@next-tickets/shared';
import type { AiProviderDto, AiTestResult, CreateAiProviderInput } from '@next-tickets/shared';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Button,
  Badge,
  Checkbox,
  EmptyState,
  Tooltip,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { cn } from '@/lib/utils';

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  [AiProviderType.OPENAI]: 'OpenAI',
  [AiProviderType.ANTHROPIC]: 'Anthropic',
  [AiProviderType.GEMINI]: 'Google Gemini',
  [AiProviderType.OPENROUTER]: 'OpenRouter',
  [AiProviderType.GROQ]: 'Groq',
};

const PROVIDER_MODELS: Record<AiProviderType, string[]> = {
  [AiProviderType.OPENAI]: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  [AiProviderType.ANTHROPIC]: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  [AiProviderType.GEMINI]: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  [AiProviderType.OPENROUTER]: ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-6', 'meta-llama/llama-3.3-70b-instruct'],
  [AiProviderType.GROQ]: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
};

interface FormState {
  id?: string;
  type: AiProviderType;
  label: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  rateLimitRpm: number;
  enabled: boolean;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  type: AiProviderType.OPENAI,
  label: '',
  apiKey: '',
  model: PROVIDER_MODELS[AiProviderType.OPENAI][0],
  temperature: 0.3,
  maxTokens: 1024,
  rateLimitRpm: 60,
  enabled: true,
  isDefault: false,
};

export default function AiSettingsPage() {
  const [providers, setProviders] = useState<AiProviderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient<{ data: AiProviderDto[] }>('/ai/providers');
      setProviders(res?.data ?? []);
    } catch {
      sileo.error({ title: 'Failed to load providers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p: AiProviderDto) => {
    setForm({
      id: p.id,
      type: p.type,
      label: p.label,
      apiKey: '',
      model: p.model,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      rateLimitRpm: p.rateLimitRpm,
      enabled: p.enabled,
      isDefault: p.isDefault,
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.label.trim() || !form.model.trim()) {
      sileo.error({ title: 'Label and model required' });
      return;
    }
    if (!form.id && !form.apiKey.trim()) {
      sileo.error({ title: 'API key required' });
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<CreateAiProviderInput> = {
        type: form.type,
        label: form.label.trim(),
        model: form.model.trim(),
        temperature: form.temperature,
        maxTokens: form.maxTokens,
        rateLimitRpm: form.rateLimitRpm,
        enabled: form.enabled,
        isDefault: form.isDefault,
      };
      if (form.apiKey.trim()) payload.apiKey = form.apiKey.trim();

      if (form.id) {
        await apiClient(`/ai/providers/${form.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        sileo.success({ title: 'Provider updated' });
      } else {
        await apiClient('/ai/providers', { method: 'POST', body: JSON.stringify(payload) });
        sileo.success({ title: 'Provider added' });
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      sileo.error({ title: 'Save failed', description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (p: AiProviderDto) => {
    if (!confirm(`Delete provider "${p.label}"?`)) return;
    try {
      await apiClient(`/ai/providers/${p.id}`, { method: 'DELETE' });
      sileo.success({ title: 'Deleted' });
      load();
    } catch {
      sileo.error({ title: 'Delete failed' });
    }
  };

  const test = async (p: AiProviderDto) => {
    setTestingId(p.id);
    try {
      const res = await apiClient<{ data: AiTestResult }>(`/ai/providers/${p.id}/test`, { method: 'POST' });
      const r = res?.data ?? (res as any);
      if (r.ok) sileo.success({ title: `Connected in ${r.latencyMs}ms` });
      else sileo.error({ title: 'Connection failed', description: r.error });
    } catch (e: any) {
      sileo.error({ title: 'Test failed', description: e?.message });
    } finally {
      setTestingId(null);
    }
  };

  const setDefault = async (p: AiProviderDto) => {
    try {
      await apiClient(`/ai/providers/${p.id}/default`, { method: 'POST' });
      sileo.success({ title: `${p.label} is now default` });
      load();
    } catch {
      sileo.error({ title: 'Failed to set default' });
    }
  };

  const toggleEnabled = async (p: AiProviderDto) => {
    try {
      await apiClient(`/ai/providers/${p.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !p.enabled }) });
      load();
    } catch {
      sileo.error({ title: 'Failed to toggle' });
    }
  };

  return (
    <div className="flex max-w-[720px] flex-col gap-5">
      <div>
        <Link href="/settings" className="mb-2.5 inline-flex items-center gap-1.5 text-xs text-mute no-underline hover:text-ink-soft">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={12} /> Settings
        </Link>
        <h1>AI & Integrations</h1>
        <p className="mt-1 text-[13px] text-mute">Configure AI providers used by the copilot features.</p>
      </div>

      <Card>
        <CardHeader className="border-b border-hairline">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <CardTitle>Providers</CardTitle>
              <CardDescription>{loading ? 'Loading…' : `${providers.length} configured`}</CardDescription>
            </div>
            {!showForm && (
              <Button size="sm" onClick={openCreate}>
                <HugeiconsIcon icon={PlusSignIcon} size={12} /> Add provider
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {showForm && (
            <div className={cn('flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4', providers.length && 'mb-4')}>
              <div className="text-[13px] font-semibold text-ink">{form.id ? 'Edit provider' : 'New provider'}</div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <Label>Provider</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => {
                      const t = v as AiProviderType;
                      setForm((f) => ({ ...f, type: t, model: PROVIDER_MODELS[t][0] }));
                    }}
                  >
                    <SelectTrigger className="bg-surface-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AiProviderType).map((t) => (
                        <SelectItem key={t} value={t}>{PROVIDER_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ai-label">Label</Label>
                  <Input
                    id="ai-label"
                    className="bg-surface-2"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Production OpenAI"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ai-key">
                  API key {form.id && <span className="font-normal normal-case text-mute">(leave blank to keep current)</span>}
                </Label>
                <Input
                  id="ai-key"
                  type="password"
                  className="bg-surface-2 font-mono"
                  value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  placeholder={form.id ? '••••••••' : 'sk-...'}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-[2fr_1fr_1fr] gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ai-model">Model</Label>
                  <Input
                    id="ai-model"
                    list="model-suggestions"
                    className="bg-surface-2"
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  />
                  <datalist id="model-suggestions">
                    {PROVIDER_MODELS[form.type].map((m) => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ai-temp">Temperature</Label>
                  <Input
                    id="ai-temp"
                    type="number" step="0.1" min={0} max={2}
                    className="bg-surface-2"
                    value={form.temperature}
                    onChange={(e) => setForm((f) => ({ ...f, temperature: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ai-max">Max tokens</Label>
                  <Input
                    id="ai-max"
                    type="number" min={1} max={32000}
                    className="bg-surface-2"
                    value={form.maxTokens}
                    onChange={(e) => setForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) || 1024 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ai-rpm">Rate limit (rpm)</Label>
                  <Input
                    id="ai-rpm"
                    type="number" min={1} max={10000}
                    className="bg-surface-2"
                    value={form.rateLimitRpm}
                    onChange={(e) => setForm((f) => ({ ...f, rateLimitRpm: parseInt(e.target.value) || 60 }))}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 pt-5 text-xs text-ink-soft">
                  <Checkbox checked={form.enabled} onCheckedChange={(v: boolean) => setForm((f) => ({ ...f, enabled: !!v }))} />
                  Enabled
                </label>
                <label className="flex cursor-pointer items-center gap-2 pt-5 text-xs text-ink-soft">
                  <Checkbox checked={form.isDefault} onCheckedChange={(v: boolean) => setForm((f) => ({ ...f, isDefault: !!v }))} />
                  Default
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={submit} disabled={submitting}>
                  <HugeiconsIcon icon={FloppyDiskIcon} size={12} />
                  {submitting ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-5 text-center text-xs text-mute">Loading providers…</div>
          ) : providers.length === 0 && !showForm ? (
            <EmptyState
              icon={Robot01Icon}
              title="No providers yet"
              description="Add an AI provider to enable copilot features."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3',
                    !p.enabled && 'opacity-55',
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent">
                    <HugeiconsIcon icon={Robot01Icon} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-ink">{p.label}</span>
                      {p.isDefault && (
                        <Badge variant="solid" className="gap-0.5 uppercase">
                          <HugeiconsIcon icon={StarIcon} size={9} /> Default
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex gap-2 font-mono text-[11.5px] text-mute">
                      <span>{PROVIDER_LABELS[p.type]}</span>·<span>{p.model}</span>·<span>{p.apiKeyMasked}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Tooltip content="Test connection">
                      <Button variant="ghost" size="icon-sm" onClick={() => test(p)} disabled={testingId === p.id}>
                        <HugeiconsIcon icon={ZapIcon} size={13} />
                      </Button>
                    </Tooltip>
                    {!p.isDefault && (
                      <Tooltip content="Set as default">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDefault(p)}>
                          <HugeiconsIcon icon={StarIcon} size={13} />
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip content={p.enabled ? 'Disable' : 'Enable'}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleEnabled(p)}
                        className={p.enabled ? 'text-success' : 'text-mute'}
                      >
                        <HugeiconsIcon icon={p.enabled ? CheckmarkCircle02Icon : AlertCircleIcon} size={13} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Edit">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}>
                        <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete">
                      <Button variant="ghost" size="icon-sm" className="text-danger hover:text-danger" onClick={() => remove(p)}>
                        <HugeiconsIcon icon={Delete02Icon} size={13} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
