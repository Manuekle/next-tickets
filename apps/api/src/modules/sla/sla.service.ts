import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSlaDto } from './dto/create-sla.dto';
import { UpdateSlaDto } from './dto/update-sla.dto';

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; isActive?: boolean }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [data, total] = await Promise.all([
      this.prisma.sLA.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sLA.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const sla = await this.prisma.sLA.findUnique({ where: { id } });
    if (!sla) throw new NotFoundException('SLA rule not found');
    return sla;
  }

  async create(dto: CreateSlaDto) {
    return this.prisma.sLA.create({ data: dto });
  }

  async update(id: string, dto: UpdateSlaDto) {
    const sla = await this.prisma.sLA.findUnique({ where: { id } });
    if (!sla) throw new NotFoundException('SLA rule not found');
    return this.prisma.sLA.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const sla = await this.prisma.sLA.findUnique({ where: { id } });
    if (!sla) throw new NotFoundException('SLA rule not found');
    await this.prisma.sLA.delete({ where: { id } });
  }

  async calculateSla(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return null;

    let slaRule = await this.prisma.sLA.findFirst({
      where: { isActive: true, priority: ticket.priority },
      orderBy: { createdAt: 'desc' },
    });

    if (!slaRule) {
      slaRule = await this.prisma.sLA.findFirst({
        where: { isActive: true, priority: null },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!slaRule) return null;

    const slaDueAt = new Date(Date.now() + slaRule.firstResponseHours * 60 * 60 * 1000);

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { slaDueAt },
    });

    return slaDueAt;
  }

  async checkSlaBreaches() {
    const overdueTickets = await this.prisma.ticket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        slaDueAt: { lt: new Date() },
        slaBreached: false,
      },
      include: { assignedTo: true },
    });

    for (const ticket of overdueTickets) {
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { slaBreached: true },
      });

      if (ticket.assignedToId) {
        await this.prisma.notification.create({
          data: {
            type: 'sla_breach',
            title: 'SLA Breach',
            body: `Ticket "${ticket.title}" has breached its SLA.`,
            userId: ticket.assignedToId,
            link: `/tickets/${ticket.id}`,
          },
        });
      }
    }

    return { breached: overdueTickets.length };
  }

  async getSlaMetrics() {
    const totalTickets = await this.prisma.ticket.count({
      where: { slaDueAt: { not: null } },
    });

    const breachedCount = await this.prisma.ticket.count({
      where: { slaBreached: true },
    });

    const resolvedWithSla = await this.prisma.ticket.findMany({
      where: {
        status: 'RESOLVED',
        slaDueAt: { not: null },
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true, slaDueAt: true, priority: true },
    });

    const withinSlaCount = resolvedWithSla.filter(
      t => t.resolvedAt! <= t.slaDueAt!
    ).length;

    const totalResolvedWithSla = resolvedWithSla.length;

    const totalResolutionMs = resolvedWithSla.reduce((sum, t) => {
      return sum + (t.resolvedAt!.getTime() - t.createdAt.getTime());
    }, 0);
    const avgResolutionTime = totalResolvedWithSla > 0
      ? Number((totalResolutionMs / totalResolvedWithSla / (1000 * 60 * 60)).toFixed(2))
      : 0;

    const slaComplianceRate = totalResolvedWithSla > 0
      ? Number(((withinSlaCount / totalResolvedWithSla) * 100).toFixed(2))
      : 0;

    const ticketsByPriority = await this.prisma.ticket.groupBy({
      by: ['priority'],
      where: { slaDueAt: { not: null } },
      _count: true,
    });

    const breachedByPriority = await this.prisma.ticket.groupBy({
      by: ['priority'],
      where: { slaBreached: true },
      _count: true,
    });

    const byPriority = ticketsByPriority.map(group => {
      const breached = breachedByPriority.find(b => b.priority === group.priority);
      return {
        priority: group.priority,
        total: group._count,
        breached: breached?._count ?? 0,
      };
    });

    return {
      totalTickets,
      breachedCount,
      withinSlaCount,
      avgResolutionTime,
      slaComplianceRate,
      byPriority,
    };
  }
}
