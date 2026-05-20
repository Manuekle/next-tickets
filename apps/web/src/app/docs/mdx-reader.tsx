"use client";

import { useEffect, useState } from 'react';

export default function MdxReader({ path }: { path: string }) {
  const [content, setContent] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch(path).then(async (r) => {
      if (!mounted) return;
      if (!r.ok) {
        setContent('# Error\nCould not load documentation.');
        return;
      }
      const t = await r.text();
      setContent(t);
    }).catch(() => {
      if (mounted) setContent('# Error\nCould not load documentation.');
    });
    return () => { mounted = false; };
  }, [path]);

  if (content === null) return <div style={{ padding: 24 }}>Loading…</div>;
  // We'll let the parent render the markdown server-side using marked in server page.
  return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: 24 }}>{content}</pre>;
}
