'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useState, Suspense } from 'react';
import { Lock } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '13px', color: 'var(--ink)',
  border: 0, borderRadius: '9px', background: 'var(--surface-2)',
  boxShadow: 'inset 0 0 0 1px var(--hairline)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'box-shadow 100ms',
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) { toast.error('Invalid or missing reset token'); return; }
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
      <div>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>Invalid link</h1>
          <p style={{ fontSize: '13px', color: 'var(--mute)' }}>This password reset link is invalid or has expired.</p>
        </div>
        <Link
          href="/forgot-password"
          style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 6px 18px -6px var(--accent-glow)' }}>
          <Lock size={20} color="#fff" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>Reset password</h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)' }}>Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-soft)', display: 'block', marginBottom: '5px' }}>New password</label>
          <input
            type="password"
            {...register('password')}
            style={{ ...inputStyle, ...(errors.password ? { boxShadow: 'inset 0 0 0 1.5px oklch(0.58 0.20 22)' } : {}) }}
          />
          {errors.password && <p style={{ fontSize: '11px', color: 'oklch(0.58 0.20 22)', marginTop: '4px' }}>{errors.password.message}</p>}
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-soft)', display: 'block', marginBottom: '5px' }}>Confirm password</label>
          <input
            type="password"
            {...register('confirmPassword')}
            style={{ ...inputStyle, ...(errors.confirmPassword ? { boxShadow: 'inset 0 0 0 1.5px oklch(0.58 0.20 22)' } : {}) }}
          />
          {errors.confirmPassword && <p style={{ fontSize: '11px', color: 'oklch(0.58 0.20 22)', marginTop: '4px' }}>{errors.confirmPassword.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '11px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 14px -4px var(--accent-glow)', opacity: loading ? 0.7 : 1, transition: 'opacity 100ms',
            marginTop: '4px',
          }}
        >
          {loading ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--mute)', marginTop: '20px' }}>
        Remember your password?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
