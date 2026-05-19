'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun01Icon, Moon01Icon, ComputerDesk01Icon, Logout01Icon, FloppyDiskIcon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  AGENT: 'Agent',
  CUSTOMER: 'Customer',
};

const ROLE_STYLE: Record<string, React.CSSProperties> = {
  SUPER_ADMIN: { background: 'oklch(0.95 0.04 22)',  color: 'oklch(0.50 0.20 22)'  },
  ADMIN:       { background: 'oklch(0.96 0.06 60)',  color: 'oklch(0.50 0.18 60)'  },
  AGENT:       { background: 'var(--accent-tint)',   color: 'var(--accent)'         },
  CUSTOMER:    { background: 'oklch(0.94 0.06 148)', color: 'oklch(0.42 0.16 148)' },
};

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.005em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

function ThemeBtn({ value, label, icon, current, onClick }: { value: string; label: string; icon: React.ReactNode; current: string | undefined; onClick: () => void }) {
  const active = current === value;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        padding: '12px 8px', fontSize: '12px', fontWeight: active ? 600 : 500,
        border: 0, borderRadius: '10px', cursor: 'pointer', transition: 'all 120ms',
        background: active ? 'var(--accent-tint)' : 'var(--surface-2)',
        color: active ? 'var(--accent)' : 'var(--ink-soft)',
        boxShadow: active ? 'inset 0 0 0 1.5px var(--accent-border)' : 'none',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const initials = (user?.name ?? 'U').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  const roleStyle = ROLE_STYLE[user?.role ?? ''] ?? { background: 'var(--surface-2)', color: 'var(--mute)' };

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
    <div style={{ maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '4px' }}>Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card title="Profile" subtitle="Your account information">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '999px', flexShrink: 0,
            background: 'linear-gradient(135deg, oklch(0.52 0.04 258), oklch(0.42 0.04 262))',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{user?.name || '—'}</div>
            <div style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '1px' }}>{user?.email || '—'}</div>
          </div>
          <span style={{ ...roleStyle, padding: '3px 9px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap' }}>
            {ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '—'}
          </span>
        </div>

        {/* Name field */}
        <div style={{ paddingTop: '14px', borderTop: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mute)' }}>Display name</span>
            {!editingName && (
              <button
                onClick={() => { setName(user?.name ?? ''); setEditingName(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 500, border: 0, borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer' }}
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={10} /> Edit
              </button>
            )}
          </div>
          {editingName ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                style={{
                  flex: 1, padding: '8px 10px', fontSize: '13px', border: 0, borderRadius: '8px',
                  background: 'var(--surface-2)', color: 'var(--ink)',
                  boxShadow: 'inset 0 0 0 1.5px var(--accent)', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={saveName}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', fontSize: '12px', fontWeight: 600, border: 0, borderRadius: '8px', background: 'var(--accent)', color: '#fff', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                <HugeiconsIcon icon={FloppyDiskIcon} size={12} />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditingName(false)}
                style={{ padding: '8px 10px', fontSize: '12px', border: 0, borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>{user?.name || '—'}</div>
          )}
        </div>

        {/* Email (read-only) */}
        <div style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mute)', marginBottom: '4px' }}>Email address</div>
          <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{user?.email || '—'}</div>
        </div>
      </Card>

      {/* Appearance */}
      <Card title="Appearance" subtitle="Choose your preferred color scheme">
        <div style={{ display: 'flex', gap: '8px' }}>
          <ThemeBtn value="light" label="Light" current={theme} onClick={() => setTheme('light')}
            icon={<HugeiconsIcon icon={Sun01Icon} size={16} />} />
          <ThemeBtn value="system" label="System" current={theme} onClick={() => setTheme('system')}
            icon={<HugeiconsIcon icon={ComputerDesk01Icon} size={16} />} />
          <ThemeBtn value="dark" label="Dark" current={theme} onClick={() => setTheme('dark')}
            icon={<HugeiconsIcon icon={Moon01Icon} size={16} />} />
        </div>
      </Card>

      {/* About */}
      <Card title="About">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'App',     value: 'open-tickets'                        },
            { label: 'License', value: 'MIT'                                 },
            { label: 'Source',  value: 'github.com/Manuekle/next-tickets'    },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--mute)' }}>{label}</span>
              <span style={{ color: 'var(--ink)', fontWeight: 500, fontFamily: label === 'Source' ? 'var(--font-mono, monospace)' : 'inherit', fontSize: label === 'Source' ? '11.5px' : '13px' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Session */}
      <Card title="Session" subtitle="Sign out of your account">
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600,
            border: 0, borderRadius: '10px', cursor: 'pointer', transition: 'all 120ms',
            background: 'oklch(0.96 0.04 22)', color: 'oklch(0.50 0.20 22)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.92 0.06 22)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.96 0.04 22)'; }}
        >
          <HugeiconsIcon icon={Logout01Icon} size={14} />
          Sign Out
        </button>
      </Card>
    </div>
  );
}
