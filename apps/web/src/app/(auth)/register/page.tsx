'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Invalid email'),
  password:        z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
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
        body:   JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      sileo.success({ title: 'Account created! Please sign in.' });
      router.push('/login');
    } catch (err: any) {
      sileo.error({ title: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const fields: { name: keyof RegisterForm; label: string; type: string; placeholder: string }[] = [
    { name: 'name',            label: 'Name',             type: 'text',     placeholder: 'Your name'        },
    { name: 'email',           label: 'Email',            type: 'email',    placeholder: 'you@company.com'  },
    { name: 'password',        label: 'Password',         type: 'password', placeholder: '••••••••'         },
    { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: '••••••••'         },
  ];

  return (
    <Card className="w-full shadow-md">
      <div className="px-7 pt-7">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Create account</h1>
        <p className="text-[13px] text-mute">Join open-tickets for free</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5 px-7 py-6">
        {fields.map((f) => (
          <div key={f.name} className="flex flex-col gap-1.5">
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input
              id={f.name}
              type={f.type}
              {...register(f.name)}
              placeholder={f.placeholder}
            />
            {errors[f.name] && <p className="text-[11px] text-danger">{errors[f.name]?.message}</p>}
          </div>
        ))}

        <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="px-7 pb-6 text-center text-[13px] text-mute">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Sign in
        </Link>
      </div>
    </Card>
  );
}
