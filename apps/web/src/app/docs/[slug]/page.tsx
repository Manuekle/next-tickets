import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import getHeadingsFromMarkdown from '@/lib/get-headings';

import Link from 'next/link';

type Props = { params: { slug: string } };

export default function DocSlugPage({ params }: Props) {
  const slug = params.slug;
  const p = path.resolve(process.cwd(), `docs/${slug}.mdx`);
  let md = '# Not found';
  try { md = fs.readFileSync(p, 'utf-8'); } catch (e) {}
  const headings = getHeadingsFromMarkdown(md);

  return (
    <div style={{ display: 'flex', gap: 18 }}>
      <article id="doc-article" style={{ flex: 1 }}>
        <MDXRemote source={md} options={{ mdxOptions: { rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings] } }} />
      </article>
      <aside style={{ width: 220, borderLeft: '1px solid var(--hairline)', paddingLeft: 12 }}>
        <div style={{ position: 'sticky', top: 84 }}>
          <strong>On this page</strong>
          <div style={{ marginTop: 8 }}>
            <OnThisPage containerId="doc-article" />
          </div>
        </div>
      </aside>
    </div>
  );
}
