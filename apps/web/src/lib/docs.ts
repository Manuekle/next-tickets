import fs from 'fs';
import path from 'path';

export function getDocs() {
  const docsDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) return [];

  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));

  const items = files.map((file) => {
    const slug = file.replace(/\.mdx?$/, '');
    const p = path.join(docsDir, file);
    let content = '';
    try {
      content = fs.readFileSync(p, 'utf8');
    } catch (e) {
      return { slug, title: slug };
    }

    // Try frontmatter title
    const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
    let title = slug;
    if (fmMatch) {
      const fm = fmMatch[1];
      const titleMatch = fm.match(/^\s*title:\s*(?:['"])?(.+?)(?:['"])?\s*$/m);
      if (titleMatch) title = titleMatch[1].trim();
    }

    // Fallback to first H1
    if (!title || title === slug) {
      const h1 = content.match(/^#\s+(.+)$/m);
      if (h1) title = h1[1].trim();
    }

    return { slug, title };
  });

  // Ensure index goes first
  items.sort((a, b) => {
    if (a.slug === 'index') return -1;
    if (b.slug === 'index') return 1;
    return a.title.localeCompare(b.title);
  });

  return items;
}

export default getDocs;
