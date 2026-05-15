import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Users
  @Get('users')
  listUsers(@Query() query: any) { return this.adminService.listUsers(query); }

  @Get('users/:id')
  getUser(@Param('id') id: string) { return this.adminService.getUser(id); }

  @Post('users')
  createUser(@Body() dto: any) { return this.adminService.createUser(dto); }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @Roles(Role.SUPER_ADMIN)
  deleteUser(@Param('id') id: string) { return this.adminService.deleteUser(id); }

  // Audit Logs
  @Get('audit-logs')
  getAuditLogs(@Query() query: any) { return this.adminService.getAuditLogs(query); }

  // System Stats
  @Get('stats')
  getSystemStats() { return this.adminService.getSystemStats(); }
}
