import React from 'react';
import Link from 'next/link';
import GitHubStars from '@/components/github-stars';
import getDocs from '@/lib/docs';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docs = getDocs();

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <aside style={{ width: 260, borderRight: '1px solid var(--hairline)', paddingRight: 16 }}>
        <h3 style={{ marginTop: 0 }}>Docs</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((d: any) => (
            <Link key={d.slug} href={`/docs/${d.slug}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{d.title}</Link>
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
