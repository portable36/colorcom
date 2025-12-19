import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async productSummary(tenantId: string) {
    const total = await this.prisma.product.count({ where: { tenantId } });
    const featured = await this.prisma.product.count({ where: { tenantId, featured: true } });
    const trending = await this.prisma.product.count({ where: { tenantId, trending: true } });
    const avgPriceAgg = await this.prisma.product.aggregate({ where: { tenantId }, _avg: { price: true } });

    // top categories
    const raw = await this.prisma.$queryRawUnsafe(`
      SELECT category, COUNT(*) as cnt FROM "Product" WHERE "tenantId" = $1 GROUP BY category ORDER BY cnt DESC LIMIT 5
    `, tenantId);

    return {
      total,
      featured,
      trending,
      avgPrice: avgPriceAgg._avg?.price || 0,
      topCategories: raw,
    };
  }
}
