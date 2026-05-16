'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button, Input, Chip, Skeleton, Select, SelectTrigger, SelectValue, SelectPopover, ListBox, ListBoxItem } from '@heroui/react';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  OPEN: 'accent',
  IN_PROGRESS: 'warning',
  WAITING_ON_CUSTOMER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const priorityColors: Record<string, string> = {
  LOW: 'default',
  MEDIUM: 'accent',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  customer: { name: string; email: string };
  assignedTo: { name: string } | null;
  category: { name: string } | null;
  createdAt: string;
  slaDueAt: string | null;
  slaBreached: boolean;
}

function getSlaStatus(ticket: Ticket) {
  if (!ticket.slaDueAt) return null;
  if (ticket.slaBreached) return { label: 'BREACHED', color: 'danger' as const };

  const due = new Date(ticket.slaDueAt).getTime();
  const created = new Date(ticket.createdAt).getTime();
  const now = Date.now();
  const remaining = due - now;

  if (remaining <= 0) return { label: 'BREACHED', color: 'danger' as const };

  const total = due - created;
  const ratio = remaining / total;
  const hours = remaining / (1000 * 60 * 60);
  const label = hours >= 1 ? `${Math.round(hours)}h left` : `${Math.round(remaining / (1000 * 60))}m left`;

  if (ratio > 0.5) return { label, color: 'success' as const };
  if (ratio > 0.25) return { label, color: 'warning' as const };
  return { label, color: 'danger' as const };
}

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const params: Record<string, string> = {};
  if (search) params.q = search;
  if (status) params.status = status;
  if (priority) params.priority = priority;
  params.page = String(page);
  params.limit = '20';

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', params],
    queryFn: () =>
      apiClient<{
        data: Ticket[];
        meta: { total: number; totalPages: number };
      }>('/tickets', { params }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {data?.meta.total || 0} total tickets
          </p>
        </div>
        <Link href="/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            placeholder="Search tickets..."
            aria-label="Search tickets"
            className="pl-9"
            value={search}
            onChange={(e) => { const v = e.target.value;
              setSearch(v);
              setPage(1);
            }}
          />
        </div>
        <Select onSelectionChange={(keys) => {
          setStatus(String(keys || ''));
          setPage(1);
        }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem id=" ">All</ListBoxItem>
              <ListBoxItem id="OPEN">Open</ListBoxItem>
              <ListBoxItem id="IN_PROGRESS">In Progress</ListBoxItem>
              <ListBoxItem id="WAITING_ON_CUSTOMER">Waiting</ListBoxItem>
              <ListBoxItem id="RESOLVED">Resolved</ListBoxItem>
              <ListBoxItem id="CLOSED">Closed</ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
        <Select onSelectionChange={(keys) => {
          setPriority(String(keys || ''));
          setPage(1);
        }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem id=" ">All</ListBoxItem>
              <ListBoxItem id="LOW">Low</ListBoxItem>
              <ListBoxItem id="MEDIUM">Medium</ListBoxItem>
              <ListBoxItem id="HIGH">High</ListBoxItem>
              <ListBoxItem id="CRITICAL">Critical</ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">SLA</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Assigned To</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={7} className="px-4 py-3"><Skeleton className="h-8 w-full rounded-lg" /></td>
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr className="border-b last:border-0">
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No tickets found
                </td>
              </tr>
            ) : (
              data?.data.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                  onClick={() => (window.location.href = `/tickets/${ticket.id}`)}
                >
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/tickets/${ticket.id}`} className="hover:text-primary">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Chip color={statusColors[ticket.status] as any} variant="soft" size="sm">
                      {ticket.status.replace('_', ' ')}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <Chip color={priorityColors[ticket.priority] as any} variant="soft" size="sm">
                      {ticket.priority}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const sla = getSlaStatus(ticket);
                      return sla ? (
                        <Chip color={sla.color} variant="soft" size="sm">
                          {sla.label}
                        </Chip>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm">{ticket.customer?.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.assignedTo?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            isDisabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.meta.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            isDisabled={page >= data.meta.totalPages}
            onClick={() => setPage(page + 1)}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
