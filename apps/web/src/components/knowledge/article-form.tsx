'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  published: z.boolean().default(false),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface ArticleFormProps {
  initialData?: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    excerpt: string | null;
    categoryId: string | null;
    tags: { name: string }[];
    published: boolean;
  };
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '13px', color: 'var(--ink)',
  border: 0, borderRadius: '8px', background: 'var(--surface)',
  boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'box-shadow 100ms',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '5px', display: 'block',
};

export function ArticleForm({ initialData }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      slug: initialData?.slug ?? '',
      content: initialData?.content ?? '',
      excerpt: initialData?.excerpt ?? '',
      categoryId: initialData?.categoryId ?? undefined,
      tags: initialData?.tags?.map((t) => t.name).join(', ') ?? '',
      published: initialData?.published ?? false,
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: () =>
      apiClient<{ data: { id: string; name: string; slug: string; _count: { articles: number } }[] }>(
        '/knowledge/categories',
      ),
  });

  const mutation = useMutation({
    mutationFn: (data: ArticleFormData) => {
      const body = {
        ...data,
        tags: data.tags
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
      };
      if (isEdit) {
        return apiClient(`/knowledge/${initialData!.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      return apiClient('/knowledge', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: (res: any) => {
      toast.success(isEdit ? 'Article updated' : 'Article created');
      router.push(`/knowledge/${res.data.slug}`);
    },
    onError: () => toast.error(isEdit ? 'Failed to update article' : 'Failed to create article'),
  });

  const onSubmit = (data: ArticleFormData) => mutation.mutate(data);
  const published = watch('published');

  const btnPrimary: React.CSSProperties = {
    padding: '9px 18px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff',
    cursor: 'pointer', boxShadow: '0 4px 12px -4px var(--accent-glow)', transition: 'opacity 100ms',
  };
  const btnSecondary: React.CSSProperties = {
    padding: '9px 16px', fontSize: '13px', fontWeight: 500, border: 0, borderRadius: '10px',
    background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input
            {...register('title', {
              onChange: (e) => {
                if (!isEdit) {
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                  setValue('slug', slug);
                }
              },
            })}
            style={{ ...inputStyle, ...(errors.title ? { boxShadow: 'var(--shadow-sm), inset 0 0 0 1.5px oklch(0.58 0.20 22)' } : {}) }}
          />
          {errors.title && <p style={{ fontSize: '11px', color: 'oklch(0.58 0.20 22)', marginTop: '4px' }}>{errors.title.message}</p>}
        </div>

        <div>
          <label style={labelStyle}>Slug</label>
          <input
            {...register('slug')}
            style={{ ...inputStyle, ...(errors.slug ? { boxShadow: 'var(--shadow-sm), inset 0 0 0 1.5px oklch(0.58 0.20 22)' } : {}) }}
          />
          {errors.slug && <p style={{ fontSize: '11px', color: 'oklch(0.58 0.20 22)', marginTop: '4px' }}>{errors.slug.message}</p>}
        </div>

        <div>
          <label style={labelStyle}>Content</label>
          <textarea {...register('content')} rows={12} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
        </div>

        <div>
          <label style={labelStyle}>Excerpt</label>
          <textarea {...register('excerpt')} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ position: 'relative' }}>
              <select
                value={watch('categoryId') || ''}
                onChange={(e) => setValue('categoryId', e.target.value || undefined)}
                style={{ ...inputStyle, paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">No category</option>
                {categories?.data.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c._count.articles})</option>
                ))}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)', pointerEvents: 'none' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input {...register('tags')} placeholder="bug, ui, feature" style={inputStyle} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div
            onClick={() => setValue('published', !published)}
            style={{
              width: '36px', height: '20px', borderRadius: '999px', position: 'relative', cursor: 'pointer',
              background: published ? 'var(--accent)' : 'var(--surface-3)', transition: 'background 150ms',
            }}
          >
            <div style={{
              position: 'absolute', top: '2px', left: published ? '18px' : '2px', width: '16px', height: '16px',
              borderRadius: '999px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 150ms',
            }} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Published</span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
          <button type="button" style={btnSecondary} onClick={() => router.back()}>Cancel</button>
          <button type="submit" disabled={mutation.isPending} style={{ ...btnPrimary, opacity: mutation.isPending ? 0.6 : 1 }}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Update Article' : 'Create Article'}
          </button>
        </div>
      </form>
    </div>
  );
}
