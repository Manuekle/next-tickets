'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { useState, Suspense } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { LockPasswordIcon } from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) { sileo.error({ title: 'Invalid or missing reset token' }); return; }
    setLoading(true);
    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: data.password }),
      });
      sileo.success({ title: 'Password reset successfully! Please sign in.' });
      router.push('/login');
    } catch (err: any) {
      sileo.error({ title: err.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full px-7 py-10 text-center shadow-md">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-ink">Invalid link</h1>
        <p className="mb-7 text-[13px] text-mute">This password reset link is invalid or has expired.</p>
        <Link
          href="/forgot-password"
          className="block text-center text-[13px] font-medium text-ink hover:underline"
        >
          Request a new reset link
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full px-7 py-8 shadow-md">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-fg">
          <HugeiconsIcon icon={LockPasswordIcon} size={20} />
        </div>
        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-ink">Reset password</h1>
        <p className="text-[13px] text-mute">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            className={cn(errors.password && 'border-danger')}
          />
          {errors.password && <p className="text-[11px] text-danger">{errors.password.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={cn(errors.confirmPassword && 'border-danger')}
          />
          {errors.confirmPassword && <p className="text-[11px] text-danger">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-mute">
        Remember your password?{' '}
        <Link href="/login" className="font-medium text-ink hover:underline">Sign in</Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
