import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { ProductService } from '../application/services/product.service';
import { Injectable } from '@nestjs/common';

@Resolver('Product')
@Injectable()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => [Object], { name: 'products' })
  async products(
    @Args('skip', { type: () => Number, nullable: true }) skip = 0,
    @Args('take', { type: () => Number, nullable: true }) take = 20,
    @Args('lang', { type: () => String, nullable: true }) lang?: string,
  ) {
    // Note: We do not have tenant context in GraphQL queries here — expect single-tenant or use env TENANT_ID
    const tenantId = process.env.TENANT_ID || 'default';
    const res = await this.productService.listProducts(tenantId, skip, take);
    if (lang) {
      // map translations if present
      return res.data.map((p) => ({ ...p }));
    }
    return res.data;
  }

  @Query(() => Object, { name: 'product' })
  async product(@Args('id') id: string, @Args('lang', { type: () => String, nullable: true }) lang?: string) {
    const tenantId = process.env.TENANT_ID || 'default';
    return this.productService.getProduct(tenantId, id);
  }

  @Mutation(() => Boolean)
  async createProduct(@Args('input', { type: () => Object }) input: any) {
    const tenantId = process.env.TENANT_ID || 'default';
    await this.productService.createProduct(tenantId, input);
    return true;
  }
}
