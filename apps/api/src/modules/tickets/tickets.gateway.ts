import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL, credentials: true } })
export class TicketsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;

  afterInit() {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    try {
      const payload = new JwtService({ secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret' }).verify(token);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join:ticket')
  handleJoinTicket(client: Socket, { ticketId }: { ticketId: string }) {
    client.join(`ticket:${ticketId}`);
  }

  @SubscribeMessage('leave:ticket')
  handleLeaveTicket(client: Socket, { ticketId }: { ticketId: string }) {
    client.leave(`ticket:${ticketId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(client: Socket, { ticketId }: { ticketId: string }) {
    client.to(`ticket:${ticketId}`).emit('typing:status', {
      userId: client.data.user?.sub,
      name: client.data.user?.name,
      typing: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(client: Socket, { ticketId }: { ticketId: string }) {
    client.to(`ticket:${ticketId}`).emit('typing:status', {
      userId: client.data.user?.sub,
      name: client.data.user?.name,
      typing: false,
    });
  }
}
