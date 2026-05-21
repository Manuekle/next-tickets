'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import {
  Card,
  CardContent,
  Input,
  Textarea,
  Label,
  Button,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';

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
      sileo.success({ title: isEdit ? 'Article updated' : 'Article created' });
      router.push(`/knowledge/${res.data.slug}`);
    },
    onError: () => sileo.error({ title: isEdit ? 'Failed to update article' : 'Failed to create article' }),
  });

  const onSubmit = (data: ArticleFormData) => mutation.mutate(data);
  const published = watch('published');
  const categoryId = watch('categoryId') || '';

  return (
    <Card className="shadow-md">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="article-title">Title</Label>
            <Input
              id="article-title"
              aria-invalid={!!errors.title}
              className={errors.title ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20' : undefined}
              {...register('title', {
                onChange: (e) => {
                  if (!isEdit) {
                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setValue('slug', slug);
                  }
                },
              })}
            />
            {errors.title && <p className="text-[11px] text-danger">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="article-slug">Slug</Label>
            <Input
              id="article-slug"
              aria-invalid={!!errors.slug}
              className={errors.slug ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20' : undefined}
              {...register('slug')}
            />
            {errors.slug && <p className="text-[11px] text-danger">{errors.slug.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="article-content">Content</Label>
            <Textarea id="article-content" rows={12} className="leading-relaxed" {...register('content')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="article-excerpt">Excerpt</Label>
            <Textarea id="article-excerpt" rows={2} {...register('excerpt')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setValue('categoryId', (v as string) || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories?.data.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c._count.articles})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="article-tags">Tags (comma separated)</Label>
              <Input id="article-tags" placeholder="bug, ui, feature" {...register('tags')} />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <Switch checked={published} onCheckedChange={(v: boolean) => setValue('published', v)} />
            <span className="text-[13px] text-ink-soft">Published</span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update Article' : 'Create Article'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
