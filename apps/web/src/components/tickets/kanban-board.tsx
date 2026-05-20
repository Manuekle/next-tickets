'use client';

import { DndContext, DragEndEvent, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';

export interface KanbanTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  customer?: { name: string };
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

function DroppableColumn({ col, count, children }: { col: KanbanColumnDef; count: number; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: `col:${col.status}` });
  return (
    <div
      ref={setNodeRef}
      style={{
        background:   isOver ? 'var(--accent-tint)' : 'var(--surface-2)',
        borderRadius: '14px',
        padding:      '10px',
        minHeight:    '200px',
        boxShadow:    'var(--shadow-inset)',
        transition:   'background 120ms',
        outline:      isOver ? '2px dashed var(--accent)' : 'none',
        outlineOffset: '-4px',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 6px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px 3px 7px',
            fontSize: '11px', fontWeight: 600, borderRadius: '5px',
            color: `oklch(0.45 0.18 ${col.hue})`,
            background: `oklch(0.96 0.04 ${col.hue})`,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: `oklch(0.50 0.18 ${col.hue})` }} />
            {col.label}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{count}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
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
      style={{
        transform: transformStyle,
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
        touchAction: 'none',
      }}
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
        className="nt-kanban-scroll"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`,
          gap: '12px',
          alignItems: 'flex-start',
          overflowX: 'auto',
          paddingBottom: '6px',
        }}
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
          <div style={{ pointerEvents: 'none', cursor: 'grabbing', boxShadow: 'var(--shadow-md)', borderRadius: '12px' }}>
            {renderCard(active)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
