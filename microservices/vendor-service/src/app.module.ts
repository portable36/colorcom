import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './infrastructure/database/prisma.service';
import { VendorService } from './application/services/vendor.service';
import { VendorController } from './infrastructure/controllers/vendor.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [VendorController],
  providers: [PrismaService, VendorService],
})
export class AppModule {}
