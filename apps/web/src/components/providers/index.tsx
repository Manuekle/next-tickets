'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { SocketProvider } from './socket-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster richColors position="top-right" />
            {children}
          </SocketProvider>
        </AuthProvider>
      </QueryProvider>
    </NextThemesProvider>
  );
}
