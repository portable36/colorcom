import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { KafkaService } from '../../infrastructure/database/kafka.service';

@Injectable()
export class StockLevelService {
  private readonly logger = new Logger(StockLevelService.name);

  constructor(private prisma: PrismaService, private kafkaService: KafkaService) {}

  /**
   * Get stock level for a product across all warehouses or specific warehouse
   */
  async getStockLevel(tenantId: string, productId: string, warehouseId?: string) {
    const where: any = { tenantId, productId };
    if (warehouseId) where.warehouseId = warehouseId;

    const stocks = await this.prisma.warehouseStock.findMany({ where });

    if (warehouseId && !stocks.length) {
      throw new NotFoundException('Stock not found for warehouse and product');
    }

    if (warehouseId) {
      return stocks[0];
    }

    // Aggregate across all warehouses
    const total = stocks.reduce(
      (acc, s) => ({
        available: acc.available + s.available,
        reserved: acc.reserved + s.reserved,
        damaged: acc.damaged + s.damaged,
        quantity: acc.quantity + s.quantity,
      }),
      { available: 0, reserved: 0, damaged: 0, quantity: 0 }
    );

    return { productId, tenantId, ...total, warehouses: stocks };
  }

  /**
   * Update stock in a warehouse (add/remove quantity)
   */
  async updateStock(tenantId: string, productId: string, warehouseId: string, deltaQuantity: number) {
    const wh = await this.prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId } });
    if (!wh) throw new NotFoundException('Warehouse not found');

    let stock = await this.prisma.warehouseStock.findFirst({
      where: { warehouseId, productId, tenantId },
    });

    if (!stock) {
      // Create new stock record
      stock = await this.prisma.warehouseStock.create({
        data: {
          warehouseId,
          productId,
          tenantId,
          quantity: Math.max(0, deltaQuantity),
          available: Math.max(0, deltaQuantity),
        },
      });
      this.logger.log(`Created stock record for ${productId} in warehouse ${warehouseId}`);
    } else {
      const newQuantity = Math.max(0, stock.quantity + deltaQuantity);
      const newAvailable = Math.max(0, stock.available + deltaQuantity);

      stock = await this.prisma.warehouseStock.update({
        where: { id: stock.id },
        data: { quantity: newQuantity, available: newAvailable },
      });

      this.logger.log(`Updated stock for ${productId}: ${stock.quantity} units in warehouse ${warehouseId}`);
    }

    // Check and create alert if low
    if (stock.available <= stock.reorderLevel) {
      await this.checkAndCreateAlert(tenantId, productId, warehouseId, stock.available);
    }

    // Publish event
    await this.kafkaService.publishEvent('inventory.stock_updated', {
      tenantId,
      productId,
      warehouseId,
      quantity: stock.quantity,
      available: stock.available,
      reserved: stock.reserved,
    });

    return stock;
  }

  /**
   * Mark units as damaged
   */
  async markDamaged(tenantId: string, productId: string, warehouseId: string, quantity: number) {
    const stock = await this.prisma.warehouseStock.findFirst({
      where: { warehouseId, productId, tenantId },
    });

    if (!stock) throw new NotFoundException('Stock not found');

    const toDamage = Math.min(stock.available, quantity);
    if (toDamage <= 0) throw new BadRequestException('No available units to damage');

    const updated = await this.prisma.warehouseStock.update({
      where: { id: stock.id },
      data: {
        available: { decrement: toDamage },
        damaged: { increment: toDamage },
      },
    });

    this.logger.log(`Marked ${toDamage} units as damaged for ${productId}`);
    await this.kafkaService.publishEvent('inventory.units_damaged', {
      tenantId,
      productId,
      warehouseId,
      damagedCount: toDamage,
    });

    return updated;
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(
    tenantId: string,
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number
  ) {
    const source = await this.prisma.warehouseStock.findFirst({
      where: { warehouseId: fromWarehouseId, productId, tenantId },
    });

    if (!source || source.available < quantity) {
      throw new BadRequestException('Insufficient stock to transfer');
    }

    const dest = await this.prisma.warehouseStock.findFirst({
      where: { warehouseId: toWarehouseId, productId, tenantId },
    });

    await this.prisma.$transaction([
      this.prisma.warehouseStock.update({
        where: { id: source.id },
        data: { available: { decrement: quantity }, quantity: { decrement: quantity } },
      }),
      this.prisma.warehouseStock.update({
        where: { id: dest?.id },
        data: {
          available: { increment: quantity },
          quantity: { increment: quantity },
        },
      }),
    ]);

    this.logger.log(`Transferred ${quantity} units of ${productId} from ${fromWarehouseId} to ${toWarehouseId}`);
    await this.kafkaService.publishEvent('inventory.transfer_completed', {
      tenantId,
      productId,
      fromWarehouse: fromWarehouseId,
      toWarehouse: toWarehouseId,
      quantity,
    });

    return { status: 'transferred', quantity };
  }

  private async checkAndCreateAlert(tenantId: string, productId: string, warehouseId: string, available: number) {
    const existing = await this.prisma.stockAlert.findFirst({
      where: {
        tenantId,
        productId,
        warehouseId,
        isResolved: false,
        alertType: 'LOW_STOCK',
      },
    });

    if (!existing && available === 0) {
      await this.prisma.stockAlert.create({
        data: {
          tenantId,
          productId,
          warehouseId,
          alertType: 'OUT_OF_STOCK',
          severity: 'critical',
          message: `Product ${productId} is out of stock in warehouse ${warehouseId}`,
        },
      });

      await this.kafkaService.publishEvent('inventory.out_of_stock', {
        tenantId,
        productId,
        warehouseId,
      });
    } else if (!existing && available > 0) {
      await this.prisma.stockAlert.create({
        data: {
          tenantId,
          productId,
          warehouseId,
          alertType: 'LOW_STOCK',
          severity: 'warning',
          message: `Product ${productId} low stock (${available} units) in warehouse ${warehouseId}`,
        },
      });

      await this.kafkaService.publishEvent('inventory.low_stock', {
        tenantId,
        productId,
        warehouseId,
        available,
      });
    }
  }
}
