'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardContent, Chip, Button } from '@heroui/react';
import { useTheme } from 'next-themes';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@heroui/react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#172B4D]">Settings</h1>
        <p className="text-sm text-[#6B778C]">Manage your account preferences</p>
      </div>

      <Card className="rounded-sm border border-[#DFE1E6] bg-white">
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="font-semibold text-[#172B4D]">Profile</p>
          <p className="text-sm text-[#6B778C]">Your account information</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <Avatar.Fallback className="bg-[#0052CC] text-white text-sm font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </Avatar.Fallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-[#172B4D]">{user?.name || '—'}</p>
              <p className="text-xs text-[#6B778C]">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[#DFE1E6]">
            <span className="text-sm text-[#6B778C]">Role</span>
            <Chip variant="soft" size="sm" className="text-xs">{user?.role || '—'}</Chip>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-sm border border-[#DFE1E6] bg-white">
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="font-semibold text-[#172B4D]">Appearance</p>
          <p className="text-sm text-[#6B778C]">Toggle between light and dark mode</p>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full">
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-sm border border-[#DFE1E6] bg-white">
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="font-semibold text-[#172B4D]">Session</p>
          <p className="text-sm text-[#6B778C]">Sign out of your account</p>
        </CardHeader>
        <CardContent>
          <Button variant="primary" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
