import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Very lightweight recommendation: find products in same category ordered by rating.
   */
  async recommendForProduct(tenantId: string, productId: string, take = 10) {
    const prod = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!prod) return [];

    const recs = await this.prisma.product.findMany({
      where: {
        tenantId,
        category: prod.category,
        id: { not: productId },
        status: 'ACTIVE',
      },
      take,
      orderBy: { rating: 'desc' },
    });

    return recs;
  }
}
