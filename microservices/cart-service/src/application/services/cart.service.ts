import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/database/redis.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly redisService: RedisService) {}

  private getCartKey(tenantId: string, userId: string): string {
    return `cart:${tenantId}:${userId}`;
  }

  async addToCart(tenantId: string, userId: string, addToCartDto: any): Promise<any> {
    try {
      const redis = this.redisService.getClient();
      const cartKey = this.getCartKey(tenantId, userId);
      const itemKey = addToCartDto.productId;
      const itemData = JSON.stringify({
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
        price: addToCartDto.price,
        name: addToCartDto.name,
        vendorId: addToCartDto.vendorId,
      });

      await redis.hSet(cartKey, itemKey, itemData);
      await redis.expire(cartKey, 86400 * 7); // 7 days expiry

      this.logger.log(`Added to cart: ${itemKey} for user ${userId}`);
      return { productId: addToCartDto.productId, quantity: addToCartDto.quantity };
    } catch (error: any) {
      this.logger.error(`Failed to add to cart: ${error?.message}`);
      throw error;
    }
  }

  async getCart(tenantId: string, userId: string): Promise<any> {
    try {
      const redis = this.redisService.getClient();
      const cartKey = this.getCartKey(tenantId, userId);
      const cartData = await redis.hGetAll(cartKey);

      if (!cartData || Object.keys(cartData).length === 0) {
        return { items: [], total: 0, count: 0 };
      }

      const items = Object.values(cartData).map((item: string) => JSON.parse(item));
      const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

      return {
        items,
        total: parseFloat(total.toFixed(2)),
        count: items.length,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get cart: ${error?.message}`);
      throw error;
    }
  }

  async updateCartItem(
    tenantId: string,
    userId: string,
    productId: string,
    updateDto: any,
  ): Promise<any> {
    try {
      const redis = this.redisService.getClient();
      const cartKey = this.getCartKey(tenantId, userId);
      const itemData = await redis.hGet(cartKey, productId);

      if (!itemData) {
        throw new Error('Item not in cart');
      }

      const item = JSON.parse(itemData);
      const updated = { ...item, ...updateDto };

      if (updated.quantity <= 0) {
        await redis.hDel(cartKey, productId);
        this.logger.log(`Removed from cart: ${productId}`);
        return null;
      }

      await redis.hSet(cartKey, productId, JSON.stringify(updated));
      this.logger.log(`Updated cart item: ${productId}`);
      return updated;
    } catch (error: any) {
      this.logger.error(`Failed to update cart item: ${error?.message}`);
      throw error;
    }
  }

  async removeFromCart(tenantId: string, userId: string, productId: string): Promise<void> {
    try {
      const redis = this.redisService.getClient();
      const cartKey = this.getCartKey(tenantId, userId);
      await redis.hDel(cartKey, productId);
      this.logger.log(`Removed from cart: ${productId}`);
    } catch (error: any) {
      this.logger.error(`Failed to remove from cart: ${error?.message}`);
      throw error;
    }
  }

  async clearCart(tenantId: string, userId: string): Promise<void> {
    try {
      const redis = this.redisService.getClient();
      const cartKey = this.getCartKey(tenantId, userId);
      await redis.del(cartKey);
      this.logger.log(`Cleared cart for user ${userId}`);
    } catch (error: any) {
      this.logger.error(`Failed to clear cart: ${error?.message}`);
      throw error;
    }
  }
}

