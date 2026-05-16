'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardContent, TextField, Label, FieldError } from '@heroui/react';
import { toast } from 'sonner';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await apiClient<{ data: { accessToken: string; refreshToken: string; user: any } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      toast.success('Welcome back!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-border-light">
      <CardHeader className="flex flex-col items-start gap-1">
        <p className="font-heading font-medium text-xl">Sign in</p>
        <p className="text-sm text-muted-slate">Enter your credentials to access your account</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField isInvalid={!!errors.email}>
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </TextField>
          <TextField isInvalid={!!errors.password}>
            <Label>Password</Label>
            <Input type="password" {...register('password')} />
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </TextField>
          <Button type="submit" className="w-full rounded-lg bg-brand text-deep-forest hover:brightness-95 font-medium" isDisabled={loading}>
            Sign in
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-slate">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-foreground hover:text-brand font-medium transition-colors">Sign up</Link>
          <br />
          <Link href="/forgot-password" className="text-foreground hover:text-brand font-medium transition-colors">Forgot password?</Link>
        </div>
      </CardContent>
    </Card>
  );
}
