import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { InventoryService } from '../../application/services/inventory.service';
import { WarehouseService } from '../../application/services/warehouse.service';
import { StockLevelService } from '../../application/services/stock-level.service';
import { ReservationService } from '../../application/services/reservation.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private stockLevelService: StockLevelService,
    private reservationService: ReservationService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'inventory-service' };
  }

  // ===== LEGACY ENDPOINTS =====
  @Post('stock')
  async addStock(
    @Body() { tenantId, productId, quantity }: { tenantId: string; productId: string; quantity: number }
  ) {
    return this.inventoryService.addStock(tenantId, productId, quantity);
  }

  @Post('stock/confirm')
  async confirmStock(
    @Body() { tenantId, productId, quantity, orderId }: { tenantId: string; productId: string; quantity: number; orderId?: string }
  ) {
    return this.inventoryService.confirmStock(tenantId, productId, quantity, orderId);
  }

  @Post('stock/release')
  async releaseStock(
    @Body() { tenantId, productId, quantity, orderId }: { tenantId: string; productId: string; quantity: number; orderId?: string }
  ) {
    return this.inventoryService.releaseStock(tenantId, productId, quantity, orderId);
  }

  @Get('stock')
  async listInventory(@Query('tenantId') tenantId: string, @Query('limit') limit?: string) {
    return this.inventoryService.listInventory(tenantId, limit ? Number(limit) : 50);
  }

  @Get('stock/:productId')
  async getInventory(@Param('productId') productId: string, @Query('tenantId') tenantId: string) {
    return this.inventoryService.getInventory(tenantId, productId);
  }

  // ===== WAREHOUSE MANAGEMENT =====
  @Post('warehouses')
  async createWarehouse(
    @Body() { name, location }: { name: string; location?: string },
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.warehouseService.createWarehouse(tenantId, name, location);
  }

  @Get('warehouses')
  async listWarehouses(@Request() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.warehouseService.listWarehouses(tenantId);
  }

  @Get('warehouses/:warehouseId')
  async getWarehouse(@Param('warehouseId') warehouseId: string, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.warehouseService.getWarehouse(tenantId, warehouseId);
  }

  @Put('warehouses/:warehouseId')
  async updateWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.warehouseService.updateWarehouse(tenantId, warehouseId, data);
  }

  @Delete('warehouses/:warehouseId')
  async deleteWarehouse(@Param('warehouseId') warehouseId: string, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    await this.warehouseService.deleteWarehouse(tenantId, warehouseId);
    return { deleted: true };
  }

  // ===== STOCK LEVELS =====
  @Get('stock/levels/:productId')
  async getStockLevel(
    @Param('productId') productId: string,
    @Query('warehouseId') warehouseId?: string,
    @Request() req?: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.stockLevelService.getStockLevel(tenantId, productId, warehouseId);
  }

  @Post('stock/update')
  async updateStock(
    @Body() { productId, warehouseId, deltaQuantity }: { productId: string; warehouseId: string; deltaQuantity: number },
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.stockLevelService.updateStock(tenantId, productId, warehouseId, deltaQuantity);
  }

  @Post('stock/damage')
  async markDamaged(
    @Body() { productId, warehouseId, quantity }: { productId: string; warehouseId: string; quantity: number },
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.stockLevelService.markDamaged(tenantId, productId, warehouseId, quantity);
  }

  @Post('stock/transfer')
  async transferStock(
    @Body()
    {
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
    }: {
      productId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
    },
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.stockLevelService.transferStock(tenantId, productId, fromWarehouseId, toWarehouseId, quantity);
  }

  // ===== RESERVATIONS (CHECKOUT) =====
  @Post('reservations/reserve')
  async reserveForCheckout(
    @Body()
    {
      warehouseId,
      items,
      orderId,
    }: {
      warehouseId: string;
      items: Array<{ productId: string; quantity: number }>;
      orderId: string;
    },
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.reservationService.reserveFromWarehouse(tenantId, warehouseId, items, orderId);
  }

  @Post('reservations/release')
  async releaseReservation(
    @Body()
    {
      items,
      orderId,
    }: {
      items: Array<{ productId: string; quantity: number; warehouseId: string }>;
      orderId: string;
    },
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.reservationService.releaseReservation(tenantId, items, orderId);
  }

  @Post('reservations/confirm')
  async confirmReservation(
    @Body()
    {
      items,
      orderId,
    }: {
      items: Array<{ productId: string; quantity: number; warehouseId: string }>;
      orderId: string;
    },
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    return this.reservationService.confirmReservation(tenantId, items, orderId);
  }
}
