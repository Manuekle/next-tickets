"use client";

import { useEffect, useState } from 'react';

type Heading = { id: string; text: string; level: number };

export default function OnThisPage({ containerId = 'doc-article' }: { containerId?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  // Detect small screens to start collapsed
  useEffect(() => {
    const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)') : null;
    if (mq) setIsOpen(!mq.matches);
    const listener = (ev: MediaQueryListEvent) => setIsOpen(!ev.matches);
    if (mq && 'addEventListener' in mq) mq.addEventListener('change', listener);
    else if (mq && 'addListener' in mq) (mq as any).addListener(listener);
    return () => {
      if (mq && 'removeEventListener' in mq) mq.removeEventListener('change', listener);
      else if (mq && 'removeListener' in mq) (mq as any).removeListener(listener);
    };
  }, []);

  useEffect(() => {
    const container = document.getElementById(containerId) || document.body;
    // ensure heading copy buttons exist
    import('@/components/docs/heading-links').then((m) => m.default({ containerId }));
    const nodeList = container.querySelectorAll('h1, h2, h3, h4');
    const hs: Heading[] = Array.from(nodeList).map((el) => ({ id: el.id, text: el.textContent || '', level: parseInt(el.tagName.replace('H', ''), 10) }));
    setHeadings(hs);

    if (hs.length === 0) return;

    let observer: IntersectionObserver | null = null;
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        setActive(visible[0].target.id);
        return;
      }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <strong>On this page</strong>
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Hide table of contents' : 'Show table of contents'}
          onClick={() => setIsOpen((s) => !s)}
          style={{ border: 0, background: 'transparent', color: 'var(--mute)', cursor: 'pointer', fontSize: 14 }}
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>

      <nav style={{ marginTop: 8, display: isOpen ? 'flex' : 'none', flexDirection: 'column', gap: 6 }}>
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
