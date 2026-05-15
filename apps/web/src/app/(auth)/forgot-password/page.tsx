'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState } from 'react';

const forgotSchema = z.object({
  email: z.string().email('Invalid email'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account with that email exists, we&apos;ve sent password reset instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password?</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" aria-describedby="email-error" {...register('email')} />
            {errors.email && <p id="email-error" className="text-sm text-destructive" aria-live="polite">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
        </div>
      </CardContent>
    </Card>
  );
}
