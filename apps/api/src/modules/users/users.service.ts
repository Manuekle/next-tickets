import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

const userSelect = {
  id: true, email: true, name: true, role: true, avatarUrl: true,
  isActive: true, emailVerified: true, createdAt: true, updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const { page, limit, role, isActive, q } = query;
    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        select: userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name, role: dto.role },
      select: userSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }
    delete data.password;
    return this.prisma.user.update({ where: { id }, data, select: userSelect });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}
