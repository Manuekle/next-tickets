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
  title: 'Helix — Ticket Management',
  description: 'Modern support ticket management',
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
