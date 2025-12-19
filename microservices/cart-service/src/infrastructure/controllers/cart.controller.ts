import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { CartService } from '../../application/services/cart.service';
import { AddToCartDto } from '../../domain/dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../../domain/dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'ok',
      service: 'cart-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToCart(
    @Req() req: Request,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const userId = req.headers['x-user-id'] as string || 'guest';
    return this.cartService.addToCart(tenantId, userId, addToCartDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCart(@Req() req: Request) {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const userId = req.headers['x-user-id'] as string || 'guest';
    return this.cartService.getCart(tenantId, userId);
  }

  @Put(':productId')
  @HttpCode(HttpStatus.OK)
  async updateCartItem(
    @Req() req: Request,
    @Param('productId') productId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const userId = req.headers['x-user-id'] as string || 'guest';
    return this.cartService.updateCartItem(tenantId, userId, productId, updateDto);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromCart(
    @Req() req: Request,
    @Param('productId') productId: string,
  ) {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const userId = req.headers['x-user-id'] as string || 'guest';
    return this.cartService.removeFromCart(tenantId, userId, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@Req() req: Request) {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const userId = req.headers['x-user-id'] as string || 'guest';
    return this.cartService.clearCart(tenantId, userId);
  }
}

