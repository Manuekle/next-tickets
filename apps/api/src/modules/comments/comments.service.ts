import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Role } from '@prisma/client';
import { TicketsGateway } from '../tickets/tickets.gateway';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

const commentInclude = {
  author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
};

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private ticketsGateway: TicketsGateway,
  ) {}

  async findByTicket(ticketId: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (user.role === Role.CUSTOMER && ticket.customerId !== user.id) {
      throw new ForbiddenException();
    }
    const where: any = { ticketId };
    if (user.role === Role.CUSTOMER) where.isInternal = false;
    return this.prisma.ticketComment.findMany({
      where, orderBy: { createdAt: 'asc' },
      include: commentInclude,
    });
  }

  async create(dto: CreateCommentDto, userId: string, ticketId: string, userRole: Role) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (dto.isInternal && userRole === Role.CUSTOMER) {
      throw new ForbiddenException();
    }
    const cleanContent = purify.sanitize(dto.content);
    const comment = await this.prisma.ticketComment.create({
      data: { content: cleanContent, isInternal: dto.isInternal, ticketId, authorId: userId },
      include: commentInclude,
    });
    await this.prisma.activityLog.create({
      data: { action: 'comment.added', ticketId, userId },
    });
    if (!dto.isInternal && !ticket.firstResponseAt) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() },
      });
    }
    this.ticketsGateway.server.to(`ticket:${ticketId}`).emit('comment:created', comment);
    return comment;
  }
}
