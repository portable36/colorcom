import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { KafkaService } from '../../infrastructure/database/kafka.service';
import { CreateOrderDto } from '../../domain/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../domain/dto/update-order-status.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  async createOrder(tenantId: string, userId: string, createOrderDto: CreateOrderDto) {
    try {
      // Calculate totals
      const cartTotal = createOrderDto.cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const taxAmount = createOrderDto.taxAmount || Math.round(cartTotal * 0.05 * 100) / 100;
      const shippingFee = createOrderDto.shippingFee || 5.0;
      const finalTotal = cartTotal + taxAmount + shippingFee;

      // Create order with items
      const order = await this.prisma.order.create({
        data: {
          tenantId,
          userId,
          cartTotal: Math.round(cartTotal * 100) / 100,
          taxAmount,
          shippingFee,
          finalTotal: Math.round(finalTotal * 100) / 100,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          metadata: {
            shippingAddress: createOrderDto.shippingAddress,
          },
          items: {
            createMany: {
              data: createOrderDto.cartItems.map((item) => ({
                productId: item.productId,
                vendorId: item.vendorId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: Math.round(item.price * item.quantity * 100) / 100,
              })),
            },
          },
        },
        include: {
          items: true,
        },
      });

      // Publish order created event
      await this.kafka.publishEvent('order.created', {
        orderId: order.id,
        tenantId: order.tenantId,
        userId: order.userId,
        totalAmount: order.finalTotal,
        items: order.items,
        timestamp: new Date(),
      });

      this.logger.log(`Order created: ${order.id} for user ${userId}`);
      return order;
    } catch (error: any) {
      this.logger.error(`Failed to create order: ${error?.message}`);
      throw error;
    }
  }

  async getOrder(tenantId: string, orderId: string) {
    try {
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          tenantId,
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      return order;
    } catch (error: any) {
      this.logger.error(`Failed to get order: ${error?.message}`);
      throw error;
    }
  }

  async listOrders(tenantId: string, userId?: string, limit = 10, offset = 0) {
    try {
      const where: any = { tenantId };
      if (userId) where.userId = userId;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            items: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        data: orders,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to list orders: ${error?.message}`);
      throw error;
    }
  }

  async updateOrderStatus(tenantId: string, orderId: string, updateDto: UpdateOrderStatusDto) {
    try {
      const order = await this.prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: updateDto.status,
          paymentStatus: updateDto.paymentStatus || undefined,
          metadata: updateDto.metadata || undefined,
        },
        include: {
          items: true,
        },
      });

      // Publish status update event
      const eventName =
        updateDto.status === 'PAID'
          ? 'order.paid'
          : updateDto.status === 'SHIPPED'
            ? 'order.shipped'
            : 'order.status_updated';

      await this.kafka.publishEvent(eventName, {
        orderId: order.id,
        tenantId: order.tenantId,
        userId: order.userId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        timestamp: new Date(),
      });

      this.logger.log(`Order ${orderId} status updated to ${updateDto.status}`);
      return order;
    } catch (error: any) {
      this.logger.error(`Failed to update order: ${error?.message}`);
      throw error;
    }
  }
}
