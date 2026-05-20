export type Heading = { id: string; text: string; level: number };

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getHeadingsFromMarkdown(md: string): Heading[] {
  const lines = md.split(/\r?\n/);
  const headings: Heading[] = [];

  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      const level = m[1].length;
      const text = m[2].replace(/`/g, '').trim();
      const id = slugify(text);
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export default getHeadingsFromMarkdown;
