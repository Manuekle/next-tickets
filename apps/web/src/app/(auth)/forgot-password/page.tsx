'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const forgotSchema = z.object({ email: z.string().email('Invalid email') });
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
      await apiClient('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) });
      setSent(true);
    } catch (err: any) {
      sileo.error({ title: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="w-full px-7 py-10 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-tint text-success">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} />
        </div>
        <h1 className="mb-2 text-xl font-semibold tracking-tight text-ink">Check your email</h1>
        <p className="mb-6 text-[13px] leading-relaxed text-mute">
          If an account with that email exists, we&apos;ve sent password reset instructions.
        </p>
        <Link href="/login" className="text-[13px] font-semibold text-ink hover:underline">
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <div className="px-7 pt-7">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Forgot password?</h1>
        <p className="text-[13px] text-mute">Enter your email and we&apos;ll send a reset link</p>
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

        <Button type="submit" disabled={loading} size="lg" className="w-full">
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <div className="px-7 pb-6 text-center text-[13px] text-mute">
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}
