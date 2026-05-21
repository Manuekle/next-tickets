'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun01Icon, Moon01Icon, ComputerDesk01Icon, Logout01Icon, FloppyDiskIcon, PencilEdit01Icon, Robot01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Avatar,
  Badge,
  Button,
  Input,
  Separator,
} from '@/components/ui';
import type { BadgeProps } from '@/components/ui';
import { cn } from '@/lib/utils';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  AGENT: 'Agent',
  CUSTOMER: 'Customer',
};

const ROLE_VARIANT: Record<string, BadgeProps['variant']> = {
  SUPER_ADMIN: 'danger',
  ADMIN: 'warning',
  AGENT: 'info',
  CUSTOMER: 'success',
};

const THEME_OPTIONS: Array<{ value: string; label: string; icon: any }> = [
  { value: 'light', label: 'Light', icon: Sun01Icon },
  { value: 'system', label: 'System', icon: ComputerDesk01Icon },
  { value: 'dark', label: 'Dark', icon: Moon01Icon },
];

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };

  const saveName = async () => {
    if (!name.trim() || name.trim() === user?.name) { setEditingName(false); return; }
    setSaving(true);
    try {
      const res = await apiClient<{ data: { name: string } }>('/auth/me', { method: 'PATCH', body: JSON.stringify({ name: name.trim() }) });
      const updated = res?.data ?? res as any;
      if (updated?.name) {
        setUser({ ...user!, name: updated.name });
        sileo.success({ title: 'Name updated' });
      }
    } catch {
      sileo.error({ title: 'Failed to update name' });
    } finally {
      setSaving(false);
      setEditingName(false);
    }
  };

  return (
    <div className="flex max-w-[580px] flex-col gap-5">
      <div>
        <h1>Settings</h1>
        <p className="mt-1 text-[13px] text-mute">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="gap-0.5 border-b border-hairline">
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 flex items-center gap-3.5">
            <Avatar name={user?.name ?? 'U'} size={48} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink">{user?.name || '—'}</div>
              <div className="mt-px text-xs text-mute">{user?.email || '—'}</div>
            </div>
            <Badge variant={ROLE_VARIANT[user?.role ?? ''] ?? 'neutral'}>
              {ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '—'}
            </Badge>
          </div>

          <Separator />

          {/* Name field */}
          <div className="pt-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-mute">Display name</span>
              {!editingName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setName(user?.name ?? ''); setEditingName(true); }}
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={10} /> Edit
                </Button>
              )}
            </div>
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="flex-1"
                />
                <Button onClick={saveName} disabled={saving}>
                  <HugeiconsIcon icon={FloppyDiskIcon} size={12} />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="secondary" onClick={() => setEditingName(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="text-[13px] font-medium text-ink">{user?.name || '—'}</div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="mt-3 pt-3">
            <Separator className="mb-3" />
            <div className="mb-1 text-xs font-medium text-mute">Email address</div>
            <div className="text-[13px] text-ink-soft">{user?.email || '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="gap-0.5 border-b border-hairline">
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div
            role="radiogroup"
            aria-label="Color scheme"
            className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1"
          >
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1.5 rounded-md px-2 py-2.5 text-xs font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-fg'
                      : 'text-ink-soft hover:bg-surface-3 hover:text-ink',
                  )}
                >
                  <HugeiconsIcon icon={opt.icon} size={16} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI & Integrations */}
      <Card>
        <CardHeader className="gap-0.5 border-b border-hairline">
          <CardTitle>AI & Integrations</CardTitle>
          <CardDescription>Configure AI providers and copilot features</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Link
            href="/settings/ai"
            className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3 text-ink no-underline transition-colors hover:bg-surface-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cat-purple-tint text-cat-purple">
              <HugeiconsIcon icon={Robot01Icon} size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">AI Providers</div>
              <div className="mt-px text-[11.5px] text-mute">OpenAI, Anthropic, Gemini, OpenRouter, Groq</div>
            </div>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-mute" />
          </Link>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="border-b border-hairline">
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'App',     value: 'open-tickets',                       mono: false },
              { label: 'License', value: 'MIT',                                mono: false },
              { label: 'Source',  value: 'github.com/Manuekle/next-tickets',   mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between text-[13px]">
                <span className="text-mute">{label}</span>
                <span className={cn('font-medium text-ink', mono && 'font-mono text-[11.5px]')}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader className="gap-0.5 border-b border-hairline">
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <HugeiconsIcon icon={Logout01Icon} size={14} />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
