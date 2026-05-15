import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listUsers(query: { page?: number; limit?: number; role?: string; isActive?: string; q?: string }) {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true, emailVerified: true, createdAt: true, updatedAt: true,
          _count: { select: { createdTickets: true, assignedTickets: true, comments: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true, emailVerified: true, createdAt: true, updatedAt: true,
        _count: { select: { createdTickets: true, assignedTickets: true, comments: true, sessions: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(dto: { email: string; password: string; name: string; role: Role }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name, role: dto.role, emailVerified: true },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
  }

  async updateUser(id: string, dto: { email?: string; name?: string; role?: Role; isActive?: boolean; password?: string }) {
    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
      delete data.password;
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
    });
  }

  async deleteUser(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'User deactivated' };
  }

  async getAuditLogs(query: { page?: number; limit?: number; userId?: string; action?: string; entity?: string }) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entity) where.entity = query.entity;

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSystemStats() {
    const [totalUsers, totalTickets, totalComments, totalAttachments, activeSessions, usersByRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ticket.count(),
      this.prisma.ticketComment.count(),
      this.prisma.attachment.count(),
      this.prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);

    return {
      totalUsers, totalTickets, totalComments, totalAttachments, activeSessions,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
    };
  }

  async logAction(params: { userId: string; action: string; entity: string; entityId: string; previous?: any; next?: any; ip?: string }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        previous: params.previous || undefined,
        next: params.next || undefined,
        ip: params.ip,
      },
    });
  }
}
