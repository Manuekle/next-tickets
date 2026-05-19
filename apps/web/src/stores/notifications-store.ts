import { create } from 'zustand';

export type NotifType = 'ticket:created' | 'ticket:updated' | 'ticket:deleted';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  ticketId?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsState {
  items: AppNotification[];
  add: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  add: (n) =>
    set((state) => ({
      items: [
        { ...n, id: crypto.randomUUID(), timestamp: new Date(), read: false },
        ...state.items.slice(0, 49),
      ],
    })),
  markAllRead: () =>
    set((state) => ({ items: state.items.map((item) => ({ ...item, read: true })) })),
  clear: () => set({ items: [] }),
}));
