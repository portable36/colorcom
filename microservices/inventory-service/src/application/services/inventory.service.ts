import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { KafkaService } from '../../infrastructure/database/kafka.service';

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService, private kafkaService: KafkaService) {}

  async onModuleInit() {
    // subscribe to order and payment related events
    await this.startKafkaConsumer();
  }

  private async startKafkaConsumer() {
    try {
      // kafka consumer setup — use kafkajs via the KafkaService producer/consumer pattern
      // We create a local consumer here to listen for order/payment lifecycle events
      // Note: keep errors non-fatal so service can start even if Kafka is temporarily unavailable
      const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
      const { Kafka } = await import('kafkajs');
      const kafka = new Kafka({ brokers, clientId: `inventory-consumer-${Date.now()}` });
      const consumer = kafka.consumer({ groupId: 'inventory-service' });

      await consumer.connect();
      await consumer.subscribe({ topic: 'order.created', fromBeginning: false });
      await consumer.subscribe({ topic: 'order.cancelled', fromBeginning: false });
      await consumer.subscribe({ topic: 'payment.failed', fromBeginning: false });

      this.logger.log('Kafka consumer subscribed to order.created, order.cancelled, payment.failed');

      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            const payload = message.value ? message.value.toString() : '{}';
            const data = JSON.parse(payload);
            this.logger.log(`Received ${topic} event for id=${data.id || data.orderId}`);

            if (topic === 'order.created') {
              if (data.items && Array.isArray(data.items)) {
                for (const item of data.items) {
                  await this.handleReserve(data.tenantId || 'default', item.productId, item.quantity, data.id);
                }
              }
            }

            if (topic === 'order.cancelled' || topic === 'payment.failed') {
              // release reserved stock
              if (data.items && Array.isArray(data.items)) {
                for (const item of data.items) {
                  await this.releaseStock(data.tenantId || 'default', item.productId, item.quantity, data.id);
                }
              }
            }
          } catch (err) {
              this.logger.error(`Failed to process ${topic} event: ${(err as any)?.message || String(err)}`);
          }
        },
      });
    } catch (err) {
      this.logger.error(`Kafka consumer error: ${(err as any)?.message || String(err)}`);
    }
  }

  private async handleReserve(tenantId: string, productId: string, quantity: number, orderId?: string) {
    // attempt to reserve: only increment reserved when available
    const item = await this.prisma.inventoryItem.findFirst({ where: { tenantId, productId } });
    if (!item) {
      this.logger.warn(`No inventory record for ${productId} tenant ${tenantId}`);
      await this.kafkaService.publishEvent('inventory.out_of_stock', { tenantId, productId, orderId });
      return;
    }

    const available = item.quantity - item.reserved;
    if (available < quantity) {
      this.logger.warn(`Insufficient stock for ${productId} (need ${quantity}, available ${available})`);
      await this.kafkaService.publishEvent('inventory.out_of_stock', { tenantId, productId, orderId, available });
      return;
    }

    // increment reserved atomically via updateMany where available >= quantity
    const updated = await this.prisma.$transaction(async (tx: any) => {
      // double-check condition and increment reserved
      const current = await tx.inventoryItem.findFirst({ where: { tenantId, productId } });
      if (!current) return null;
      if (current.quantity - current.reserved < quantity) return null;
      await tx.inventoryItem.updateMany({ where: { tenantId, productId }, data: { reserved: { increment: quantity } } });
      return tx.inventoryItem.findFirst({ where: { tenantId, productId } });
    });

    if (updated) {
      this.logger.log(`Reserved ${quantity} units of ${productId} for tenant ${tenantId}`);
      await this.kafkaService.publishEvent('inventory.reserved', { tenantId, productId, quantity, orderId });
    } else {
      this.logger.warn(`Race/availability prevented reservation of ${productId} for ${tenantId}`);
      await this.kafkaService.publishEvent('inventory.out_of_stock', { tenantId, productId, orderId });
    }
  }

  async reserveStock(tenantId: string, productId: string, quantity: number) {
    // public wrapper used by HTTP flows if needed
    return this.handleReserve(tenantId, productId, quantity);
  }

  async releaseStock(tenantId: string, productId: string, quantity: number, orderId?: string) {
    try {
      // decrement reserved safely (not below 0)
      const item = await this.prisma.inventoryItem.findFirst({ where: { tenantId, productId } });
      if (!item) return null;
      const toRelease = Math.min(item.reserved, quantity);
      if (toRelease <= 0) return item;

      const updated = await this.prisma.inventoryItem.update({
        where: { id: item.id },
        data: { reserved: { decrement: toRelease } },
      });
      this.logger.log(`Released ${toRelease} reserved units of ${productId} for tenant ${tenantId}`);
      await this.kafkaService.publishEvent('inventory.released', { tenantId, productId, quantity: toRelease, orderId });
      return updated;
    } catch (err) {
      this.logger.error(`Failed to release stock: ${(err as any)?.message || String(err)}`);
      return null;
    }
  }

  async confirmStock(tenantId: string, productId: string, quantity: number, orderId?: string) {
    // finalize reservation: remove reserved and decrement quantity
    try {
      const item = await this.prisma.inventoryItem.findFirst({ where: { tenantId, productId } });
      if (!item) return null;
      const toConfirm = Math.min(item.reserved, quantity);
      if (toConfirm <= 0) return item;

      const updated = await this.prisma.$transaction(async (tx: any) => {
        await tx.inventoryItem.updateMany({ where: { id: item.id }, data: { reserved: { decrement: toConfirm }, quantity: { decrement: toConfirm } } });
        return tx.inventoryItem.findFirst({ where: { id: item.id } });
      });
      this.logger.log(`Confirmed ${toConfirm} units of ${productId} for tenant ${tenantId}`);
      await this.kafkaService.publishEvent('inventory.updated', { tenantId, productId, quantity: -toConfirm, orderId });
      return updated;
    } catch (err) {
      this.logger.error(`Failed to confirm stock: ${(err as any)?.message || String(err)}`);
      return null;
    }
  }

  async getInventory(tenantId: string, productId: string) {
    return this.prisma.inventoryItem.findFirst({ where: { tenantId, productId } });
  }

  async listInventory(tenantId: string, limit = 50) {
    return this.prisma.inventoryItem.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' }, take: limit });
  }

  async addStock(tenantId: string, productId: string, quantity: number) {
    const existing = await this.prisma.inventoryItem.findFirst({ where: { tenantId, productId } });

    if (existing) {
      const updated = await this.prisma.inventoryItem.update({ where: { id: existing.id }, data: { quantity: { increment: quantity } } });
      await this.kafkaService.publishEvent('inventory.updated', { tenantId, productId, quantity });
      return updated;
    }

    const created = await this.prisma.inventoryItem.create({ data: { tenantId, productId, quantity, reserved: 0 } });
    await this.kafkaService.publishEvent('inventory.created', { tenantId, productId, quantity });
    return created;
  }
}
