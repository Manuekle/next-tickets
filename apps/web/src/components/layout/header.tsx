'use client';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex h-14 items-center justify-end gap-4 border-b border-[#DFE1E6] bg-[#ffffff] px-6">
      <Dropdown>
        <DropdownTrigger>
          <Avatar size="sm" className="cursor-pointer">
            <Avatar.Fallback className="bg-[#0052CC] text-xs text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar.Fallback>
          </Avatar>
        </DropdownTrigger>
        <DropdownMenu aria-label="User menu" onAction={(key) => {
          if (key === 'logout') handleLogout();
        }}>
          <DropdownItem key="info" textValue={user?.name || ''} className="h-14 gap-1">
            <p className="font-medium text-[#172B4D]">{user?.name}</p>
            <p className="text-xs text-[#6B778C]">{user?.email}</p>
          </DropdownItem>
          <DropdownItem key="logout" textValue="Sign out" className="text-[#DE350B]">
            <LogOut className="mr-2 inline h-4 w-4" /> Sign out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </header>
  );
}
