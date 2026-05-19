'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const SOCKET_URL = API_URL.replace('/api', '');

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isConnectedRef = useRef(false);

  const onConnect = useCallback((s: Socket) => {
    isConnectedRef.current = true;
    setSocket(s);
  }, []);

  const onDisconnect = useCallback(() => {
    isConnectedRef.current = false;
    setSocket(null);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => onConnect(newSocket));
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', () => {});

    newSocket.on('ticket:created', (ticket: any) => {
      useNotificationsStore.getState().add({
        type: 'ticket:created',
        title: 'New ticket',
        message: ticket?.title ?? 'A new ticket was created',
        ticketId: ticket?.id,
      });
    });

    newSocket.on('ticket:deleted', ({ id }: { id: string }) => {
      useNotificationsStore.getState().add({
        type: 'ticket:deleted',
        title: 'Ticket deleted',
        message: `#${id?.slice(-6).toUpperCase() ?? ''}`,
        ticketId: id,
      });
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('ticket:created');
      newSocket.off('ticket:deleted');
      newSocket.disconnect();
    };
  }, [accessToken, onConnect, onDisconnect]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
