'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { useState } from 'react';

const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '10px 12px',
  fontSize:     '14px',
  color:        'var(--ink)',
  border:       0,
  borderRadius: '10px',
  background:   'var(--surface)',
  boxShadow:    'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
  outline:      'none',
  boxSizing:    'border-box',
  transition:   'box-shadow 100ms',
  fontFamily:   'inherit',
};

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
        body:   JSON.stringify(data),
      });
      authLogin(res.data.accessToken, res.data.refreshToken, res.data.user);
      sileo.success({ title: 'Welcome back!' });
      router.push('/');
    } catch {
      sileo.error({ title: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width:        '100%',
      background:   'var(--surface)',
      borderRadius: '18px',
      boxShadow:    'var(--shadow-lg)',
      overflow:     'hidden',
    }}>
      <div style={{ padding: '28px 28px 0' }}>
        <h1 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
          Sign in
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0 }}>
          Enter your credentials to continue
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
            style={inputStyle}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
            onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
          />
          {errors.email && <p style={{ fontSize: '11px', color: 'oklch(0.50 0.20 22)', marginTop: '4px' }}>{errors.email.message}</p>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </label>
            <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            {...register('password')}
            placeholder="••••••••"
            style={inputStyle}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
            onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
          />
          {errors.password && <p style={{ fontSize: '11px', color: 'oklch(0.50 0.20 22)', marginTop: '4px' }}>{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop:    '4px',
            width:        '100%',
            padding:      '11px',
            fontSize:     '14px',
            fontWeight:   600,
            border:       0,
            borderRadius: '10px',
            background:   'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color:        '#fff',
            cursor:       loading ? 'not-allowed' : 'pointer',
            opacity:      loading ? 0.7 : 1,
            boxShadow:    '0 4px 14px -4px var(--accent-glow)',
            transition:   'all 120ms',
            fontFamily:   'inherit',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div style={{ padding: '0 28px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--mute)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          Sign up
        </Link>
      </div>
    </div>
  );
}
