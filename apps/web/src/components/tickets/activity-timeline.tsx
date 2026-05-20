import { format, formatDistanceToNow } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon, PencilEdit01Icon, UserAdd01Icon, Tag01Icon, CheckmarkCircle02Icon,
  BubbleChatIcon, Activity01Icon, AlertCircleIcon, Delete02Icon, ArchiveIcon,
} from '@hugeicons/core-free-icons';

interface ActivityLog {
  id: string;
  action: string;
  details?: Record<string, unknown> | null;
  user: { id: string; name: string } | null;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: any; hue: number }> = {
  'ticket.created':      { label: 'created the ticket',  icon: Add01Icon,              hue: 235 },
  'ticket.updated':      { label: 'updated the ticket',  icon: PencilEdit01Icon,       hue: 60  },
  'ticket.assigned':     { label: 'changed assignee',    icon: UserAdd01Icon,          hue: 220 },
  'ticket.status':       { label: 'changed status',      icon: Activity01Icon,         hue: 148 },
  'ticket.priority':     { label: 'changed priority',    icon: AlertCircleIcon,        hue: 22  },
  'ticket.tag':          { label: 'updated tags',        icon: Tag01Icon,              hue: 270 },
  'ticket.resolved':     { label: 'resolved the ticket', icon: CheckmarkCircle02Icon,  hue: 148 },
  'ticket.closed':       { label: 'closed the ticket',   icon: ArchiveIcon,            hue: 260 },
  'ticket.deleted':      { label: 'deleted the ticket',  icon: Delete02Icon,           hue: 22  },
  'comment.added':       { label: 'added a comment',     icon: BubbleChatIcon,         hue: 200 },
};

export function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', borderRadius: '14px', padding: '40px 20px',
        textAlign: 'center', boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ fontSize: '13px', color: 'var(--mute)' }}>No activity recorded yet.</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-sm)', padding: '18px 20px' }}>
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        <div style={{ position: 'absolute', left: '11px', top: '6px', bottom: '6px', width: '2px', background: 'var(--hairline)' }} />
        {logs.map((log) => {
          const meta = ACTION_META[log.action] ?? { label: log.action.replace(/[._]/g, ' '), icon: Activity01Icon, hue: 270 };
          return (
            <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '-20px', top: '10px',
                width: '24px', height: '24px', borderRadius: '999px',
                background: `oklch(0.96 0.04 ${meta.hue})`,
                color:      `oklch(0.45 0.18 ${meta.hue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 0 0 2px var(--surface)',
              }}>
                <HugeiconsIcon icon={meta.icon} size={11} />
              </div>
              <div style={{ paddingLeft: '16px', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600 }}>{log.user?.name ?? 'System'}</span>
                  {' '}
                  <span style={{ color: 'var(--ink-soft)' }}>{meta.label}</span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div style={{ fontSize: '11.5px', color: 'var(--mute)', marginTop: '3px', fontFamily: 'var(--font-mono, monospace)' }}>
                    {Object.entries(log.details).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '2px' }} title={format(new Date(log.createdAt), 'PPpp')}>
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
