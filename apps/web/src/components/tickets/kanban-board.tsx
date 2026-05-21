'use client';

import { DndContext, DragEndEvent, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface KanbanTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  customer?: { name: string };
  category?: { name: string } | null;
  updatedAt: string;
}

export interface KanbanColumnDef {
  status: string;
  label: string;
  hue: number;
}

interface Props {
  columns: KanbanColumnDef[];
  tickets: KanbanTicket[];
  onMove: (ticketId: string, toStatus: string) => void;
  onOpen: (ticketId: string) => void;
  renderCard: (t: KanbanTicket) => React.ReactNode;
}

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  WAITING_ON_CUSTOMER: 'neutral',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

function DroppableColumn({ col, count, children }: { col: KanbanColumnDef; count: number; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: `col:${col.status}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[200px] rounded-xl border p-2.5 transition-colors',
        isOver ? 'border-accent border-dashed bg-accent-tint' : 'border-border bg-surface-2',
      )}
    >
      <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[col.status] ?? 'neutral'}>{col.label}</Badge>
          <span className="text-[11px] font-semibold tabular-nums text-mute">{count}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function DraggableCard({ t, onOpen, renderCard }: { t: KanbanTicket; onOpen: (id: string) => void; renderCard: (t: KanbanTicket) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `card:${t.id}` });
  const transformStyle = transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined;
  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        if (isDragging) return;
        const target = e.target as HTMLElement;
        if (target.closest('[data-drag-handle="false"]')) return;
        onOpen(t.id);
      }}
      className={cn('touch-none', isDragging ? 'cursor-grabbing opacity-40' : 'cursor-pointer')}
      style={{ transform: transformStyle }}
      {...listeners}
      {...attributes}
    >
      {renderCard(t)}
    </div>
  );
}

export function KanbanBoard({ columns, tickets, onMove, onOpen, renderCard }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 5 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const ticketId = String(active.id).replace(/^card:/, '');
    const targetCol = String(over.id).replace(/^col:/, '');
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === targetCol) return;
    onMove(ticketId, targetCol);
  };

  const active = activeId ? tickets.find((t) => t.id === activeId.replace(/^card:/, '')) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: import('@dnd-kit/core').DragStartEvent) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div
        className="nt-kanban-scroll grid items-start gap-3 overflow-x-auto pb-1.5"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))` }}
      >
        {columns.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.status);
          return (
            <DroppableColumn key={col.status} col={col} count={colTickets.length}>
              {colTickets.map((t) => (
                <DraggableCard key={t.id} t={t} onOpen={onOpen} renderCard={renderCard} />
              ))}
            </DroppableColumn>
          );
        })}
      </div>
      <DragOverlay>
        {active ? (
          <div className="pointer-events-none cursor-grabbing rounded-xl shadow-md">
            {renderCard(active)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
