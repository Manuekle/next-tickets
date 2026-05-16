'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button, Input, Chip, Skeleton, Select, SelectTrigger, SelectValue, SelectPopover } from '@heroui/react';
import { ListBox, ListBoxItem } from '@heroui/react';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, 'accent' | 'warning' | 'success' | 'default'> = {
  OPEN: 'accent',
  IN_PROGRESS: 'warning',
  WAITING_ON_CUSTOMER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const priorityColors: Record<string, 'default' | 'accent' | 'warning' | 'danger'> = {
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
  createdAt: string;
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
  params.limit = '25';

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', params],
    queryFn: () =>
      apiClient<{ data: Ticket[]; meta: { total: number; totalPages: number } }>('/tickets', { params }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#172B4D]">Tickets</h1>
          <p className="text-sm text-[#6B778C]">{data?.meta.total || 0} total</p>
        </div>
        <Link href="/tickets/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            <span className="ml-1.5">Create Ticket</span>
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B778C] z-10" />
          <Input
            placeholder="Search tickets..."
            aria-label="Search tickets"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          aria-label="Filter by status"
          onSelectionChange={(keys) => { setStatus(String(keys || '')); setPage(1); }}
        >
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem id=" ">All statuses</ListBoxItem>
              <ListBoxItem id="OPEN">Open</ListBoxItem>
              <ListBoxItem id="IN_PROGRESS">In Progress</ListBoxItem>
              <ListBoxItem id="WAITING_ON_CUSTOMER">Waiting</ListBoxItem>
              <ListBoxItem id="RESOLVED">Resolved</ListBoxItem>
              <ListBoxItem id="CLOSED">Closed</ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
        <Select
          aria-label="Filter by priority"
          onSelectionChange={(keys) => { setPriority(String(keys || '')); setPage(1); }}
        >
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem id=" ">All priorities</ListBoxItem>
              <ListBoxItem id="LOW">Low</ListBoxItem>
              <ListBoxItem id="MEDIUM">Medium</ListBoxItem>
              <ListBoxItem id="HIGH">High</ListBoxItem>
              <ListBoxItem id="CRITICAL">Critical</ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
      </div>

      <div className="rounded-sm border border-[#DFE1E6] bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DFE1E6] bg-[#f4f5f7]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Title</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Priority</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Customer</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Assignee</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#DFE1E6] last:border-0">
                  <td colSpan={6} className="px-4 py-3"><Skeleton className="h-8 w-full rounded-sm" /></td>
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr className="border-b border-[#DFE1E6] last:border-0">
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#6B778C]">
                  No tickets found
                </td>
              </tr>
            ) : (
              data?.data.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-[#DFE1E6] last:border-0 cursor-pointer hover:bg-[#f4f5f7] transition-colors"
                  onClick={() => window.location.href = `/tickets/${ticket.id}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${ticket.id}`} className="text-sm font-medium text-[#172B4D] hover:text-[#0052CC]">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Chip color={statusColors[ticket.status] as any} variant="soft" size="sm" className="text-xs">
                      {ticket.status.replace('_', ' ')}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <Chip color={priorityColors[ticket.priority] as any} variant="soft" size="sm" className="text-xs">
                      {ticket.priority}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#172B4D]">{ticket.customer?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#6B778C]">{ticket.assignedTo?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-sm text-[#6B778C]">
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" isDisabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-[#6B778C]">Page {page} of {data.meta.totalPages}</span>
          <Button variant="secondary" size="sm" isDisabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
