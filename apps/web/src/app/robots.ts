import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/api/', '/settings', '/tickets', '/analytics', '/sla', '/automations', '/knowledge', '/admin'],
    },
    sitemap: 'https://open-tickets.dev/sitemap.xml',
  };
}
