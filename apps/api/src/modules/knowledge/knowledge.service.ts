import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { QueryKnowledgeDto } from './dto/query-knowledge.dto';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryKnowledgeDto) {
    const where: any = {};
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { content: { contains: query.q, mode: 'insensitive' } },
        { excerpt: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.published !== undefined) where.published = query.published;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const orderBy: any = {};
    orderBy[query.sortBy || 'createdAt'] = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where, skip, take: limit, orderBy,
        include: { category: { select: { id: true, name: true, slug: true } }, author: { select: { id: true, name: true } } },
      }),
      this.prisma.knowledgeArticle.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
      include: { category: true, author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { slug },
      include: { category: true, author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    if (!article || !article.published) throw new NotFoundException('Article not found');
    return article;
  }

  async create(dto: CreateKnowledgeDto, authorId: string) {
    const article = await this.prisma.knowledgeArticle.create({
      data: { ...dto, authorId },
    });
    return article;
  }

  async update(id: string, dto: UpdateKnowledgeDto) {
    return this.prisma.knowledgeArticle.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.knowledgeArticle.delete({ where: { id } });
  }

  async markHelpful(id: string) {
    await this.prisma.knowledgeArticle.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });
  }

  async markNotHelpful(id: string) {
    await this.prisma.knowledgeArticle.update({
      where: { id },
      data: { notHelpfulCount: { increment: 1 } },
    });
  }

  async getCategories() {
    const grouped = await this.prisma.knowledgeArticle.groupBy({
      by: ['categoryId'],
      where: { published: true, categoryId: { not: null } },
      _count: { _all: true },
    });
    const countMap = new Map(grouped.map((g) => [g.categoryId, g._count._all]));
    const categories = await this.prisma.category.findMany({
      where: { id: { in: [...countMap.keys()].filter(Boolean) as string[] } },
      select: { id: true, name: true, slug: true, color: true },
    });
    return categories.map((cat) => ({ ...cat, _count: { articles: countMap.get(cat.id) ?? 0 } }));
  }
}
