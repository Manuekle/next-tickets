'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardContent, TextField, Label, FieldError } from '@heroui/react';
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
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="font-heading font-medium text-xl">Check your email</p>
          <p className="text-sm text-muted-slate">
            If an account with that email exists, we&apos;ve sent password reset instructions.
          </p>
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
      <CardHeader className="flex flex-col items-start gap-1">
        <p className="font-heading font-medium text-xl">Forgot password?</p>
        <p className="text-sm text-muted-slate">Enter your email and we&apos;ll send you a reset link</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField isInvalid={!!errors.email}>
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </TextField>
          <Button type="submit" className="w-full" isDisabled={loading}>
            Send reset link
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-slate">
          <Link href="/login" className="text-foreground hover:text-brand font-medium transition-colors">Back to sign in</Link>
        </div>
      </CardContent>
    </Card>
  );
}
