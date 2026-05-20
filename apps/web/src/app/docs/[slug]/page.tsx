import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import getHeadingsFromMarkdown, { slugify } from '@/lib/get-headings';

import Link from 'next/link';
import OnThisPage from '@/components/docs/on-this-page';
import CopyToast from '@/components/docs/copy-toast';

type Props = { params: { slug: string } };

export default function DocSlugPage({ params }: Props) {
  const slug = params.slug;
  const p = path.resolve(process.cwd(), `docs/${slug}.mdx`);
  let md = '# Not found';
  try { md = fs.readFileSync(p, 'utf-8'); } catch (e) {}

  const renderer = new marked.Renderer();
  renderer.heading = (text: string, level: number) => {
    const id = slugify(text.replace(/<[^>]+>/g, ''));
    return `<h${level} id="${id}">${text}</h${level}>`;
  };
  const html = marked.parse(md, { renderer });
  const headings = getHeadingsFromMarkdown(md);

  return (
    <div style={{ display: 'flex', gap: 18 }}>
      <article id="doc-article" style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: html }} />
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
