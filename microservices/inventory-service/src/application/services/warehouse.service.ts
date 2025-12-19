import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { KafkaService } from '../../infrastructure/database/kafka.service';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(private prisma: PrismaService, private kafkaService: KafkaService) {}

  async createWarehouse(tenantId: string, name: string, location?: string) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { tenantId, name },
    });

    if (existing) {
      throw new BadRequestException(`Warehouse ${name} already exists`);
    }

    const wh = await this.prisma.warehouse.create({
      data: { tenantId, name, location, isActive: true },
    });

    this.logger.log(`Warehouse created: ${wh.id} (${name}) for tenant ${tenantId}`);
    return wh;
  }

  async listWarehouses(tenantId: string) {
    return this.prisma.warehouse.findMany({ where: { tenantId, isActive: true }, include: { stocks: true } });
  }

  async getWarehouse(tenantId: string, warehouseId: string) {
    const wh = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, tenantId },
      include: { stocks: true },
    });

    if (!wh) throw new NotFoundException('Warehouse not found');
    return wh;
  }

  async updateWarehouse(tenantId: string, warehouseId: string, data: any) {
    const wh = await this.getWarehouse(tenantId, warehouseId);
    return this.prisma.warehouse.update({
      where: { id: warehouseId },
      data,
      include: { stocks: true },
    });
  }

  async deleteWarehouse(tenantId: string, warehouseId: string) {
    await this.getWarehouse(tenantId, warehouseId);
    return this.prisma.warehouse.delete({ where: { id: warehouseId } });
  }
}
