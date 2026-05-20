import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import getHeadingsFromMarkdown, { slugify } from '@/lib/get-headings';
import OnThisPage from '@/components/docs/on-this-page';
import CopyToast from '@/components/docs/copy-toast';

// Render the README as the /docs index page. This is separate from docs/*.mdx
export default function DocsPage() {
  const p = path.resolve(process.cwd(), 'README.md');
  let md = '# Documentation not found';
  try { md = fs.readFileSync(p, 'utf-8'); } catch (e) {}

  // generate HTML with heading ids that match our slugify
  const renderer = new marked.Renderer();
  renderer.heading = (text: string, level: number) => {
    const id = slugify(text.replace(/<[^>]+>/g, ''));
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  const html = marked.parse(md, { renderer });
  const headings = getHeadingsFromMarkdown(md);

  return (
    <div style={{ display: 'flex', gap: 18 }}>
      <article id="doc-article" style={{ flex: 1 }}>
        <div style={{ padding: 28 }} dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <aside style={{ width: 220, borderLeft: '1px solid var(--hairline)', paddingLeft: 12 }}>
        <div style={{ position: 'sticky', top: 84 }}>
          <strong>On this page</strong>
          <div style={{ marginTop: 8 }}>
            <OnThisPage containerId="doc-article" />
          </div>
        </div>
      </aside>
      <CopyToast />
    </div>
  );
}
