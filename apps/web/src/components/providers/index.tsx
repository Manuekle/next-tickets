import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { SocketProvider } from './socket-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster richColors position="top-right" />
            {children}
          </SocketProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
