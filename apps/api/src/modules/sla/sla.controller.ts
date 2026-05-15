import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { SlaService } from './sla.service';
import { CreateSlaSchema } from './dto/create-sla.dto';
import { UpdateSlaSchema } from './dto/update-sla.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('sla')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class SlaController {
  constructor(private slaService: SlaService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('isActive') isActive?: string) {
    return this.slaService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('metrics')
  getMetrics() {
    return this.slaService.getSlaMetrics();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.slaService.findById(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateSlaSchema)) dto: any) {
    return this.slaService.create(dto);
  }

  @Post('check-breaches')
  checkBreaches() {
    return this.slaService.checkSlaBreaches();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateSlaSchema)) dto: any) {
    return this.slaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slaService.remove(id);
  }
}
