import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconSvgElement;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '10px', padding: '40px 16px', textAlign: 'center',
    }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: 'var(--surface-2)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--mute)',
      }}>
        <HugeiconsIcon icon={icon} size={22} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
      {description && (
        <div style={{ fontSize: '12px', color: 'var(--mute)', maxWidth: '320px', lineHeight: 1.5 }}>{description}</div>
      )}
      {action && <div style={{ marginTop: '4px' }}>{action}</div>}
    </div>
  );
}
