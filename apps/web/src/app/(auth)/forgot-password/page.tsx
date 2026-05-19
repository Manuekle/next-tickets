'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

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
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '18px', boxShadow: 'var(--shadow-lg)', padding: '40px 28px', textAlign: 'center' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '999px', background: 'oklch(0.94 0.06 148)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'oklch(0.52 0.18 148)' }}>
          <CheckCircle size={24} />
        </div>
        <h1 style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Check your email
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', margin: '0 0 24px', lineHeight: 1.6 }}>
          If an account with that email exists, we&apos;ve sent password reset instructions.
        </p>
        <Link href="/login" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '18px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '28px 28px 0' }}>
        <h1 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
          Forgot password?
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0 }}>
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>
            Email
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="you@company.com"
            style={{
              width: '100%', padding: '10px 12px', fontSize: '14px', color: 'var(--ink)',
              border: 0, borderRadius: '10px', background: 'var(--surface)',
              boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)', outline: 'none',
              boxSizing: 'border-box', transition: 'box-shadow 100ms', fontFamily: 'inherit',
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
            onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
          />
          {errors.email && <p style={{ fontSize: '11px', color: 'oklch(0.50 0.20 22)', marginTop: '4px' }}>{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600,
            border: 0, borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px -4px var(--accent-glow)',
            transition: 'all 120ms', fontFamily: 'inherit',
          }}
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <div style={{ padding: '0 28px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--mute)' }}>
        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
