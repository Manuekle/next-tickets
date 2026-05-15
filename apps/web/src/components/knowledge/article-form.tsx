'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  published: z.boolean().default(false),
});

type ArticleForm = z.infer<typeof articleSchema>;

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
  } = useForm<ArticleForm>({
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
    mutationFn: (data: ArticleForm) => {
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

  const onSubmit = (data: ArticleForm) => mutation.mutate(data);

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', {
                onChange: (e) => {
                  if (!isEdit) {
                    const slug = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    setValue('slug', slug);
                  }
                },
              })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register('slug')} />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" {...register('content')} rows={12} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" {...register('excerpt')} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watch('categoryId') || undefined}
                onValueChange={(v) => setValue('categoryId', v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.data.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c._count.articles})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" {...register('tags')} placeholder="bug, ui, feature" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={watch('published')}
              onCheckedChange={(v) => setValue('published', v)}
            />
            <Label>Published</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEdit ? 'Update Article' : 'Create Article'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
