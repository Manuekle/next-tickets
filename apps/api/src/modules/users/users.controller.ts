import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserSchema } from './dto/create-user.dto';
import { UpdateUserSchema } from './dto/update-user.dto';
import { QueryUsersSchema } from './dto/query-users.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.AGENT)
  findAll(@Query(new ZodValidationPipe(QueryUsersSchema)) query: any) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.AGENT)
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body(new ZodValidationPipe(CreateUserSchema)) dto: any) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateUserSchema)) dto: any) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
