"use client";

import { useEffect, useState } from 'react';

export default function CopyToast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    function handler(e: any) {
      if (e.detail && e.detail.copyToast) setMsg(e.detail.copyToast);
    }
    window.addEventListener('copy-toast', handler as EventListener);
    return () => window.removeEventListener('copy-toast', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 1800);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 26, background: 'var(--surface)', color: 'var(--ink)', padding: '10px 14px', borderRadius: 10, boxShadow: 'var(--shadow-pop)' }}>
      {msg}
    </div>
  );
}
