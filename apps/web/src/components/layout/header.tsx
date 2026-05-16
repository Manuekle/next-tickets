'use client';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
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
    <header className="flex h-14 items-center justify-end gap-4 border-b border-default-200 bg-surface px-6">
      <Dropdown>
        <DropdownTrigger>
          <Avatar size="sm" className="cursor-pointer ring-1 ring-default-300">
            <Avatar.Fallback className="text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Avatar.Fallback>
          </Avatar>
        </DropdownTrigger>
        <DropdownMenu aria-label="User menu" onAction={(key) => {
          if (key === 'theme') setTheme(theme === 'dark' ? 'light' : 'dark');
          if (key === 'logout') handleLogout();
        }}>
          <DropdownItem key="info" textValue={user?.name || ''} className="h-14 gap-1">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-default-500">{user?.email}</p>
          </DropdownItem>
          {resolvedTheme && (
            <DropdownItem key="theme" textValue={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 inline mr-2" /> : <Moon className="h-4 w-4 inline mr-2" />}
              {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </DropdownItem>
          )}
          <DropdownItem key="logout" textValue="Sign out" className="text-danger">
            <LogOut className="h-4 w-4 inline mr-2" /> Sign out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </header>
  );
}
