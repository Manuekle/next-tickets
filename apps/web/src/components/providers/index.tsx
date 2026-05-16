'use client';

import { RouterProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { SocketProvider } from './socket-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={router.push}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <Toaster richColors position="top-right" />
              {children}
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </NextThemesProvider>
    </RouterProvider>
  );
}
