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
        body: JSON.stringify(data),
      });
      authLogin(res.data.accessToken, res.data.refreshToken, res.data.user);
      toast.success('Welcome back!');
      router.push('/');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <p className="text-xl font-semibold">Sign in</p>
        <p className="text-sm text-default-500">Enter your credentials to access your account</p>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField isInvalid={!!errors.email} isRequired>
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </TextField>
          <TextField isInvalid={!!errors.password} isRequired>
            <Label>Password</Label>
            <Input type="password" {...register('password')} />
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </TextField>
          <Button type="submit" variant="primary" size="lg" isDisabled={loading} className="mt-2 w-full font-medium">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-default-500">
          <span>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-foreground hover:text-accent transition-colors">
              Sign up
            </Link>
          </span>
          <Link href="/forgot-password" className="font-medium text-foreground hover:text-accent transition-colors">
            Forgot password?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
