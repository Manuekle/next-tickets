"use client";

import { useEffect } from 'react';

export default function HeadingLinks({ containerId = 'doc-article' }: { containerId?: string }) {
  useEffect(() => {
    const container = document.getElementById(containerId) || document.body;
    const headings = container.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');

    headings.forEach((h) => {
      if (h.querySelector('.heading-copy-btn')) return; // already added

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'heading-copy-btn';
      btn.setAttribute('aria-label', 'Copy link to heading');
      btn.style.border = '0';
      btn.style.background = 'transparent';
      btn.style.cursor = 'pointer';
      btn.style.marginLeft = '8px';
      btn.style.opacity = '0.65';
      btn.style.fontSize = '12px';
      btn.style.padding = '2px 6px';
      btn.style.borderRadius = '6px';
      btn.style.transition = 'all 160ms';

      // Use SVG icon for copy
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15 7h3a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1v-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="3" width="11" height="13" rx="2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

      btn.onmouseenter = () => { btn.style.color = 'var(--accent)'; btn.style.transform = 'translateY(-2px)'; };
      btn.onmouseleave = () => { btn.style.color = 'var(--mute)'; btn.style.transform = 'none'; };

      btn.onclick = async (e) => {
        e.preventDefault();
        const id = h.id;
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        try {
          await navigator.clipboard.writeText(url);
          const prevHTML = btn.innerHTML;
          btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2 8.5l3 3L13.5 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          // dispatch a toast event
          const ev = new CustomEvent('copy-toast', { detail: { copyToast: 'Link copied to clipboard' } });
          window.dispatchEvent(ev as any);
          setTimeout(() => { btn.innerHTML = prevHTML; }, 1400);
        } catch (err) {
          console.error('copy failed', err);
        }
      };

      // append the button to the heading
      h.appendChild(btn);
    });

    return () => {
      // cleanup buttons
      const bs = container.querySelectorAll('.heading-copy-btn');
      bs.forEach((b) => b.remove());
    };
  }, [containerId]);

  return null;
}
