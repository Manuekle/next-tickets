'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOverlayState, Modal, ModalDialog, ModalHeader, ModalHeading, ModalBody, ModalCloseTrigger, Input } from '@heroui/react';
import { LayoutDashboard, Ticket, Plus } from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const state = useOverlayState();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        state.toggle();
      }
      if (e.key === 'Escape') {
        state.close();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [state]);

  const runCommand = (href: string) => {
    state.close();
    setSearch('');
    router.push(href);
  };

  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Ticket, label: 'Tickets', href: '/tickets' },
    { icon: Plus, label: 'New Ticket', href: '/tickets/new' },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal state={state}>
      <ModalDialog>
        <ModalCloseTrigger />
        <ModalHeader>
          <Input
            placeholder="Type a command or search..."
            aria-label="Search commands"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </ModalHeader>
        <ModalBody>
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            <div className="space-y-1">
              <p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Navigation</p>
              {filtered.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => runCommand(item.href)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </ModalBody>
      </ModalDialog>
    </Modal>
  );
}
