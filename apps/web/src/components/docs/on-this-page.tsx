"use client";

import { useEffect, useState } from 'react';

type Heading = { id: string; text: string; level: number };

export default function OnThisPage({ containerId = 'doc-article' }: { containerId?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId) || document.body;
    const nodeList = container.querySelectorAll('h1, h2, h3, h4');
    const hs: Heading[] = Array.from(nodeList).map((el) => ({ id: el.id, text: el.textContent || '', level: parseInt(el.tagName.replace('H', ''), 10) }));
    setHeadings(hs);

    if (hs.length === 0) return;

    let observer: IntersectionObserver | null = null;
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      // find the heading with largest intersection ratio
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        setActive(visible[0].target.id);
        return;
      }
      // fallback: pick the top-most heading above the fold
      const above = entries.filter((e) => e.boundingClientRect.top < 0).sort((a, b) => b.boundingClientRect.top - a.boundingClientRect.top);
      if (above.length > 0) setActive(above[0].target.id);
    };

    observer = new IntersectionObserver(handleIntersect, { root: null, rootMargin: '0px 0px -60% 0px', threshold: [0, 0.1, 0.5, 1] });
    hs.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer!.observe(el);
    });

    return () => {
      if (observer) observer.disconnect();
      observer = null;
    };
  }, [containerId]);

  if (headings.length === 0) return null;

  return (
    <div>
      <strong>On this page</strong>
      <nav style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(h.id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setActive(h.id);
            }}
            style={{ marginLeft: (h.level - 1) * 8, fontSize: 13, color: active === h.id ? 'var(--accent)' : 'var(--mute)', textDecoration: 'none' }}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
