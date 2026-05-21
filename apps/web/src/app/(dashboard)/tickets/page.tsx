'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { HugeiconsIcon } from '@hugeicons/react';
import { CreateTicketDrawer } from '@/components/drawers/ticket-drawer';
import { KanbanBoard, type KanbanColumnDef, type KanbanTicket } from '@/components/tickets/kanban-board';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Ticket01Icon } from '@hugeicons/core-free-icons';
import {
  Search01Icon, Add01Icon, FilterIcon, ArrowUpDownIcon, ListViewIcon, GridViewIcon,
  CheckmarkSquareIcon, Cancel01Icon, ArrowDown01Icon, CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';

const STATUS_META: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  OPEN:                { label: 'Open',        variant: 'info'    },
  IN_PROGRESS:         { label: 'In progress', variant: 'warning' },
  WAITING_ON_CUSTOMER: { label: 'Waiting',     variant: 'neutral' },
  RESOLVED:            { label: 'Resolved',    variant: 'success' },
  CLOSED:              { label: 'Closed',      variant: 'neutral' },
};

const PRIORITY_META: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  LOW:      { label: 'Low',      variant: 'info'    },
  MEDIUM:   { label: 'Medium',   variant: 'neutral' },
  HIGH:     { label: 'High',     variant: 'warning' },
  CRITICAL: { label: 'Critical', variant: 'danger'  },
};

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  customer:   { name: string; email: string };
  assignedTo: { name: string } | null;
  createdAt:  string;
  updatedAt:  string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.round(ms / 60000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority];
  if (!m) return null;
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

const STATUS_TABS = [
  { value: '',                    label: 'All'          },
  { value: 'OPEN',                label: 'Open'         },
  { value: 'IN_PROGRESS',         label: 'In progress'  },
  { value: 'WAITING_ON_CUSTOMER', label: 'Waiting'      },
  { value: 'RESOLVED',            label: 'Resolved'     },
];

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { status: 'OPEN',                label: 'Open',        hue: 235 },
  { status: 'IN_PROGRESS',         label: 'In progress', hue: 65  },
  { status: 'WAITING_ON_CUSTOMER', label: 'Waiting',     hue: 305 },
  { status: 'RESOLVED',            label: 'Resolved',    hue: 155 },
];

interface Category { id: string; name: string }

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export default function TicketsPage() {
  const router    = useRouter();
  const qc        = useQueryClient();
  const [view,          setView]          = useState<'table' | 'board'>('table');
  const [search,        setSearch]        = useState('');
  const [statusTab,     setStatusTab]     = useState('');
  const [selected,      setSelected]      = useState<Set<string>>(new Set());
  const [page,          setPage]          = useState(1);
  const [showFilters,   setShowFilters]   = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterPrio,    setFilterPrio]    = useState<string[]>([]);
  const [filterCat,     setFilterCat]     = useState('');

  const { data: catsRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<{ data: Category[] }>('/categories'),
  });
  const categories = catsRes?.data ?? [];

  const params: Record<string, string> = {};
  if (search)    params.q          = search;
  if (statusTab) params.status     = statusTab;
  if (filterPrio.length === 1) params.priority = filterPrio[0];
  if (filterCat) params.categoryId = filterCat;
  params.page  = String(page);
  params.limit = '25';

  const hasActiveFilters = filterPrio.length > 0 || !!filterCat;

  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await Promise.all(
        [...selected].map((id) =>
          apiClient(`/tickets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) })
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      sileo.success({ title: `${selected.size} ticket${selected.size > 1 ? 's' : ''} updated` });
      setSelected(new Set());
    },
    onError: () => sileo.error({ title: 'Failed to update tickets' }),
  });

  const moveTicketMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient(`/tickets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      sileo.success({ title: `Moved to ${vars.status.replace(/_/g, ' ').toLowerCase()}` });
    },
    onError: () => sileo.error({ title: 'Failed to move ticket' }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', params],
    queryFn: () =>
      apiClient<{ data: Ticket[]; meta: { total: number; totalPages: number } }>('/tickets', { params }),
  });

  const tickets = data?.data ?? [];
  const total   = data?.meta?.total ?? 0;

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (selected.size === tickets.length) setSelected(new Set());
    else setSelected(new Set(tickets.map((t) => t.id)));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page head */}
      <div className="flex items-start justify-between gap-5">
        <div>
          <h1 className="text-ink">Tickets</h1>
          <p className="mt-2 text-[13px] text-mute">{total} tickets</p>
        </div>
        <div className="flex gap-2 pt-1.5">
          <Button variant="secondary">
            <HugeiconsIcon icon={CheckmarkSquareIcon} size={14} />
            Saved views
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} size={14} />
            New ticket
          </Button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status tabs */}
        <div className="inline-flex gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusTab(tab.value); setPage(1); }}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                statusTab === tab.value
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-mute hover:text-ink-soft',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-mute"
          />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tickets…"
            className="w-[200px] pl-8"
          />
        </div>

        <Button
          variant={showFilters || hasActiveFilters ? 'secondary' : 'outline'}
          size="md"
          onClick={() => setShowFilters((v) => !v)}
          className={cn((showFilters || hasActiveFilters) && 'bg-accent-tint text-accent')}
        >
          <HugeiconsIcon icon={FilterIcon} size={13} />
          Filter
          {hasActiveFilters && (
            <Badge variant="solid">{filterPrio.length + (filterCat ? 1 : 0)}</Badge>
          )}
        </Button>

        <Button variant="outline">
          <HugeiconsIcon icon={ArrowUpDownIcon} size={13} /> Sort
        </Button>

        <div className="h-[22px] w-px bg-border" />

        {/* View toggle */}
        <div className="inline-flex gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5">
          {(['table', 'board'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                view === v ? 'bg-surface text-ink shadow-sm' : 'text-mute hover:text-ink-soft',
              )}
            >
              {v === 'table' ? <HugeiconsIcon icon={ListViewIcon} size={12} /> : <HugeiconsIcon icon={GridViewIcon} size={12} />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="flex flex-col gap-3 p-4">
          {/* Priority filter */}
          <div className="flex items-center gap-2.5">
            <span className="min-w-[60px] text-[11.5px] font-semibold text-mute">Priority</span>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => {
                const active = filterPrio.includes(p);
                return (
                  <Button
                    key={p}
                    size="sm"
                    variant={active ? 'secondary' : 'outline'}
                    className={cn(active && 'bg-accent-tint text-accent')}
                    onClick={() => setFilterPrio((prev) => active ? prev.filter((x) => x !== p) : [...prev, p])}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2.5">
              <span className="min-w-[60px] text-[11.5px] font-semibold text-mute">Category</span>
              <Select value={filterCat} onValueChange={(v) => setFilterCat(v as string)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-danger hover:text-danger"
              onClick={() => { setFilterPrio([]); setFilterCat(''); }}
            >
              Clear filters
            </Button>
          )}
        </Card>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-accent bg-accent-tint px-4 py-2.5">
          <span className="text-xs font-medium text-accent">{selected.size} selected</span>
          <div className="flex-1" />

          {/* Resolve */}
          <Button
            variant="ghost"
            size="sm"
            className="text-success hover:bg-success-tint hover:text-success"
            onClick={() => bulkStatusMutation.mutate('RESOLVED')}
            disabled={bulkStatusMutation.isPending}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
            Resolve
          </Button>

          {/* Change status menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                  Change status
                  <HugeiconsIcon icon={ArrowDown01Icon} size={11} />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {[
                { value: 'OPEN',                label: 'Open'         },
                { value: 'IN_PROGRESS',         label: 'In Progress'  },
                { value: 'WAITING_ON_CUSTOMER', label: 'Waiting'      },
                { value: 'RESOLVED',            label: 'Resolved'     },
                { value: 'CLOSED',              label: 'Closed'       },
              ].map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => bulkStatusMutation.mutate(s.value)}
                  disabled={bulkStatusMutation.isPending}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon-sm"
            className="text-accent hover:text-accent"
            onClick={() => setSelected(new Set())}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
          </Button>
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-2 hover:bg-surface-2">
                <TableHead className="w-8">
                  <Checkbox
                    checked={selected.size === tickets.length && tickets.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-[90px]">ID</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Priority</TableHead>
                <TableHead className="w-[120px]">Assignee</TableHead>
                <TableHead className="w-[70px] text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-4 rounded bg-surface-2" /></TableCell>
                    <TableCell><div className="h-3 rounded bg-surface-2" /></TableCell>
                    <TableCell><div className="h-3.5 rounded bg-surface-2" /></TableCell>
                    <TableCell><div className="h-[22px] w-20 rounded-md bg-surface-2" /></TableCell>
                    <TableCell><div className="h-3.5 w-14 rounded bg-surface-2" /></TableCell>
                    <TableCell><div className="h-3.5 w-20 rounded bg-surface-2" /></TableCell>
                    <TableCell><div className="h-3 rounded bg-surface-2" /></TableCell>
                  </TableRow>
                ))
              ) : tickets.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={Ticket01Icon}
                      title="No tickets found"
                      description={hasActiveFilters || search ? 'Try clearing filters to see more results.' : 'Create your first ticket to get started.'}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow
                    key={t.id}
                    className={cn('cursor-pointer', selected.has(t.id) && 'bg-accent-tint hover:bg-accent-tint')}
                    onClick={(e) => {
                      const tag = (e.target as HTMLElement).tagName;
                      if (tag === 'INPUT' || tag === 'BUTTON') return;
                      if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                      router.push(`/tickets/${t.id}`);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-mute">{t.id?.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div className="min-w-0 pr-2">
                        <div className="truncate text-[13px] font-medium text-ink">{t.title}</div>
                        <div className="mt-0.5 text-[11px] text-mute">{t.customer?.name}</div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                    <TableCell className={cn('text-xs', t.assignedTo ? 'text-ink' : 'italic text-mute')}>
                      {t.assignedTo?.name ?? 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-right text-[11px] tabular-nums text-mute">
                      {timeAgo(t.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Board view (drag & drop) */}
      {view === 'board' && (
        isLoading ? (
          <div className="grid gap-3 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, minmax(260px, 1fr))` }}>
            {KANBAN_COLUMNS.map((c) => (
              <div key={c.status} className="min-h-[200px] rounded-xl border border-border bg-surface-2 p-2.5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="mb-2 p-3">
                    <div className="mb-2.5 h-3 rounded bg-surface-2" />
                    <div className="h-[26px] rounded bg-surface-2" />
                  </Card>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard
            columns={KANBAN_COLUMNS}
            tickets={tickets as KanbanTicket[]}
            onOpen={(id) => router.push(`/tickets/${id}`)}
            onMove={(id, status) => moveTicketMutation.mutate({ id, status })}
            renderCard={(t) => (
              <Card className="flex flex-col gap-2 p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-medium text-mute">{t.id?.slice(0, 8)}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
                <div className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{t.title}</div>
                <div className="mt-0.5 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-[11px] text-mute">{t.customer?.name}</span>
                  <span className="text-[11px] tabular-nums text-mute">{timeAgo(t.updatedAt)}</span>
                </div>
              </Card>
            )}
          />
        )
      )}

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && view === 'table' && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-xs tabular-nums text-mute">
            Page {page} of {data.meta.totalPages}
          </span>
          <Button variant="secondary" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
      <CreateTicketDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
