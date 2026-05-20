import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

type Props = { params: { slug: string } };

export default function DocSlugPage({ params }: Props) {
  const slug = params.slug;
  const p = path.resolve(process.cwd(), `docs/${slug}.mdx`);
  let md = '# Not found';
  try { md = fs.readFileSync(p, 'utf-8'); } catch (e) {}

  return (
    <div style={{ padding: 24 }}>
      <MDXRemote source={md} options={{ mdxOptions: { rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings] } }} />
    </div>
  );
}
