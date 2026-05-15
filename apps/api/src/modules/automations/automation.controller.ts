import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { CreateAutomationSchema } from './dto/create-automation.dto';
import { UpdateAutomationSchema } from './dto/update-automation.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { z } from 'zod';

const QueryAutomationsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  isActive: z.coerce.boolean().optional(),
  trigger: z.string().optional(),
});

@Controller('automations')
export class AutomationController {
  constructor(private automationService: AutomationService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query(new ZodValidationPipe(QueryAutomationsSchema)) query: any) {
    return this.automationService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findById(@Param('id') id: string) {
    return this.automationService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body(new ZodValidationPipe(CreateAutomationSchema)) dto: any) {
    return this.automationService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateAutomationSchema)) dto: any) {
    return this.automationService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.automationService.remove(id);
  }
}
