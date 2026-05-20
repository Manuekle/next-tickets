import React from 'react';
import Link from 'next/link';
import GitHubStars from '@/components/github-stars';
import getDocs from '@/lib/docs';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docs = getDocs();

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <aside id="__docs-aside" style={{ width: 260, borderRight: '1px solid var(--hairline)', paddingRight: 16, transition: 'width 220ms ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ marginTop: 0 }}>Docs</h3>
          <button
            onClick={() => {
              const aside = document.getElementById('__docs-aside');
              const sidebar = document.getElementById('__docs-sidebar');
              if (!aside || !sidebar) return;
              const closed = aside.classList.toggle('closed');
              if (closed) {
                aside.style.width = '72px';
                sidebar.style.opacity = '0';
                sidebar.style.pointerEvents = 'none';
              } else {
                aside.style.width = '260px';
                sidebar.style.opacity = '1';
                sidebar.style.pointerEvents = 'auto';
              }
            }}
            aria-label="Toggle docs sidebar"
            style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--mute)' }}
          >
            ☰
          </button>
        </div>
        <nav id="__docs-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 8, transition: 'opacity 220ms ease' }}>
          {docs.map((d: any) => (
            <Link key={d.slug} href={`/docs/${d.slug}`} style={{ color: 'var(--ink)', textDecoration: 'none', padding: '6px 8px', borderRadius: 8 }}>{d.title}</Link>
          ))}
        </nav>
        <div style={{ marginTop: 18 }}>
          <GitHubStars />
        </div>
      </aside>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
