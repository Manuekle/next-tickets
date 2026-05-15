import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeSchema, CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeSchema, UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { QueryKnowledgeSchema, QueryKnowledgeDto } from './dto/query-knowledge.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @Get()
  @Public()
  findAll(@Query(new ZodValidationPipe(QueryKnowledgeSchema)) query: QueryKnowledgeDto) {
    return this.knowledgeService.findAll(query);
  }

  @Get('categories')
  @Public()
  getCategories() {
    return this.knowledgeService.getCategories();
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.knowledgeService.findBySlug(slug);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN)
  findById(@Param('id') id: string) {
    return this.knowledgeService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN)
  create(@Body(new ZodValidationPipe(CreateKnowledgeSchema)) dto: CreateKnowledgeDto, @CurrentUser('id') userId: string) {
    return this.knowledgeService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.AGENT, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateKnowledgeSchema)) dto: UpdateKnowledgeDto) {
    return this.knowledgeService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.knowledgeService.remove(id);
  }

  @Post(':id/helpful')
  @Public()
  markHelpful(@Param('id') id: string) {
    return this.knowledgeService.markHelpful(id);
  }

  @Post(':id/not-helpful')
  @Public()
  markNotHelpful(@Param('id') id: string) {
    return this.knowledgeService.markNotHelpful(id);
  }
}
