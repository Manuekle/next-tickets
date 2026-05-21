import { format, formatDistanceToNow } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon, PencilEdit01Icon, UserAdd01Icon, Tag01Icon, CheckmarkCircle02Icon,
  BubbleChatIcon, Activity01Icon, AlertCircleIcon, Delete02Icon, ArchiveIcon,
} from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';

interface ActivityLog {
  id: string;
  action: string;
  details?: Record<string, unknown> | null;
  user: { id: string; name: string } | null;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: any }> = {
  'ticket.created':      { label: 'created the ticket',  icon: Add01Icon              },
  'ticket.updated':      { label: 'updated the ticket',  icon: PencilEdit01Icon       },
  'ticket.assigned':     { label: 'changed assignee',    icon: UserAdd01Icon          },
  'ticket.status':       { label: 'changed status',      icon: Activity01Icon         },
  'ticket.priority':     { label: 'changed priority',    icon: AlertCircleIcon        },
  'ticket.tag':          { label: 'updated tags',        icon: Tag01Icon              },
  'ticket.resolved':     { label: 'resolved the ticket', icon: CheckmarkCircle02Icon  },
  'ticket.closed':       { label: 'closed the ticket',   icon: ArchiveIcon            },
  'ticket.deleted':      { label: 'deleted the ticket',  icon: Delete02Icon           },
  'comment.added':       { label: 'added a comment',     icon: BubbleChatIcon         },
};

export function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return (
      <Card className="px-5 py-10 text-center">
        <div className="text-[13px] text-mute">No activity recorded yet.</div>
      </Card>
    );
  }

  return (
    <Card className="px-5 py-4">
      <div className="relative pl-5">
        <div className="absolute left-[11px] top-1.5 bottom-1.5 w-px bg-border" />
        {logs.map((log) => {
          const meta = ACTION_META[log.action] ?? { label: log.action.replace(/[._]/g, ' '), icon: Activity01Icon };
          return (
            <div key={log.id} className="relative flex items-start gap-3 py-2.5">
              <div className="absolute -left-5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-mute ring-2 ring-surface">
                <HugeiconsIcon icon={meta.icon} size={11} />
              </div>
              <div className="min-w-0 flex-1 pl-4">
                <div className="text-[13px] leading-snug text-ink">
                  <span className="font-semibold">{log.user?.name ?? 'System'}</span>{' '}
                  <span className="text-ink-soft">{meta.label}</span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-0.5 font-mono text-[11px] text-mute">
                    {Object.entries(log.details).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                  </div>
                )}
                <div className="mt-0.5 text-[11px] text-mute" title={format(new Date(log.createdAt), 'PPpp')}>
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
