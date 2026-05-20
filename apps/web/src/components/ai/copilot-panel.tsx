'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon, BubbleChatIcon, Tag01Icon, Copy01Icon, Robot01Icon, CheckmarkCircle02Icon, Book01Icon, BookmarkAdd01Icon } from '@hugeicons/core-free-icons';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';

type CopilotAction = 'summarize' | 'suggest-reply' | 'classify' | 'detect-duplicates' | 'generate-faq';

interface DuplicateItem { id: string; similarity?: number; reason?: string; }

interface CopilotResult {
  action: CopilotAction;
  summary?: string;
  reply?: string;
  priority?: string;
  category?: string;
  reason?: string;
  duplicates?: DuplicateItem[];
  title?: string;
  content?: string;
  excerpt?: string;
  raw?: string;
}

const ACTIONS: Array<{ key: CopilotAction; label: string; icon: any; path: string }> = [
  { key: 'summarize',         label: 'Summarize',       icon: SparklesIcon,   path: 'summarize' },
  { key: 'suggest-reply',     label: 'Suggest reply',   icon: BubbleChatIcon, path: 'suggest-reply' },
  { key: 'classify',          label: 'Classify',        icon: Tag01Icon,      path: 'classify' },
  { key: 'detect-duplicates', label: 'Find duplicates', icon: Robot01Icon,    path: 'detect-duplicates' },
  { key: 'generate-faq',      label: 'Generate FAQ',    icon: Book01Icon,     path: 'generate-faq' },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export function CopilotPanel({ ticketId }: { ticketId: string }) {
  const [loading, setLoading] = useState<CopilotAction | null>(null);
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveToKb = async () => {
    if (!result?.title || !result?.content) return;
    setSaving(true);
    try {
      const slug = `${slugify(result.title)}-${Date.now().toString(36).slice(-4)}`;
      const created = await apiClient<{ data: { id: string; slug: string } }>('/knowledge', {
        method: 'POST',
        body: JSON.stringify({
          title: result.title,
          content: result.content,
          excerpt: result.excerpt,
          slug,
          published: false,
        }),
      });
      const newSlug = created?.data?.slug ?? slug;
      sileo.success({ title: 'Saved as draft article', description: newSlug });
    } catch (e: any) {
      sileo.error({ title: 'Save failed', description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const run = async (action: CopilotAction, path: string) => {
    setLoading(action);
    setResult(null);
    try {
      const res = await apiClient<{ data: any }>(`/ai/copilot/tickets/${ticketId}/${path}`, { method: 'POST' });
      const data = res?.data ?? res;
      setResult({ action, ...data });
    } catch (e: any) {
      sileo.error({ title: 'Copilot failed', description: e?.message ?? 'Check provider configuration in Settings > AI' });
    } finally {
      setLoading(null);
    }
  };

  const copyReply = async () => {
    if (!result?.reply) return;
    try {
      await navigator.clipboard.writeText(result.reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginTop: '12px' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HugeiconsIcon icon={SparklesIcon} size={13} />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>AI Copilot</div>
      </div>

      <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }} data-drag-handle="false">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => run(a.key, a.path)}
            disabled={loading !== null}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px',
              fontSize: '11.5px', fontWeight: 500, border: 0, borderRadius: '8px',
              background: loading === a.key ? 'var(--accent-tint)' : 'var(--surface-2)',
              color: loading === a.key ? 'var(--accent)' : 'var(--ink-soft)',
              cursor: loading !== null ? 'wait' : 'pointer', transition: 'all 120ms',
            }}
          >
            <HugeiconsIcon icon={a.icon} size={11} />
            {loading === a.key ? 'Working…' : a.label}
          </button>
        ))}
      </div>

      {result && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {result.summary && (
            <div style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{result.summary}</div>
          )}
          {result.reply && (
            <>
              <div style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap', background: 'var(--surface-2)', padding: '10px', borderRadius: '8px' }}>
                {result.reply}
              </div>
              <button
                onClick={copyReply}
                style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, border: 0, borderRadius: '6px', background: copied ? 'var(--accent)' : 'var(--surface-2)', color: copied ? '#fff' : 'var(--ink-soft)', cursor: 'pointer' }}
              >
                <HugeiconsIcon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} size={11} />
                {copied ? 'Copied' : 'Copy reply'}
              </button>
            </>
          )}
          {(result.priority || result.category) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
              {result.priority && <div><span style={{ color: 'var(--mute)' }}>Suggested priority:</span> <strong style={{ color: 'var(--ink)' }}>{result.priority}</strong></div>}
              {result.category && <div><span style={{ color: 'var(--mute)' }}>Suggested category:</span> <strong style={{ color: 'var(--ink)' }}>{result.category}</strong></div>}
              {result.reason && <div style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>{result.reason}</div>}
            </div>
          )}
          {result.duplicates !== undefined && (
            result.duplicates.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--mute)' }}>No duplicates detected.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.duplicates.map((d) => (
                  <a
                    key={d.id}
                    href={`/tickets/${d.id}`}
                    style={{ display: 'block', padding: '8px 10px', borderRadius: '7px', background: 'var(--surface-2)', textDecoration: 'none', color: 'var(--ink)', fontSize: '11.5px' }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent)', fontWeight: 600 }}>#{d.id.slice(-6).toUpperCase()}</div>
                    {d.similarity !== undefined && <div style={{ color: 'var(--mute)', fontSize: '10.5px' }}>Similarity: {Math.round((d.similarity ?? 0) * 100)}%</div>}
                    {d.reason && <div style={{ color: 'var(--ink-soft)', marginTop: '2px' }}>{d.reason}</div>}
                  </a>
                ))}
              </div>
            )
          )}
          {result.title && result.content && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{result.title}</div>
              {result.excerpt && (
                <div style={{ fontSize: '11.5px', color: 'var(--mute)', fontStyle: 'italic' }}>{result.excerpt}</div>
              )}
              <div style={{
                fontSize: '12px', color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                background: 'var(--surface-2)', padding: '10px', borderRadius: '8px',
                maxHeight: '200px', overflowY: 'auto',
              }}>
                {result.content}
              </div>
              <button
                onClick={saveToKb}
                disabled={saving}
                style={{
                  display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', fontSize: '11.5px', fontWeight: 600, border: 0, borderRadius: '7px',
                  background: 'var(--accent)', color: '#fff', cursor: 'pointer', opacity: saving ? 0.55 : 1,
                }}
              >
                <HugeiconsIcon icon={BookmarkAdd01Icon} size={11} />
                {saving ? 'Saving…' : 'Save to Knowledge Base'}
              </button>
            </>
          )}
          {result.raw && (
            <div style={{ fontSize: '11px', color: 'var(--mute)', fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'pre-wrap' }}>{result.raw}</div>
          )}
        </div>
      )}
    </div>
  );
}
