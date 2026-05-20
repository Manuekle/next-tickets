import fs from 'fs';
import path from 'path';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { MDXRemote } from 'next-mdx-remote/rsc';

export default function DocsPage() {
  const p = path.resolve(process.cwd(), 'README.md');
  let md = '# Documentation not found';
  try { md = fs.readFileSync(p, 'utf-8'); } catch (e) {}

  return (
    <div style={{ padding: 28, maxWidth: 980, margin: '0 auto' }}>
      <MDXRemote source={md} options={{ mdxOptions: { rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings] } }} />
    </div>
  );
}
