import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './infrastructure/database/prisma.service';
import { KafkaService } from './infrastructure/database/kafka.service';
import { OrderService } from './application/services/order.service';
import { OrderController } from './infrastructure/controllers/order.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [OrderController],
  providers: [PrismaService, KafkaService, OrderService],
})
export class AppModule {}
