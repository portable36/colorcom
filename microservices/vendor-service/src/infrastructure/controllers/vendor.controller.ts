import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VendorService } from '../../application/services/vendor.service';
import { CreateVendorDto } from '../../domain/dto/create-vendor.dto';
import { UpdateVendorDto } from '../../domain/dto/update-vendor.dto';
import { StoreSettingDto } from '../../domain/dto/store-setting.dto';
import { CommissionRuleDto } from '../../domain/dto/commission-rule.dto';
import { PayoutConfigDto } from '../../domain/dto/payout-config.dto';

@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'ok',
      service: 'vendor-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('featured')
  @HttpCode(HttpStatus.OK)
  async getFeaturedVendors(@Query('limit') limit: string = '10') {
    const vendors = await this.vendorService.getFeaturedVendors(parseInt(limit));
    return vendors;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createVendor(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.createVendor(createVendorDto);
  }

  @Post('onboard')
  @HttpCode(HttpStatus.CREATED)
  async onboardVendor(@Body() body: { vendor: CreateVendorDto; settings?: StoreSettingDto; payout?: PayoutConfigDto }) {
    return this.vendorService.onboardVendor(body.vendor, body.settings, body.payout);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listVendors(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '20',
    @Query('status') status?: string,
  ) {
    return this.vendorService.listVendors(parseInt(skip), parseInt(take), status);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getVendor(@Param('id') id: string) {
    return this.vendorService.getVendor(id);
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  async getVendorBySlug(@Param('slug') slug: string) {
    return this.vendorService.getVendorBySlug(slug);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateVendor(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorService.updateVendor(id, updateVendorDto);
  }

  // Store settings
  @Get(':id/settings')
  async getSettings(@Param('id') id: string) {
    return this.vendorService.getStoreSettings(id);
  }

  @Put(':id/settings')
  async updateSettings(@Param('id') id: string, @Body() input: StoreSettingDto) {
    return this.vendorService.updateStoreSettings(id, input);
  }

  // Commission rules
  @Get(':id/commissions')
  async listCommissions(@Param('id') id: string) {
    return this.vendorService.listCommissionRules(id);
  }

  @Post(':id/commissions')
  async createCommission(@Param('id') id: string, @Body() input: CommissionRuleDto) {
    return this.vendorService.createCommissionRule(id, input);
  }

  @Put('commissions/:ruleId')
  async updateCommission(@Param('ruleId') ruleId: string, @Body() input: Partial<CommissionRuleDto>) {
    return this.vendorService.updateCommissionRule(ruleId, input as any);
  }

  @Delete('commissions/:ruleId')
  async deleteCommission(@Param('ruleId') ruleId: string) {
    return this.vendorService.deleteCommissionRule(ruleId);
  }

  // Payout config
  @Get(':id/payout')
  async getPayout(@Param('id') id: string) {
    return this.vendorService.getPayoutConfig(id);
  }

  @Put(':id/payout')
  async updatePayout(@Param('id') id: string, @Body() input: PayoutConfigDto) {
    return this.vendorService.updatePayoutConfig(id, input);
  }

  // Analytics
  @Post(':id/analytics')
  async recordAnalytics(@Param('id') id: string, @Body() payload: any) {
    return this.vendorService.recordAnalytics(id, payload);
  }

  @Get(':id/analytics')
  async getAnalytics(@Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.vendorService.getAnalytics(id, fromDate, toDate);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVendor(@Param('id') id: string) {
    return this.vendorService.deleteVendor(id);
  }

  @Put(':id/rating')
  @HttpCode(HttpStatus.OK)
  async updateRating(
    @Param('id') id: string,
    @Body() body: { rating: number; reviewCount: number },
  ) {
    return this.vendorService.updateVendorRating(id, body.rating, body.reviewCount);
  }

  @Put(':id/products/increment')
  @HttpCode(HttpStatus.OK)
  async incrementProductCount(@Param('id') id: string) {
    return this.vendorService.incrementProductCount(id);
  }

  @Put(':id/products/decrement')
  @HttpCode(HttpStatus.OK)
  async decrementProductCount(@Param('id') id: string) {
    return this.vendorService.decrementProductCount(id);
  }
}
