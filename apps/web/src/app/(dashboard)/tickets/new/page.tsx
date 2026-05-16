'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button, Input, TextArea, Card, CardContent, Select, SelectTrigger, SelectValue, SelectPopover, ListBox, ListBoxItem, TextField, Label, FieldError } from '@heroui/react';
import { toast } from 'sonner';
import { Key } from 'react-aria-components';

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
            <TextField isInvalid={!!errors.title}>
              <Label>Title</Label>
              <Input {...register('title')} />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </TextField>
            <TextField>
              <Label>Description</Label>
              <TextArea {...register('description')} rows={5} />
            </TextField>
            <div className="grid grid-cols-2 gap-4">
              <Select onSelectionChange={(keys) => {
                const v = String(keys);
                if (v) setValue('priority', v as any);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectPopover>
                  <ListBox>
                    <ListBoxItem id="LOW">Low</ListBoxItem>
                    <ListBoxItem id="MEDIUM">Medium</ListBoxItem>
                    <ListBoxItem id="HIGH">High</ListBoxItem>
                    <ListBoxItem id="CRITICAL">Critical</ListBoxItem>
                  </ListBox>
                </SelectPopover>
              </Select>
              <Select onSelectionChange={(keys) => {
                const v = String(keys);
                setValue('categoryId', v || undefined);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectPopover>
                  <ListBox>
                    {categories?.data.map((c) => (
                      <ListBoxItem key={c.id} id={c.id}>{c.name}</ListBoxItem>
                    ))}
                  </ListBox>
                </SelectPopover>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" isDisabled={mutation.isPending}>
                Create Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
