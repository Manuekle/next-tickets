'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button, Input, TextArea, Switch, Card, CardContent, TextField, Label, FieldError, Select, SelectTrigger, SelectValue, SelectPopover, ListBox, ListBoxItem } from '@heroui/react';
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
          <TextField isInvalid={!!errors.title}>
            <Label>Title</Label>
            <Input
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
            {errors.title && <FieldError>{errors.title.message}</FieldError>}
          </TextField>

          <TextField isInvalid={!!errors.slug}>
            <Label>Slug</Label>
            <Input {...register('slug')} />
            {errors.slug && <FieldError>{errors.slug.message}</FieldError>}
          </TextField>

          <TextField>
            <Label>Content</Label>
            <TextArea {...register('content')} rows={12} />
          </TextField>

          <TextField>
            <Label>Excerpt</Label>
            <TextArea {...register('excerpt')} rows={2} />
          </TextField>

          <div className="grid grid-cols-2 gap-4">
            <Select
              selectedKey={watch('categoryId') || null}
              onSelectionChange={(keys) => setValue('categoryId', keys ? String(keys) : undefined)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectPopover>
                <ListBox>
                  {categories?.data.map((c) => (
                    <ListBoxItem key={c.id} id={c.id}>{c.name} ({c._count.articles})</ListBoxItem>
                  ))}
                </ListBox>
              </SelectPopover>
            </Select>

            <TextField>
              <Label>Tags (comma separated)</Label>
              <Input {...register('tags')} placeholder="bug, ui, feature" />
            </TextField>
          </div>

          <Switch
            isSelected={watch('published')}
            onChange={(v) => setValue('published', v)}
          >
            Published
          </Switch>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isDisabled={mutation.isPending}>
              {isEdit ? 'Update Article' : 'Create Article'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
