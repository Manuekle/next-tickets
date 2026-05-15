'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

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
      transports: ['websocket'],
    });

    newSocket.on('connect', () => onConnect(newSocket));
    newSocket.on('disconnect', onDisconnect);

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.disconnect();
    };
  }, [accessToken, onConnect, onDisconnect]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
