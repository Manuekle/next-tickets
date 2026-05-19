'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun01Icon, Moon01Icon, Logout01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';

function SettingsCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.005em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      <div style={{ padding: '18px 22px' }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Head */}
      <div>
        <h1 style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>
          Manage your account preferences
        </p>
      </div>

      {/* Profile */}
      <SettingsCard title="Profile" subtitle="Your account information">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '999px', flexShrink: 0,
            background: 'linear-gradient(135deg, oklch(0.52 0.04 258), oklch(0.42 0.04 262))',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em',
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.005em' }}>{user?.name || '—'}</div>
            <div style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '2px' }}>{user?.email || '—'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--hairline)' }}>
          <span style={{ fontSize: '13px', color: 'var(--mute)' }}>Role</span>
          <span style={{ padding: '3px 9px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', background: 'var(--accent-tint)', color: 'var(--accent)' }}>
            {user?.role || '—'}
          </span>
        </div>
      </SettingsCard>

      {/* Appearance */}
      <SettingsCard title="Appearance" subtitle="Toggle between light and dark mode">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', fontSize: '13px', fontWeight: 500, border: 0, borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 120ms' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
        >
          {theme === 'dark' ? <HugeiconsIcon icon={Sun01Icon} size={15} /> : <HugeiconsIcon icon={Moon01Icon} size={15} />}
          {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </SettingsCard>

      {/* About */}
      <SettingsCard title="About">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'App',     value: 'open-tickets'     },
            { label: 'License', value: 'MIT'              },
            { label: 'Source',  value: 'github.com/Manuekle/next-tickets' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--mute)' }}>{label}</span>
              <span style={{ color: 'var(--ink)', fontWeight: 500, fontFamily: label === 'Source' ? 'var(--font-mono)' : 'inherit', fontSize: label === 'Source' ? '11.5px' : '13px' }}>{value}</span>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Session */}
      <SettingsCard title="Session" subtitle="Sign out of your account">
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '10px', background: 'oklch(0.96 0.04 22)', color: 'oklch(0.50 0.20 22)', cursor: 'pointer', transition: 'all 120ms' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.92 0.06 22)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.96 0.04 22)'; }}
        >
          <HugeiconsIcon icon={Logout01Icon} size={14} />
          Sign Out
        </button>
      </SettingsCard>
    </div>
  );
}
