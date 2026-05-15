'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  categoryId: z.string().optional(),
});

type TicketForm = z.infer<typeof ticketSchema>;

export default function NewTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      apiClient<{ data: { id: string; name: string }[] }>('/categories'),
  });

  const mutation = useMutation({
    mutationFn: (data: TicketForm) =>
      apiClient('/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created');
      router.push(`/tickets/${res.data.id}`);
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const onSubmit = (data: TicketForm) => mutation.mutate(data);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Ticket</h1>
        <p className="text-sm text-muted-foreground">
          Create a new support ticket
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  defaultValue="MEDIUM"
                  onValueChange={(v) => v && setValue('priority', v as any)}
                >
                  <SelectTrigger aria-label="Priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(v) => setValue('categoryId', typeof v === 'string' ? v : undefined)}>
                  <SelectTrigger aria-label="Category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.data.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                Create Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
