import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { marked } from 'marked';

export const metadata: Metadata = {
  title: 'Docs — Next Tickets',
};

export default function DocsPage() {
  // Read README.md from repo root and render as HTML.
  const p = path.resolve(process.cwd(), 'README.md');
  let md = '# Documentation not found';
  try {
    md = fs.readFileSync(p, 'utf-8');
  } catch (e) {
    // fallthrough
  }
  const html = marked.parse(md);

  return (
    <div style={{ padding: 28, maxWidth: 980, margin: '0 auto' }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
