import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './infrastructure/database/redis.service';
import { CartService } from './application/services/cart.service';
import { CartController } from './infrastructure/controllers/cart.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [CartController],
  providers: [RedisService, CartService],
})
export class AppModule {}
