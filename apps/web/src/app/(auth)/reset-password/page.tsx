'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardContent, TextField, Label, FieldError } from '@heroui/react';
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
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="font-heading font-medium text-xl">Invalid link</p>
          <p className="text-sm text-muted-slate">
            This password reset link is invalid or has expired.
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-1">
        <p className="font-heading font-medium text-xl">Reset password</p>
        <p className="text-sm text-muted-slate">Enter your new password</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField isInvalid={!!errors.password}>
            <Label>New password</Label>
            <Input type="password" {...register('password')} />
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </TextField>
          <TextField isInvalid={!!errors.confirmPassword}>
            <Label>Confirm password</Label>
            <Input type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
          </TextField>
          <Button type="submit" className="w-full" isDisabled={loading}>
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
