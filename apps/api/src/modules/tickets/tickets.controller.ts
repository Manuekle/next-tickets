import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketSchema } from './dto/create-ticket.dto';
import { UpdateTicketSchema } from './dto/update-ticket.dto';
import { QueryTicketsSchema } from './dto/query-tickets.dto';
import { AssignTicketSchema } from './dto/assign-ticket.dto';
import { UpdateStatusSchema } from './dto/update-status.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  findAll(@Query(new ZodValidationPipe(QueryTicketsSchema)) query: any, @CurrentUser() user: any) {
    return this.ticketsService.findAll(query, user);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketsService.findById(id, user);
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateTicketSchema)) dto: any, @CurrentUser('id') userId: string) {
    return this.ticketsService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateTicketSchema)) dto: any, @CurrentUser() user: any) {
    return this.ticketsService.update(id, dto, user);
  }

  @Post(':id/assign')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  assign(@Param('id') id: string, @Body(new ZodValidationPipe(AssignTicketSchema)) dto: any, @CurrentUser('id') userId: string) {
    return this.ticketsService.assign(id, dto, userId);
  }

  @Post(':id/status')
  @Roles(Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateStatusSchema)) dto: any, @CurrentUser() user: any) {
    return this.ticketsService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketsService.remove(id, user);
  }
}
