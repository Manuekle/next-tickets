'use client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header role="banner" className="flex h-14 items-center justify-end gap-4 border-b px-6">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="User menu" />}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm font-medium">{user?.name}</div>
          <div className="px-2 pb-2 text-xs text-muted-foreground">{user?.email}</div>
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
