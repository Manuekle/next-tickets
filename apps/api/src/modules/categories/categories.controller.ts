import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategorySchema } from './dto/create-category.dto';
import { UpdateCategorySchema } from './dto/update-category.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body(new ZodValidationPipe(CreateCategorySchema)) dto: any) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateCategorySchema)) dto: any) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
