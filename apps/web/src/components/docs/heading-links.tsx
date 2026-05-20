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

      btn.textContent = '🔗';

      btn.onmouseenter = () => { btn.style.opacity = '1'; btn.style.transform = 'translateY(-1px)'; };
      btn.onmouseleave = () => { btn.style.opacity = '0.65'; btn.style.transform = 'none'; };

      btn.onclick = async (e) => {
        e.preventDefault();
        const id = h.id;
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        try {
          await navigator.clipboard.writeText(url);
          const prev = btn.textContent;
          btn.textContent = '✓';
          // dispatch a toast event
          const ev = new CustomEvent('copy-toast', { detail: { copyToast: 'Link copied to clipboard' } });
          window.dispatchEvent(ev as any);
          setTimeout(() => { btn.textContent = prev; }, 1400);
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
