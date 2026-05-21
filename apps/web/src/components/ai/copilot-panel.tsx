'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon, BubbleChatIcon, Tag01Icon, Copy01Icon, Robot01Icon, CheckmarkCircle02Icon, Book01Icon, BookmarkAdd01Icon } from '@hugeicons/core-free-icons';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

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
    <Card className="mt-3 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 border-b border-hairline px-3.5 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-tint text-accent">
          <HugeiconsIcon icon={SparklesIcon} size={13} />
        </div>
        <div className="text-xs font-semibold text-ink">AI Copilot</div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-3" data-drag-handle="false">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => run(a.key, a.path)}
            disabled={loading !== null}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[11.5px] font-medium transition-colors',
              loading === a.key
                ? 'bg-accent-tint text-accent'
                : 'bg-surface-2 text-ink-soft hover:bg-surface-3 hover:text-ink',
              loading !== null && 'cursor-wait',
            )}
          >
            <HugeiconsIcon icon={a.icon} size={11} />
            {loading === a.key ? 'Working…' : a.label}
          </button>
        ))}
      </div>

      {result && (
        <div className="flex flex-col gap-2 border-t border-hairline px-3.5 py-3">
          {result.summary && (
            <div className="whitespace-pre-wrap text-xs leading-normal text-ink">{result.summary}</div>
          )}
          {result.reply && (
            <>
              <div className="whitespace-pre-wrap rounded-md bg-surface-2 p-2.5 text-xs leading-normal text-ink">
                {result.reply}
              </div>
              <Button
                size="sm"
                variant={copied ? 'primary' : 'secondary'}
                onClick={copyReply}
                className="self-start"
              >
                <HugeiconsIcon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} size={11} />
                {copied ? 'Copied' : 'Copy reply'}
              </Button>
            </>
          )}
          {(result.priority || result.category) && (
            <div className="flex flex-col gap-1 text-[11.5px]">
              {result.priority && <div><span className="text-mute">Suggested priority:</span> <strong className="text-ink">{result.priority}</strong></div>}
              {result.category && <div><span className="text-mute">Suggested category:</span> <strong className="text-ink">{result.category}</strong></div>}
              {result.reason && <div className="italic text-ink-soft">{result.reason}</div>}
            </div>
          )}
          {result.duplicates !== undefined && (
            result.duplicates.length === 0 ? (
              <div className="text-xs text-mute">No duplicates detected.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {result.duplicates.map((d) => (
                  <a
                    key={d.id}
                    href={`/tickets/${d.id}`}
                    className="block rounded-md bg-surface-2 p-2.5 text-[11.5px] text-ink no-underline transition-colors hover:bg-surface-3"
                  >
                    <div className="font-mono font-semibold text-ink">#{d.id.slice(-6).toUpperCase()}</div>
                    {d.similarity !== undefined && <div className="text-[10.5px] text-mute">Similarity: {Math.round((d.similarity ?? 0) * 100)}%</div>}
                    {d.reason && <div className="mt-0.5 text-ink-soft">{d.reason}</div>}
                  </a>
                ))}
              </div>
            )
          )}
          {result.title && result.content && (
            <>
              <div className="text-[13px] font-semibold text-ink">{result.title}</div>
              {result.excerpt && (
                <div className="text-[11.5px] italic text-mute">{result.excerpt}</div>
              )}
              <div className="max-h-[200px] overflow-y-auto whitespace-pre-wrap rounded-md bg-surface-2 p-2.5 text-xs leading-normal text-ink">
                {result.content}
              </div>
              <Button size="sm" onClick={saveToKb} disabled={saving} className="self-start">
                <HugeiconsIcon icon={BookmarkAdd01Icon} size={11} />
                {saving ? 'Saving…' : 'Save to Knowledge Base'}
              </Button>
            </>
          )}
          {result.raw && (
            <div className="whitespace-pre-wrap font-mono text-[11px] text-mute">{result.raw}</div>
          )}
        </div>
      )}
    </Card>
  );
}
