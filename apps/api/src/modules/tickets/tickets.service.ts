import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketsGateway } from './tickets.gateway';
import { SlaService } from '../sla/sla.service';
import { AutomationService } from '../automations/automation.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Role } from '@prisma/client';

const ticketListInclude = {
  customer: { select: { id: true, name: true, email: true, avatarUrl: true } },
  assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
  category: true,
  tags: { include: { tag: true } },
  _count: { select: { comments: true, attachments: true } },
};

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private ticketsGateway: TicketsGateway,
    private slaService: SlaService,
    private automationService: AutomationService,
  ) {}

  async findAll(query: QueryTicketsDto, user: any) {
    const { page, limit, status, priority, categoryId, assignedToId, q } = query;
    const where: any = {};
    if (user.role === Role.CUSTOMER) where.customerId = user.id;
    if (status) where.status = Array.isArray(status) ? { in: status } : status;
    if (priority) where.priority = Array.isArray(priority) ? { in: priority } : priority;
    if (categoryId) where.categoryId = categoryId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { updatedAt: 'desc' },
        include: ticketListInclude,
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        ...ticketListInclude,
        comments: {
          include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (user.role === Role.CUSTOMER && ticket.customerId !== user.id) {
      throw new ForbiddenException();
    }
    return ticket;
  }

  async create(dto: CreateTicketDto, userId: string) {
    const ticket = await this.prisma.ticket.create({
      data: { title: dto.title, description: dto.description, priority: dto.priority, categoryId: dto.categoryId, customerId: userId },
      include: ticketListInclude,
    });
    await this.prisma.activityLog.create({
      data: { action: 'ticket.created', ticketId: ticket.id, userId },
    });
    this.slaService.calculateSla(ticket.id);
    this.ticketsGateway.server.emit('ticket:created', ticket);
    this.automationService.evaluateTrigger('ticket.created', { ticket, user: { id: userId } }).catch(() => {});
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (user.role === Role.CUSTOMER) throw new ForbiddenException();
    const updated = await this.prisma.ticket.update({
      where: { id }, data: dto, include: ticketListInclude,
    });
    const changedFields = Object.keys(dto).filter(k => (dto as any)[k] !== (ticket as any)[k]);
    if (changedFields.length > 0) {
      await this.prisma.activityLog.create({
        data: { action: 'ticket.updated', details: { fields: changedFields }, ticketId: id, userId: user.id },
      });
    }
    this.ticketsGateway.server.to(`ticket:${id}`).emit('ticket:updated', updated);
    this.automationService.evaluateTrigger('ticket.updated', { ticket: updated, user, changes: { fields: changedFields } }).catch(() => {});
    return updated;
  }

  async assign(id: string, dto: AssignTicketDto, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const updated = await this.prisma.ticket.update({
      where: { id }, data: { assignedToId: dto.agentId }, include: ticketListInclude,
    });
    await this.prisma.activityLog.create({
      data: { action: 'ticket.assigned', details: { agentId: dto.agentId }, ticketId: id, userId },
    });
    this.ticketsGateway.server.to(`ticket:${id}`).emit('ticket:updated', updated);
    return updated;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const data: any = { status: dto.status };
    if (ticket.firstResponseAt === null && (dto.status === 'IN_PROGRESS' || dto.status === 'RESOLVED')) {
      data.firstResponseAt = new Date();
    }
    if (dto.status === 'RESOLVED') data.resolvedAt = new Date();
    if (dto.status === 'CLOSED') data.closedAt = new Date();
    const updated = await this.prisma.ticket.update({
      where: { id }, data, include: ticketListInclude,
    });
    await this.prisma.activityLog.create({
      data: {
        action: 'ticket.status_changed',
        details: { from: ticket.status, to: dto.status },
        ticketId: id, userId: user.id,
      },
    });
    this.ticketsGateway.server.to(`ticket:${id}`).emit('ticket:updated', updated);
    this.automationService.evaluateTrigger('ticket.status_changed', { ticket: updated, user, changes: { from: ticket.status, to: dto.status } }).catch(() => {});
    return updated;
  }

  async remove(id: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.prisma.ticket.delete({ where: { id } });
    this.ticketsGateway.server.emit('ticket:deleted', { id });
  }
}
