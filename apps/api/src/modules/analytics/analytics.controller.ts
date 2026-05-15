import { Controller, Get, Query, Res } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.analyticsService.getStats(user?.id, user?.role);
  }

  @Get('trends')
  getTrends(@Query('days') days?: string) {
    return this.analyticsService.getTrends(days ? parseInt(days) : 30);
  }

  @Get('agents')
  getAgentPerformance() {
    return this.analyticsService.getAgentPerformance();
  }

  @Get('heatmap')
  getHeatmap() {
    return this.analyticsService.getHeatmap();
  }

  @Get('sla')
  getSlaCompliance() {
    return this.analyticsService.getSlaCompliance();
  }

  @Get('export/csv')
  async exportCsv(@CurrentUser() user: any, @Res() res: Response) {
    const result = await this.analyticsService.exportCsv(user?.id, user?.role);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  }
}
