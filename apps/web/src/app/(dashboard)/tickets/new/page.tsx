'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const ticketSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  categoryId:  z.string().optional(),
});

type TicketForm = z.infer<typeof ticketSchema>;

const PRIORITIES = [
  { value: 'LOW',      label: 'Low'      },
  { value: 'MEDIUM',   label: 'Medium'   },
  { value: 'HIGH',     label: 'High'     },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="mb-2 block">
      {children}{required && <span className="ml-0.5 text-danger">*</span>}
    </Label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="mt-1 text-[11px] text-danger">{message}</div>;
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
      sileo.success({ title: 'Ticket created' });
      router.push(`/tickets/${res.data.id}`);
    },
    onError: () => sileo.error({ title: 'Failed to create ticket' }),
  });

  const onSubmit = (data: TicketForm) => mutation.mutate(data);

  return (
    <div className="max-w-[640px]">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-1.5 text-xs text-mute">
        <button
          type="button"
          onClick={() => router.push('/tickets')}
          className="p-0 text-mute transition-colors hover:text-ink"
        >
          Tickets
        </button>
        <HugeiconsIcon icon={ArrowRight01Icon} size={11} />
        <span className="font-medium text-ink">New ticket</span>
      </div>

      {/* Page head */}
      <div className="mb-7">
        <h1 className="text-ink">Create Ticket</h1>
        <p className="mt-1.5 text-[13px] text-mute">Submit a new support request</p>
      </div>

      {/* Form card */}
      <Card className="overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-5 p-6">
            {/* Title */}
            <div>
              <FieldLabel required>Title</FieldLabel>
              <Input {...register('title')} placeholder="Enter ticket title" />
              <FieldError message={errors.title?.message} />
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description</FieldLabel>
              <Textarea {...register('description')} rows={5} placeholder="Describe the issue…" className="leading-relaxed" />
            </div>

            {/* Priority + Category row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <FieldLabel>Priority</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map((p) => {
                    const active = priority === p.value;
                    return (
                      <Button
                        key={p.value}
                        type="button"
                        size="sm"
                        variant={active ? 'primary' : 'outline'}
                        onClick={() => setValue('priority', p.value)}
                      >
                        {p.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <FieldLabel>Category</FieldLabel>
                <Select
                  value={categoryId ?? ''}
                  onValueChange={(v) => setValue('categoryId', (v as string) || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {(categories?.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2.5 border-t border-border bg-surface-2 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
