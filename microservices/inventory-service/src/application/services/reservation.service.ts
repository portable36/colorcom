import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { KafkaService } from '../../infrastructure/database/kafka.service';
import { InventoryMetricsService } from '../../infrastructure/metrics/inventory-metrics.service';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private prisma: PrismaService,
    private kafkaService: KafkaService,
    private metrics: InventoryMetricsService,
  ) {}

  /**
   * Reserve stock from a warehouse during checkout
   */
  async reserveFromWarehouse(
    tenantId: string,
    warehouseId: string,
    items: Array<{ productId: string; quantity: number }>,
    orderId: string
  ) {
    const results: any = { reserved: [], failed: [] };

    for (const item of items) {
      const stock = await this.prisma.warehouseStock.findFirst({
        where: { warehouseId, productId: item.productId, tenantId },
      });

      if (!stock) {
        results.failed.push({ productId: item.productId, reason: 'Stock not found' });
        continue;
      }

      if (stock.available < item.quantity) {
        results.failed.push({
          productId: item.productId,
          requested: item.quantity,
          available: stock.available,
          reason: 'Insufficient stock',
        });
        continue;
      }

      // Reserve atomically
      const updated = await this.prisma.$transaction(async (tx: any) => {
        const current = await tx.warehouseStock.findFirst({
          where: { id: stock.id },
        });

        if (current.available < item.quantity) return null;

        return tx.warehouseStock.update({
          where: { id: stock.id },
          data: {
            available: { decrement: item.quantity },
            reserved: { increment: item.quantity },
          },
        });
      });

      if (updated) {
        results.reserved.push({
          productId: item.productId,
          quantity: item.quantity,
          warehouseId,
        });

        this.metrics.recordReservationSuccess(tenantId, warehouseId);
        this.metrics.recordStockUpdate(tenantId, warehouseId, 'reserve', item.quantity);
        this.metrics.setCurrentReserved(tenantId, warehouseId, item.productId, updated.reserved);
        this.metrics.setCurrentStock(tenantId, warehouseId, item.productId, updated.quantity);

        await this.kafkaService.publishEvent('inventory.reserved', {
          tenantId,
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
          orderId,
        });
      } else {
        this.metrics.recordReservationFailed(tenantId, warehouseId, 'insufficient_stock');
      }
    }

    results.failed.forEach((f: any) => {
      this.metrics.recordReservationFailed(tenantId, warehouseId, f.reason || 'unknown');
    });

    this.logger.log(`Reserved ${results.reserved.length} items for order ${orderId}`);
    return results;
  }

  /**
   * Release reserved stock (order cancelled / payment failed)
   */
  async releaseReservation(
    tenantId: string,
    items: Array<{ productId: string; quantity: number; warehouseId: string }>,
    orderId: string
  ) {
    const results: any = { released: [], failed: [] };

    for (const item of items) {
      const stock = await this.prisma.warehouseStock.findFirst({
        where: {
          warehouseId: item.warehouseId,
          productId: item.productId,
          tenantId,
        },
      });

      if (!stock) {
        results.failed.push({ productId: item.productId, reason: 'Stock not found' });
        continue;
      }

      const toRelease = Math.min(stock.reserved, item.quantity);
      if (toRelease <= 0) continue;

      const updated = await this.prisma.warehouseStock.update({
        where: { id: stock.id },
        data: {
          reserved: { decrement: toRelease },
          available: { increment: toRelease },
        },
      });

      results.released.push({
        productId: item.productId,
        quantity: toRelease,
        warehouseId: item.warehouseId,
      });

      this.metrics.recordReleaseSuccess(tenantId, item.warehouseId);
      this.metrics.recordStockUpdate(tenantId, item.warehouseId, 'release', toRelease);
      this.metrics.setCurrentReserved(tenantId, item.warehouseId, item.productId, updated.reserved);
      this.metrics.setCurrentStock(tenantId, item.warehouseId, item.productId, updated.quantity);

      await this.kafkaService.publishEvent('inventory.released', {
        tenantId,
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: toRelease,
        orderId,
      });
    }

    this.logger.log(`Released ${results.released.length} items for order ${orderId}`);
    return results;
  }

  /**
   * Confirm reservation (payment success) - move reserved to finalized (decrement from total)
   */
  async confirmReservation(
    tenantId: string,
    items: Array<{ productId: string; quantity: number; warehouseId: string }>,
    orderId: string
  ) {
    const results: any = { confirmed: [], failed: [] };

    for (const item of items) {
      const stock = await this.prisma.warehouseStock.findFirst({
        where: {
          warehouseId: item.warehouseId,
          productId: item.productId,
          tenantId,
        },
      });

      if (!stock) {
        results.failed.push({ productId: item.productId, reason: 'Stock not found' });
        continue;
      }

      const toConfirm = Math.min(stock.reserved, item.quantity);
      if (toConfirm <= 0) continue;

      const updated = await this.prisma.warehouseStock.update({
        where: { id: stock.id },
        data: {
          reserved: { decrement: toConfirm },
          quantity: { decrement: toConfirm },
        },
      });

      results.confirmed.push({
        productId: item.productId,
        quantity: toConfirm,
        warehouseId: item.warehouseId,
      });

      await this.kafkaService.publishEvent('inventory.confirmed', {
        tenantId,
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: toConfirm,
        orderId,
      });
    }

    this.logger.log(`Confirmed ${results.confirmed.length} items for order ${orderId}`);
    return results;
  }
}
