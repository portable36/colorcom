import { Controller, Get, Request } from '@nestjs/common';
import { AnalyticsService } from '../../application/services/analytics.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('products/summary')
  async productSummary(@Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.analytics.productSummary(tenantId);
  }
}
