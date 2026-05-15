import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketStatus, TicketPriority } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId?: string, role?: string) {
    const baseWhere = role === 'CUSTOMER' && userId ? { customerId: userId } : {};
    const agentActivityFilter = role === 'AGENT' && userId ? { userId } : {};

    const [openCount, closedCount, pendingCount, inProgressCount] = await Promise.all([
      this.prisma.ticket.count({ where: { ...baseWhere, status: TicketStatus.OPEN } }),
      this.prisma.ticket.count({ where: { ...baseWhere, status: TicketStatus.CLOSED } }),
      this.prisma.ticket.count({ where: { ...baseWhere, status: TicketStatus.WAITING_ON_CUSTOMER } }),
      this.prisma.ticket.count({ where: { ...baseWhere, status: TicketStatus.IN_PROGRESS } }),
    ]);

    const [byPriority, byCategory, recentActivity] = await Promise.all([
      this.prisma.ticket.groupBy({ by: ['priority'], _count: true, where: { ...baseWhere } }),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT c.name, COALESCE(COUNT(t.id), 0)::int as count
         FROM categories c LEFT JOIN tickets t ON t.category_id = c.id
         ${baseWhere.customerId ? 'AND t.customer_id = $1' : ''}
         GROUP BY c.name`,
        ...(baseWhere.customerId ? [baseWhere.customerId] : []),
      ),
      this.prisma.activityLog.findMany({
        where: agentActivityFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } }, ticket: { select: { title: true } } },
      }),
    ]);

    const avgResult = await this.prisma.$queryRawUnsafe<{ avg_hours: number | null }[]>(
      `SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 3600) as avg_hours
       FROM tickets WHERE first_response_at IS NOT NULL AND created_at > NOW() - INTERVAL '30 days'`,
    );

    return {
      openCount, closedCount, pendingCount, inProgressCount,
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
      byCategory,
      recentActivity,
      avgFirstResponseHours: avgResult[0]?.avg_hours || null,
    };
  }

  async getTrends(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true, priority: true },
      orderBy: { createdAt: 'asc' },
    });

    const trends: Record<string, { date: string; created: number; resolved: number; open: number; critical: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(since.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      trends[date] = { date, created: 0, resolved: 0, open: 0, critical: 0 };
    }

    for (const ticket of tickets) {
      const date = ticket.createdAt.toISOString().split('T')[0];
      if (trends[date]) {
        trends[date].created++;
        if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) trends[date].resolved++;
        if (ticket.status === TicketStatus.OPEN) trends[date].open++;
        if (ticket.priority === TicketPriority.CRITICAL) trends[date].critical++;
      }
    }

    return Object.values(trends);
  }

  async getAgentPerformance() {
    const agents = await this.prisma.user.findMany({
      where: { role: { in: ['AGENT', 'ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: {
        id: true, name: true, avatarUrl: true,
        _count: {
          select: {
            assignedTickets: true,
            comments: true,
          },
        },
      },
    });

    const resolvedCounts = await this.prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: { status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }, assignedToId: { not: null } },
      _count: true,
    });

    const agentIds = agents.map((a) => a.id);
    const avgResponseTimes: Record<string, number> = {};

    for (const agentId of agentIds) {
      const result = await this.prisma.$queryRawUnsafe<{ avg_hours: number | null }[]>(
        `SELECT AVG(EXTRACT(EPOCH FROM (t.first_response_at - t.created_at)) / 3600) as avg_hours
         FROM tickets t WHERE t.assigned_to_id = $1 AND t.first_response_at IS NOT NULL`,
        agentId,
      );
      avgResponseTimes[agentId] = result[0]?.avg_hours || 0;
    }

    return agents.map((agent) => {
      const resolved = resolvedCounts.find((r) => r.assignedToId === agent.id);
      return {
        id: agent.id,
        name: agent.name,
        avatarUrl: agent.avatarUrl,
        assignedTickets: agent._count.assignedTickets,
        resolvedTickets: resolved?._count || 0,
        totalComments: agent._count.comments,
        avgResponseHours: Math.round(avgResponseTimes[agent.id] * 10) / 10,
      };
    });
  }

  async getHeatmap() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const heatmap: Record<string, number> = {};

    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        heatmap[`${d}-${h}`] = 0;
      }
    }

    for (const ticket of tickets) {
      const day = ticket.createdAt.getDay();
      const hour = ticket.createdAt.getHours();
      const key = `${day}-${hour}`;
      if (heatmap[key] !== undefined) heatmap[key]++;
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Object.entries(heatmap).map(([key, count]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day: dayNames[day], hour, count };
    });
  }

  async getSlaCompliance() {
    const total = await this.prisma.ticket.count({
      where: { slaDueAt: { not: null }, status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] } },
    });
    const breached = await this.prisma.ticket.count({
      where: { slaDueAt: { not: null }, slaBreached: true, status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] } },
    });
    return {
      totalSlaTickets: total,
      breachedCount: breached,
      compliantCount: total - breached,
      complianceRate: total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
    };
  }

  async exportCsv(userId?: string, role?: string) {
    const baseWhere = role === 'CUSTOMER' && userId ? { customerId: userId } : {};
    const tickets = await this.prisma.ticket.findMany({
      where: baseWhere,
      include: { customer: { select: { name: true, email: true } }, assignedTo: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'ID,Title,Status,Priority,Customer,Assigned To,Category,Created,Resolved\n';
    const rows = tickets.map((t) =>
      `"${t.id}","${t.title.replace(/"/g, '""')}","${t.status}","${t.priority}","${t.customer?.name || ''}","${t.assignedTo?.name || ''}","${t.category?.name || ''}","${t.createdAt.toISOString()}","${t.resolvedAt?.toISOString() || ''}"`
    ).join('\n');

    return { csv: header + rows, filename: `tickets-export-${new Date().toISOString().split('T')[0]}.csv` };
  }
}
