'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState, Suspense } from 'react';

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
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    setLoading(true);
    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: data.password }),
      });
      toast.success('Password reset successfully! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/forgot-password" className="text-sm text-primary hover:underline">
            Request a new reset link
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" aria-describedby="password-error" {...register('password')} />
            {errors.password && <p id="password-error" className="text-sm text-destructive" aria-live="polite">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" aria-describedby="confirm-password-error" {...register('confirmPassword')} />
            {errors.confirmPassword && <p id="confirm-password-error" className="text-sm text-destructive" aria-live="polite">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Reset password
          </Button>
        </form>
      </CardContent>
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
