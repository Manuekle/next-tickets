"use client";

import { useEffect, useState } from 'react';

export default function SidebarToggle() {
  const [closed, setClosed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('docs.sidebar.closed') : null;
    if (stored !== null) {
      setClosed(stored === 'true');
      applyState(stored === 'true');
      return;
    }
    // default based on screen
    const mq = window.matchMedia('(max-width: 900px)');
    setClosed(mq.matches);
    applyState(mq.matches);
  }, []);

  function applyState(shouldClose: boolean) {
    const aside = document.getElementById('__docs-aside');
    const sidebar = document.getElementById('__docs-sidebar');
    if (!aside || !sidebar) return;
    if (shouldClose) {
      aside.style.width = '72px';
      sidebar.style.opacity = '0';
      sidebar.style.pointerEvents = 'none';
      aside.classList.add('closed');
    } else {
      aside.style.width = '260px';
      sidebar.style.opacity = '1';
      sidebar.style.pointerEvents = 'auto';
      aside.classList.remove('closed');
    }
  }

  function toggle() {
    const next = !Boolean(closed);
    setClosed(next);
    applyState(next);
    try { window.localStorage.setItem('docs.sidebar.closed', String(next)); } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle docs sidebar"
      style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--mute)' }}
    >
      ☰
    </button>
  );
}
