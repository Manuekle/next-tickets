import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'open-tickets — Open Source Support',
    template: '%s — open-tickets',
  },
  description: 'Open-source support ticket management. Self-host your own Zendesk alternative.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    siteName: 'open-tickets',
    title: 'open-tickets — Open Source Support',
    description: 'Open-source support ticket management. Self-host your own Zendesk alternative.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'open-tickets — Open Source Support',
    description: 'Open-source support ticket management. Self-host your own Zendesk alternative.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={font.variable}
      data-theme="light"
      data-accent="indigo"
    >
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
