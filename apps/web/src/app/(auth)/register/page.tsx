'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

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

const focusStyle = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)';
const blurStyle  = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)';

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
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
    <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '18px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '28px 28px 0' }}>
        <h1 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
          Create account
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0 }}>
          Join open-tickets for free
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {fields.map((f) => (
          <div key={f.name}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>
              {f.label}
            </label>
            <input
              type={f.type}
              {...register(f.name)}
              placeholder={f.placeholder}
              style={inputStyle}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = focusStyle; }}
              onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.boxShadow = blurStyle; }}
            />
            {errors[f.name] && <p style={{ fontSize: '11px', color: 'oklch(0.50 0.20 22)', marginTop: '4px' }}>{errors[f.name]?.message}</p>}
          </div>
        ))}

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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div style={{ padding: '0 28px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--mute)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
