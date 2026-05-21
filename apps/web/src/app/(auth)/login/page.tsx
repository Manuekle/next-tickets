'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await apiClient<{ data: { accessToken: string; refreshToken: string; user: any } }>('/auth/login', {
        method: 'POST',
        body:   JSON.stringify(data),
      });
      authLogin(res.data.accessToken, res.data.refreshToken, res.data.user);
      sileo.success({ title: 'Welcome back!' });
      router.push('/');
    } catch {
      sileo.error({ title: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <div className="px-7 pt-7">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="text-[13px] text-mute">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-7 py-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@company.com"
          />
          {errors.email && <p className="text-[11px] text-danger">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-ink-soft hover:text-ink">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            {...register('password')}
            placeholder="••••••••"
          />
          {errors.password && <p className="text-[11px] text-danger">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="px-7 pb-6 text-center text-[13px] text-mute">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-ink hover:underline">
          Sign up
        </Link>
      </div>
    </Card>
  );
}
