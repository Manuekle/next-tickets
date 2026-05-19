'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';

const ticketSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  categoryId:  z.string().optional(),
});

type TicketForm = z.infer<typeof ticketSchema>;

const PRIORITIES = [
  { value: 'LOW',      label: 'Low',      hue: 148 },
  { value: 'MEDIUM',   label: 'Medium',   hue: 50  },
  { value: 'HIGH',     label: 'High',     hue: 28  },
  { value: 'CRITICAL', label: 'Critical', hue: 22  },
] as const;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>
      {children}{required && <span style={{ color: 'oklch(0.50 0.20 22)', marginLeft: '2px' }}>*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div style={{ fontSize: '11px', color: 'oklch(0.50 0.20 22)', marginTop: '4px' }}>{message}</div>;
}

export default function NewTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketForm>({
    resolver:     zodResolver(ticketSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const priority   = watch('priority');
  const categoryId = watch('categoryId');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => apiClient<{ data: { id: string; name: string }[] }>('/categories'),
  });

  const mutation = useMutation({
    mutationFn: (data: TicketForm) =>
      apiClient('/tickets', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created');
      router.push(`/tickets/${res.data.id}`);
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const onSubmit = (data: TicketForm) => mutation.mutate(data);

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '9px 12px',
    fontSize:     '13px',
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

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => router.push('/tickets')}
          style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mute)', fontSize: '12px', padding: 0, transition: 'color 100ms' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--mute)'; }}
        >
          Tickets
        </button>
        <ChevronRight size={11} />
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>New ticket</span>
      </div>

      {/* Page head */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize:      '36px',
          fontFamily:    'var(--font-display)',
          fontWeight:    400,
          color:         'var(--ink)',
          letterSpacing: '-0.02em',
          lineHeight:    1.05,
          margin:        '0 0 6px',
        }}>
          Create Ticket
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0 }}>Submit a new support request</p>
      </div>

      {/* Form card */}
      <div style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title */}
            <div>
              <FieldLabel required>Title</FieldLabel>
              <input
                {...register('title')}
                placeholder="Enter ticket title"
                style={inputStyle}
                onFocus={(e)  => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
                onBlur={(e)   => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
              />
              <FieldError message={errors.title?.message} />
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Describe the issue…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={(e)  => { (e.currentTarget as HTMLTextAreaElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
                onBlur={(e)   => { (e.currentTarget as HTMLTextAreaElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
              />
            </div>

            {/* Priority + Category row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Priority */}
              <div>
                <FieldLabel>Priority</FieldLabel>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRIORITIES.map((p) => {
                    const active = priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setValue('priority', p.value)}
                        style={{
                          padding:      '5px 11px',
                          fontSize:     '12px',
                          fontWeight:   active ? 600 : 500,
                          border:       0,
                          borderRadius: '8px',
                          cursor:       'pointer',
                          transition:   'all 80ms',
                          background:   active ? `oklch(0.94 0.06 ${p.hue})` : 'var(--surface-2)',
                          color:        active ? `oklch(0.38 0.16 ${p.hue})` : 'var(--ink-soft)',
                          boxShadow:    active ? `inset 0 0 0 1px oklch(0.84 0.08 ${p.hue})` : 'none',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <FieldLabel>Category</FieldLabel>
                <select
                  value={categoryId ?? ''}
                  onChange={(e) => setValue('categoryId', e.target.value || undefined)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={(e)  => { (e.currentTarget as HTMLSelectElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
                  onBlur={(e)   => { (e.currentTarget as HTMLSelectElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
                >
                  <option value="">Select category</option>
                  {(categories?.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div style={{
            display:        'flex',
            justifyContent: 'flex-end',
            gap:            '10px',
            padding:        '16px 24px',
            borderTop:      '1px solid var(--hairline)',
            background:     'var(--surface-2)',
          }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding:      '8px 16px',
                fontSize:     '13px',
                fontWeight:   500,
                border:       0,
                borderRadius: '10px',
                background:   'var(--surface)',
                color:        'var(--ink-soft)',
                cursor:       'pointer',
                boxShadow:    'var(--shadow-sm)',
                transition:   'all 100ms',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding:      '8px 20px',
                fontSize:     '13px',
                fontWeight:   600,
                border:       0,
                borderRadius: '10px',
                background:   'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color:        '#fff',
                cursor:       mutation.isPending ? 'not-allowed' : 'pointer',
                opacity:      mutation.isPending ? 0.7 : 1,
                boxShadow:    '0 4px 12px -4px var(--accent-glow)',
                transition:   'all 120ms',
              }}
            >
              {mutation.isPending ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
