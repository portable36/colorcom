import { Controller, Get, Post, Put, Body, Param, Query, Headers, HttpCode } from '@nestjs/common';
import { OrderService } from '../../application/services/order.service';
import { CreateOrderDto } from '../../domain/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../domain/dto/update-order-status.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'order-service',
      timestamp: new Date(),
    };
  }

  @Post()
  @HttpCode(201)
  async createOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Req() req: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    console.log('Received createOrder:', { tenantId, userId, body: createOrderDto });

    // Basic header validation
    if (!tenantId) {
      throw new (require('@nestjs/common').BadRequestException)('Missing x-tenant-id header');
    }

    // Ensure cartItems is present and non-empty (ValidationPipe handles types but extra safety helps)
    if (!createOrderDto || !Array.isArray(createOrderDto.cartItems) || createOrderDto.cartItems.length === 0) {
      throw new (require('@nestjs/common').BadRequestException)('cartItems is required and must contain at least one item');
    }

    // Access the raw parsed body to preserve unvalidated fields like options
    const rawBody = req && req.body ? req.body : null;

    // Sanitize and apply sensible defaults; ensure we preserve item-level options from the raw body when present
    const sanitized = {
      ...createOrderDto,
      cartItems: createOrderDto.cartItems.map((i: any, idx: number) => ({
        productId: i.productId,
        vendorId: i.vendorId || 'vendor-unknown',
        name: i.name || `product-${i.productId}`,
        price: typeof i.price === 'number' && !Number.isNaN(i.price) ? i.price : 0,
        quantity: i.quantity && i.quantity > 0 ? i.quantity : 1,
        metadata: (rawBody && rawBody.cartItems && rawBody.cartItems[idx] && rawBody.cartItems[idx].options) || i.options || undefined,
      })),
      shippingAddress: createOrderDto.shippingAddress || null,
    };

    console.log('Sanitized createOrder:', sanitized);

    return this.orderService.createOrder(tenantId, userId || 'guest', sanitized as CreateOrderDto);
  }

  @Get()
  async listOrders(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.orderService.listOrders(
      tenantId,
      userId,
      limit ? parseInt(limit) : 10,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get(':id')
  async getOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') orderId: string,
  ) {
    return this.orderService.getOrder(tenantId, orderId);
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') orderId: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(tenantId, orderId, updateDto);
  }
}
