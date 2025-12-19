import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateVendorDto } from '../../domain/dto/create-vendor.dto';
import { UpdateVendorDto } from '../../domain/dto/update-vendor.dto';
import { Vendor } from '@prisma/client';
import { StoreSettingDto } from '../../domain/dto/store-setting.dto';
import { CommissionRuleDto } from '../../domain/dto/commission-rule.dto';
import { PayoutConfigDto } from '../../domain/dto/payout-config.dto';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createVendor(createVendorDto: CreateVendorDto): Promise<Vendor> {
    try {
      const existing = await this.prisma.vendor.findUnique({
        where: { slug: createVendorDto.slug },
      });

      if (existing) {
        throw new BadRequestException('Vendor with this slug already exists');
      }

      const emailExists = await this.prisma.vendor.findUnique({
        where: { email: createVendorDto.email },
      });

      if (emailExists) {
        throw new BadRequestException('Vendor with this email already exists');
      }

      const vendor = await this.prisma.vendor.create({
        data: createVendorDto as any,
      });

      this.logger.log(`Vendor created: ${vendor.id} (${vendor.name})`);
      return vendor;
    } catch (error: any) {
      this.logger.error(`Failed to create vendor: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  async getVendor(id: string): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async getVendorBySlug(slug: string): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { slug },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async listVendors(skip: number = 0, take: number = 20, status?: string): Promise<{ data: Vendor[]; total: number }> {
    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { data, total };
  }

  async getFeaturedVendors(limit: number = 10): Promise<Vendor[]> {
    return this.prisma.vendor.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ rating: 'desc' }, { productCount: 'desc' }],
      take: limit,
    });
  }

  async updateVendor(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.getVendor(id);

    if (updateVendorDto.slug && updateVendorDto.slug !== vendor.slug) {
      const slugExists = await this.prisma.vendor.findUnique({
        where: { slug: updateVendorDto.slug },
      });
      if (slugExists) {
        throw new BadRequestException('Vendor with this slug already exists');
      }
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: updateVendorDto as any,
    });

    this.logger.log(`Vendor updated: ${id}`);
    return updated;
  }

  // Onboarding helper: create vendor and default settings/payout
  async onboardVendor(createVendorDto: CreateVendorDto, initialSettings?: Partial<StoreSettingDto>, payout?: Partial<PayoutConfigDto>) {
    const vendor = await this.createVendor(createVendorDto);

    if (initialSettings) {
      await this.prisma.storeSetting.create({ data: { vendorId: vendor.id, ...initialSettings } as any });
    }

    if (payout) {
      await this.prisma.payoutConfig.create({ data: { vendorId: vendor.id, method: payout.method || 'bank_transfer', details: payout.details || {}, scheduleDays: payout.scheduleDays || 7, minPayout: payout.minPayout || 10, enabled: payout.enabled ?? true } as any });
    }

    return vendor;
  }

  // Store settings
  async getStoreSettings(vendorId: string) {
    return this.prisma.storeSetting.findFirst({ where: { vendorId } });
  }

  async updateStoreSettings(vendorId: string, input: StoreSettingDto) {
    const existing = await this.prisma.storeSetting.findFirst({ where: { vendorId } });
    if (existing) {
      return this.prisma.storeSetting.update({ where: { id: existing.id }, data: input as any });
    }
    return this.prisma.storeSetting.create({ data: { vendorId, ...(input as any) } });
  }

  // Commission rules
  async listCommissionRules(vendorId: string) {
    return this.prisma.commissionRule.findMany({ where: { vendorId }, orderBy: { createdAt: 'desc' } });
  }

  async createCommissionRule(vendorId: string, input: CommissionRuleDto) {
    return this.prisma.commissionRule.create({ data: { vendorId, ...input } as any });
  }

  async updateCommissionRule(id: string, input: Partial<CommissionRuleDto>) {
    return this.prisma.commissionRule.update({ where: { id }, data: input as any });
  }

  async deleteCommissionRule(id: string) {
    return this.prisma.commissionRule.delete({ where: { id } });
  }

  // Payout config
  async getPayoutConfig(vendorId: string) {
    return this.prisma.payoutConfig.findUnique({ where: { vendorId } });
  }

  async updatePayoutConfig(vendorId: string, input: PayoutConfigDto) {
    const existing = await this.prisma.payoutConfig.findUnique({ where: { vendorId } });
    if (existing) {
      return this.prisma.payoutConfig.update({ where: { vendorId }, data: input as any });
    }
    return this.prisma.payoutConfig.create({ data: { vendorId, ...(input as any) } });
  }

  // Vendor analytics - store metrics entries and query by range
  async recordAnalytics(vendorId: string, payload: { totalSales?: number; orders?: number; visitors?: number; conversionRate?: number; revenueByChannel?: any }) {
    return this.prisma.vendorAnalytics.create({ data: { vendorId, totalSales: payload.totalSales || 0, orders: payload.orders || 0, visitors: payload.visitors || 0, conversionRate: payload.conversionRate || 0, revenueByChannel: payload.revenueByChannel || {} } });
  }

  async getAnalytics(vendorId: string, from?: Date, to?: Date) {
    const where: any = { vendorId };
    if (from || to) where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
    return this.prisma.vendorAnalytics.findMany({ where, orderBy: { date: 'desc' } });
  }

  async deleteVendor(id: string): Promise<void> {
    await this.getVendor(id);
    await this.prisma.vendor.delete({ where: { id } });
    this.logger.log(`Vendor deleted: ${id}`);
  }

  async updateVendorRating(id: string, rating: number, reviewCount: number): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id },
      data: { rating, reviewCount },
    });
  }

  async incrementProductCount(id: string): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id },
      data: { productCount: { increment: 1 } },
    });
  }

  async decrementProductCount(id: string): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id },
      data: { productCount: { decrement: 1 } },
    });
  }
}
