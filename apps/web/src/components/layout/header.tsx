'use client';
import { useAuthStore } from '@/stores/auth-store';
import { Button, Avatar, AvatarFallback, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { useTheme } from 'next-themes';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header role="banner" className="flex h-14 items-center justify-end gap-4 border-b border-border-light px-6 bg-card">
      <Dropdown>
        <DropdownTrigger>
          <Avatar className="h-8 w-8 ring-1 ring-border cursor-pointer" size="sm">
            <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem key="user-info" className="h-14 gap-2" textValue={user?.name}>
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-muted-slate">{user?.email}</p>
          </DropdownItem>
          {resolvedTheme && (
            <DropdownItem key="theme" onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 inline mr-2" /> : <Moon className="h-4 w-4 inline mr-2" />}
              {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </DropdownItem>
          )}
          <DropdownItem key="logout" onPress={handleLogout}>
            <LogOut className="h-4 w-4 inline mr-2" /> Sign out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </header>
  );
}
