import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return this.prisma.category.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    const data: any = { ...dto };
    if (dto.name) {
      data.slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    const ticketCount = await this.prisma.ticket.count({ where: { categoryId: id } });
    if (ticketCount > 0) throw new ConflictException('Cannot delete category with existing tickets');
    await this.prisma.category.delete({ where: { id } });
  }
}
