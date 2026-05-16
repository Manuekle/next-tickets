'use client';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardContent, Chip, Button } from '@heroui/react';
import { useTheme } from 'next-themes';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="font-medium">Profile</p>
          <p className="text-sm text-muted-foreground">Your account information</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <Chip variant="soft" size="sm">{user?.role || '—'}</Chip>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="font-medium">Appearance</p>
          <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full"
          >
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="font-medium">Session</p>
          <p className="text-sm text-muted-foreground">Sign out of your account</p>
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
