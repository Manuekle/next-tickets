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
    <Card className="w-full rounded-[3px] border border-[#DFE1E6] bg-[#ffffff]">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <p className="text-xl font-semibold text-[#172B4D]">Sign in</p>
        <p className="text-sm text-[#6B778C]">Enter your credentials to access your account</p>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField isInvalid={!!errors.email} isRequired>
            <Label className="text-sm font-medium text-[#172B4D]">Email</Label>
            <Input
              type="email"
              {...register('email')}
              className="rounded-[3px]"
            />
            {errors.email && <FieldError className="text-xs text-[#DE350B]">{errors.email.message}</FieldError>}
          </TextField>
          <TextField isInvalid={!!errors.password} isRequired>
            <Label className="text-sm font-medium text-[#172B4D]">Password</Label>
            <Input
              type="password"
              {...register('password')}
              className="rounded-[3px]"
            />
            {errors.password && <FieldError className="text-xs text-[#DE350B]">{errors.password.message}</FieldError>}
          </TextField>
          <Button type="submit" variant="primary" isDisabled={loading} className="mt-2 w-full rounded-[3px] bg-[#0052CC] font-medium text-white">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-[#6B778C]">
          <span>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-[#172B4D] transition-colors hover:text-[#0052CC]">
              Sign up
            </Link>
          </span>
          <Link href="/forgot-password" className="font-medium text-[#172B4D] transition-colors hover:text-[#0052CC]">
            Forgot password?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
