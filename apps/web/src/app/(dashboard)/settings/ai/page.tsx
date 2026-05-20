'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Robot01Icon, PlusSignIcon, Delete02Icon, PencilEdit01Icon, CheckmarkCircle02Icon, AlertCircleIcon, ZapIcon, StarIcon, FloppyDiskIcon } from '@hugeicons/core-free-icons';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { AiProviderType } from '@next-tickets/shared';
import type { AiProviderDto, AiTestResult, CreateAiProviderInput } from '@next-tickets/shared';

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

function Card({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.005em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '2px' }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 11px', fontSize: '13px', border: 0, borderRadius: '8px',
  background: 'var(--surface-2)', color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
};
const LABEL_STYLE: React.CSSProperties = { fontSize: '11.5px', fontWeight: 600, color: 'var(--mute)', marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' };

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
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)', textDecoration: 'none', marginBottom: '10px' }}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={12} /> Settings
        </Link>
        <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
          AI & Integrations
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '4px' }}>Configure AI providers used by the copilot features.</p>
      </div>

      <Card
        title="Providers"
        subtitle={loading ? 'Loading…' : `${providers.length} configured`}
        action={
          !showForm && (
            <button
              onClick={openCreate}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, border: 0, borderRadius: '8px', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={12} /> Add provider
            </button>
          )
        }
      >
        {showForm && (
          <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '16px', marginBottom: providers.length ? '16px' : 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{form.id ? 'Edit provider' : 'New provider'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={LABEL_STYLE}>Provider</label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const t = e.target.value as AiProviderType;
                    setForm((f) => ({ ...f, type: t, model: PROVIDER_MODELS[t][0] }));
                  }}
                  style={INPUT_STYLE}
                >
                  {Object.values(AiProviderType).map((t) => (
                    <option key={t} value={t}>{PROVIDER_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Label</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Production OpenAI"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div>
              <label style={LABEL_STYLE}>API key {form.id && <span style={{ color: 'var(--mute)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(leave blank to keep current)</span>}</label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder={form.id ? '••••••••' : 'sk-...'}
                style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono, monospace)' }}
                autoComplete="off"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={LABEL_STYLE}>Model</label>
                <input
                  list="model-suggestions"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  style={INPUT_STYLE}
                />
                <datalist id="model-suggestions">
                  {PROVIDER_MODELS[form.type].map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div>
                <label style={LABEL_STYLE}>Temperature</label>
                <input
                  type="number" step="0.1" min={0} max={2}
                  value={form.temperature}
                  onChange={(e) => setForm((f) => ({ ...f, temperature: parseFloat(e.target.value) || 0 }))}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Max tokens</label>
                <input
                  type="number" min={1} max={32000}
                  value={form.maxTokens}
                  onChange={(e) => setForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) || 1024 }))}
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={LABEL_STYLE}>Rate limit (rpm)</label>
                <input
                  type="number" min={1} max={10000}
                  value={form.rateLimitRpm}
                  onChange={(e) => setForm((f) => ({ ...f, rateLimitRpm: parseInt(e.target.value) || 60 }))}
                  style={INPUT_STYLE}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ink-soft)', cursor: 'pointer', paddingTop: '20px' }}>
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
                Enabled
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ink-soft)', cursor: 'pointer', paddingTop: '20px' }}>
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
                Default
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 14px', fontSize: '12px', border: 0, borderRadius: '8px', background: 'var(--surface)', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, border: 0, borderRadius: '8px', background: 'var(--accent)', color: '#fff', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
              >
                <HugeiconsIcon icon={FloppyDiskIcon} size={12} />
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: '12px', color: 'var(--mute)', textAlign: 'center', padding: '20px' }}>Loading providers…</div>
        ) : providers.length === 0 && !showForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '32px 12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
              <HugeiconsIcon icon={Robot01Icon} size={22} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>No providers yet</div>
            <div style={{ fontSize: '12px', color: 'var(--mute)', textAlign: 'center' }}>Add an AI provider to enable copilot features.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {providers.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: 'var(--surface-2)', opacity: p.enabled ? 1 : 0.55 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HugeiconsIcon icon={Robot01Icon} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{p.label}</span>
                    {p.isDefault && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '5px', background: 'var(--accent-tint)', color: 'var(--accent)' }}>
                        <HugeiconsIcon icon={StarIcon} size={9} /> DEFAULT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--mute)', marginTop: '2px', display: 'flex', gap: '8px', fontFamily: 'var(--font-mono, monospace)' }}>
                    <span>{PROVIDER_LABELS[p.type]}</span>·<span>{p.model}</span>·<span>{p.apiKeyMasked}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    title="Test connection"
                    onClick={() => test(p)}
                    disabled={testingId === p.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 0, borderRadius: '8px', background: 'var(--surface)', color: 'var(--ink-soft)', cursor: 'pointer' }}
                  >
                    <HugeiconsIcon icon={ZapIcon} size={13} />
                  </button>
                  {!p.isDefault && (
                    <button
                      title="Set as default"
                      onClick={() => setDefault(p)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 0, borderRadius: '8px', background: 'var(--surface)', color: 'var(--ink-soft)', cursor: 'pointer' }}
                    >
                      <HugeiconsIcon icon={StarIcon} size={13} />
                    </button>
                  )}
                  <button
                    title={p.enabled ? 'Disable' : 'Enable'}
                    onClick={() => toggleEnabled(p)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 0, borderRadius: '8px', background: 'var(--surface)', color: p.enabled ? 'oklch(0.55 0.16 148)' : 'var(--mute)', cursor: 'pointer' }}
                  >
                    <HugeiconsIcon icon={p.enabled ? CheckmarkCircle02Icon : AlertCircleIcon} size={13} />
                  </button>
                  <button
                    title="Edit"
                    onClick={() => openEdit(p)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 0, borderRadius: '8px', background: 'var(--surface)', color: 'var(--ink-soft)', cursor: 'pointer' }}
                  >
                    <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => remove(p)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 0, borderRadius: '8px', background: 'var(--surface)', color: 'oklch(0.55 0.20 22)', cursor: 'pointer' }}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
