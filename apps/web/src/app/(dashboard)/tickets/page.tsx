'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-500',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-500',
  WAITING_ON_CUSTOMER: 'bg-orange-500/10 text-orange-500',
  RESOLVED: 'bg-green-500/10 text-green-500',
  CLOSED: 'bg-gray-500/10 text-gray-500',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-500/10 text-gray-500',
  MEDIUM: 'bg-blue-500/10 text-blue-500',
  HIGH: 'bg-orange-500/10 text-orange-500',
  CRITICAL: 'bg-red-500/10 text-red-500',
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
  if (ticket.slaBreached) return { label: 'BREACHED', className: 'bg-red-500/10 text-red-500', urgent: true };

  const due = new Date(ticket.slaDueAt).getTime();
  const created = new Date(ticket.createdAt).getTime();
  const now = Date.now();
  const remaining = due - now;

  if (remaining <= 0) return { label: 'BREACHED', className: 'bg-red-500/10 text-red-500', urgent: true };

  const total = due - created;
  const ratio = remaining / total;
  const hours = remaining / (1000 * 60 * 60);
  const label = hours >= 1 ? `${Math.round(hours)}h left` : `${Math.round(remaining / (1000 * 60))}m left`;

  if (ratio > 0.5) return { label, className: 'bg-green-500/10 text-green-500', urgent: false };
  if (ratio > 0.25) return { label, className: 'bg-yellow-500/10 text-yellow-500', urgent: false };
  return { label, className: 'bg-orange-500/10 text-orange-500', urgent: true };
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            aria-label="Search tickets"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v ?? '');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="WAITING_ON_CUSTOMER">Waiting</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priority}
          onValueChange={(v) => {
            setPriority(v ?? '');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/tickets/${ticket.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="hover:text-primary"
                        >
                          {ticket.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[ticket.status]}
                        >
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={priorityColors[ticket.priority]}
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const sla = getSlaStatus(ticket);
                          return sla ? (
                            <Badge variant="secondary" className={sla.className}>
                              {sla.label}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ticket.customer?.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.assignedTo?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
          </TableBody>
        </Table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
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
