import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';

export function useSocketEvent<T = unknown>(
  socket: Socket | null,
  event: string,
  handler: (data: T) => void,
  deps: React.DependencyList = [],
) {
  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler as any);
    return () => {
      socket.off(event, handler as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, event, ...deps]);
}

export function useTicketRoom(socket: Socket | null, ticketId: string | null | undefined) {
  useEffect(() => {
    if (!socket || !ticketId) return;
    socket.emit('join:ticket', { ticketId });
    return () => {
      socket.emit('leave:ticket', { ticketId });
    };
  }, [socket, ticketId]);
}
