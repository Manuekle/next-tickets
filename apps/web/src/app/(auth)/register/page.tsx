'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" aria-describedby="name-error" {...register('name')} />
            {errors.name && <p id="name-error" className="text-sm text-destructive" aria-live="polite">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" aria-describedby="email-error" {...register('email')} />
            {errors.email && <p id="email-error" className="text-sm text-destructive" aria-live="polite">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" aria-describedby="password-error" {...register('password')} />
            {errors.password && <p id="password-error" className="text-sm text-destructive" aria-live="polite">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" aria-describedby="confirm-password-error" {...register('confirmPassword')} />
            {errors.confirmPassword && <p id="confirm-password-error" className="text-sm text-destructive" aria-live="polite">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </CardContent>
    </Card>
  );
}
