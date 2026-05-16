'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardContent, TextField, Label, FieldError } from '@heroui/react';
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
      <CardHeader className="flex flex-col items-start gap-1">
        <p className="font-heading font-medium text-xl">Create account</p>
        <p className="text-sm text-muted-slate">Enter your details to get started</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField isInvalid={!!errors.name}>
            <Label>Name</Label>
            <Input {...register('name')} />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </TextField>
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
          <TextField isInvalid={!!errors.confirmPassword}>
            <Label>Confirm password</Label>
            <Input type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
          </TextField>
          <Button type="submit" className="w-full" isDisabled={loading}>
            Create account
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-slate">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground hover:text-brand font-medium transition-colors">Sign in</Link>
        </div>
      </CardContent>
    </Card>
  );
}
