import { Module } from '@nestjs/common';
import { InventoryService } from './application/services/inventory.service';
import { WarehouseService } from './application/services/warehouse.service';
import { StockLevelService } from './application/services/stock-level.service';
import { ReservationService } from './application/services/reservation.service';
import { InventoryController } from './infrastructure/controllers/inventory.controller';
import { PrismaService } from './infrastructure/database/prisma.service';
import { KafkaService } from './infrastructure/database/kafka.service';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { InventoryMetricsService } from './infrastructure/metrics/inventory-metrics.service';

@Module({
  imports: [],
  providers: [InventoryService, WarehouseService, StockLevelService, ReservationService, PrismaService, KafkaService, InventoryMetricsService],
  controllers: [InventoryController, MetricsController],
})
export class AppModule {}
