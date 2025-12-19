import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ElasticsearchService } from '../../infrastructure/search/elasticsearch.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { WebhookService } from '../../infrastructure/webhooks/webhook.service';
import { CreateProductDto } from '../../domain/dto/create-product.dto';
import { UpdateProductDto } from '../../domain/dto/update-product.dto';
import { SearchProductsDto } from '../../domain/dto/search-products.dto';
import { CreateVariantDto, UpdateVariantDto } from '../../domain/dto/variant.dto';
import { Product } from '@prisma/client';

const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearch: ElasticsearchService,
    private readonly cache: CacheService,
    private readonly webhookService: WebhookService,
  ) {}

  /**
   * Create a new product (tenant-scoped)
   */
  async createProduct(tenantId: string, createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Validate unique SKU within tenant
      const existing = await this.prisma.product.findUnique({
        where: {
          tenantId_sku: {
            tenantId,
            sku: createProductDto.sku,
          },
        },
      });

      if (existing) {
        throw new BadRequestException(`Product with SKU ${createProductDto.sku} already exists in this store`);
      }

      // Helper slugify
      const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Resolve category
      let categoryId: string | undefined = (createProductDto as any).categoryId;
      if (!categoryId && createProductDto.category) {
        const slug = slugify(createProductDto.category);
        let cat = await this.prisma.category.findFirst({ where: { slug } });
        if (!cat) {
          cat = await this.prisma.category.create({ data: { name: createProductDto.category, slug } });
        }
        categoryId = cat.id;
      }

      // Create product in PostgreSQL
      const product = await this.prisma.product.create({
        data: {
          ...(createProductDto as any),
          tenantId,
          categoryId,
        } as any,
      });

      // Tags
      if (createProductDto.tags && createProductDto.tags.length) {
        for (const t of createProductDto.tags) {
          const slug = slugify(t);
          let tag = await this.prisma.tag.findFirst({ where: { slug } });
          if (!tag) tag = await this.prisma.tag.create({ data: { name: t, slug } });
          await this.prisma.productTag.create({ data: { productId: product.id, tagId: tag.id } }).catch(() => {});
        }
      }

      // Attributes
      if ((createProductDto as any).attributes && (createProductDto as any).attributes.length) {
        for (const a of (createProductDto as any).attributes) {
          const name = a.name || a.key;
          const slug = slugify(name);
          let attr = await this.prisma.attribute.findFirst({ where: { slug } });
          if (!attr) attr = await this.prisma.attribute.create({ data: { name, slug, dataType: a.dataType || 'string' } });
          await this.prisma.productAttribute.create({ data: { productId: product.id, attributeId: attr.id, value: a.value } }).catch(() => {});
        }
      }

      // Build the full product object with relations for return
      const full = await this.prisma.product.findUnique({
        where: { id: product.id },
        include: {
          categoryRef: true,
          productTags: { include: { tag: true } },
          attributes: { include: { attribute: true } },
          variants: true,
        },
      });

      // Invalidate caches
      await this.cache.deletePattern(`products:${tenantId}:list:*`);
      await this.cache.deletePattern(`products:${tenantId}:featured`);
      await this.cache.deletePattern(`products:${tenantId}:trending`);

      // Notify webhooks about the new product
      try {
        await this.webhookService.deliver('product.created', tenantId, full);
      } catch (e) {
        this.logger.warn('Webhook delivery failed for product.created: ' + (e as any)?.message);
      }

      this.logger.log(`Product created: ${product.id} for tenant: ${tenantId}`);
      return full as any;
    } catch (error: any) {
      this.logger.error(`Failed to create product: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   *const data = await this.prisma.product.findMany({ where: { tenantId }, include: { categoryRef: true, productTags: { include: { tag: true } }, attributes: { include: { attribute: true } } } });
    // map to export-friendly format
    return data.map((p: any) => ({
      ...p,
      category: p.categoryRef?.name || p.category,
      tags: p.productTags?.map((pt: any) => pt.tag.name) || p.tags,
      attributes: p.attributes?.map((a: any) => ({ name: a.attribute?.name, value: a.value })) || [],
    }))
   */
  async bulkImport(tenantId: string, items: CreateProductDto[]) {
    const results: { created: string[]; errors: any[] } = { created: [], errors: [] };

    for (const it of items) {
      try {
        // skip if SKU exists
        const existing = await this.prisma.product.findUnique({ where: { tenantId_sku: { tenantId, sku: (it as any).sku } } });
        if (existing) {
          results.errors.push({ sku: (it as any).sku, reason: 'SKU exists' });
          continue;
        }

        const created = await this.createProduct(tenantId, it as any);
        results.created.push((created as any).id);
      } catch (err) {
        results.errors.push({ item: it, reason: (err as any)?.message || 'unknown' });
      }
    }

    // invalidate lists after import
    await this.cache.deletePattern(`products:${tenantId}:list:*`);
    await this.cache.deletePattern(`products:${tenantId}:featured`);
    await this.cache.deletePattern(`products:${tenantId}:trending`);

    return results;
  }

  /**
   * Export all products for tenant
   */
  async exportAll(tenantId: string) {
    return this.prisma.product.findMany({ where: { tenantId } });
  }

  /*const data = await this.prisma.product.findMany({ where: { tenantId }, include: { categoryRef: true, productTags: { include: { tag: true } }, attributes: { include: { attribute: true } } } });
    // map to export-friendly format
    return data.map((p: any) => ({
      ...p,
      category: p.categoryRef?.name || p.category,
      tags: p.productTags?.map((pt: any) => pt.tag.name) || p.tags,
      attributes: p.attributes?.map((a: any) => ({ name: a.attribute?.name, value: a.value })) || [],
    })
   * Get product by ID (tenant-scoped) with caching
   */
  async getProduct(tenantId: string, productId: string, lang?: string): Promise<Product> {
    const cacheKey = `products:${tenantId}:${productId}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId, // Enforce tenant isolation
      },
      include: { translations: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If lang requested and translation exists, overlay
    let final = product as any;
    if (lang && product.translations && product.translations.length) {
      const t = product.translations.find((x) => x.lang === lang);
      if (t) {
        final = { ...product, name: t.name, description: t.description, longDescription: t.longDescription };
      }
    }

    // Cache the result
    await this.cache.set(cacheKey, final, CACHE_TTL);

    return final;
  }

  /**
   * List all products for a tenant with pagination and caching
   */
  async listProducts(
    tenantId: string,
    skip: number = 0,
    take: number = 20,
    filters?: { category?: string; status?: string; minPrice?: number; maxPrice?: number },
    lang?: string,
  ): Promise<{ data: Product[]; total: number }> {
    // Generate cache key from filters
    const filterKey = `${filters?.category || 'all'}:${filters?.status || 'ACTIVE'}:${filters?.minPrice || 'any'}:${filters?.maxPrice || 'any'}:${skip}:${take}`;
    const cacheKey = `products:${tenantId}:list:${filterKey}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: any = {
      tenantId,
      status: 'ACTIVE', // Default to active products
    };

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.minPrice !== undefined) {
      where.price = { gte: filters.minPrice };
    }
    if (filters?.maxPrice !== undefined) {
      where.price = { ...where.price, lte: filters.maxPrice };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        include: { translations: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // If lang provided, overlay translations
    const mapped = data.map((p: any) => {
      if (lang && p.translations && p.translations.length) {
        const t = p.translations.find((x: any) => x.lang === lang);
        if (t) return { ...p, name: t.name, description: t.description, longDescription: t.longDescription };
      }
      return p;
    });

    const result = { data: mapped, total };
    // Cache the result
    await this.cache.set(cacheKey, result, CACHE_TTL);

    return result;
  }

  /**
   * Search products using Elasticsearch (tenant-scoped)
   */
  async searchProducts(tenantId: string, searchDto: SearchProductsDto) {
    const results = await this.elasticsearch.search({
      ...searchDto,
      tenantId,
    });

    return results;
  }

  async suggest(tenantId: string, prefix: string) {
    return this.elasticsearch.suggest(tenantId, prefix);
  }

  async reindex(tenantId: string) {
    const products = await this.prisma.product.findMany({ where: { tenantId }, include: { categoryRef: true, productTags: { include: { tag: true } }, attributes: { include: { attribute: true } } } });
    for (const p of products) {
      await this.elasticsearch.indexProduct(p).catch((e) => this.logger.warn('Failed to index product during reindex: ' + (e as any)?.message));
    }
    return { reindexed: products.length };
  }

  /**
   * Update product (tenant-scoped)
   */
  async updateProduct(
    tenantId: string,
    productId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    // Verify product belongs to tenant
    const product = await this.getProduct(tenantId, productId);

    // Check SKU uniqueness if changing it
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.prisma.product.findUnique({
        where: {
          tenantId_sku: {
            tenantId,
            sku: updateProductDto.sku,
          },
        },
      });

      if (existing) {
        throw new BadRequestException(`Product with SKU ${updateProductDto.sku} already exists`);
      }
    }

    // Handle category changes
    if ((updateProductDto as any).category || (updateProductDto as any).categoryId) {
      const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let categoryId: string | undefined = (updateProductDto as any).categoryId;
      if (!categoryId && (updateProductDto as any).category) {
        const slug = slugify((updateProductDto as any).category);
        let cat = await this.prisma.category.findFirst({ where: { slug } });
        if (!cat) cat = await this.prisma.category.create({ data: { name: (updateProductDto as any).category, slug } });
        categoryId = cat.id;
      }
      (updateProductDto as any).categoryId = categoryId;
    }

    // Update in PostgreSQL
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: updateProductDto as any,
    });

    // Handle tags
    if ((updateProductDto as any).tags) {
      // remove existing
      await this.prisma.productTag.deleteMany({ where: { productId } });
      // upsert new
      const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      for (const t of (updateProductDto as any).tags) {
        const slug = slugify(t);
        let tag = await this.prisma.tag.findFirst({ where: { slug } });
        if (!tag) tag = await this.prisma.tag.create({ data: { name: t, slug } });
        await this.prisma.productTag.create({ data: { productId, tagId: tag.id } }).catch(() => {});
      }
    }

    // Handle attributes
    if ((updateProductDto as any).attributes) {
      await this.prisma.productAttribute.deleteMany({ where: { productId } });
      const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      for (const a of (updateProductDto as any).attributes) {
        const name = a.name || a.key;
        const slug = slugify(name);
        let attr = await this.prisma.attribute.findFirst({ where: { slug } });
        if (!attr) attr = await this.prisma.attribute.create({ data: { name, slug, dataType: a.dataType || 'string' } });
        await this.prisma.productAttribute.create({ data: { productId, attributeId: attr.id, value: a.value } }).catch(() => {});
      }
    }

    // Fetch full product with relations for re-index
    const full = await this.prisma.product.findUnique({ where: { id: productId }, include: { categoryRef: true, productTags: { include: { tag: true } }, attributes: { include: { attribute: true } } } });

    // Re-index in Elasticsearch
    await this.elasticsearch.updateProduct(full as any);

    // Invalidate cache for this product and all lists
    await this.cache.delete(`products:${tenantId}:${productId}`);
    await this.cache.deletePattern(`products:${tenantId}:list:*`);
    await this.cache.deletePattern(`products:${tenantId}:featured`);
    await this.cache.deletePattern(`products:${tenantId}:trending`);

    // Notify webhooks about the update
    try {
      await this.webhookService.deliver('product.updated', tenantId, full);
    } catch (e) {
      this.logger.warn('Webhook delivery failed for product.updated: ' + (e as any)?.message);
    }

    this.logger.log(`Product updated: ${productId}`);
    return full as any;
  }

  /**
   * Delete product (tenant-scoped)
   */
  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    // Verify product belongs to tenant
    await this.getProduct(tenantId, productId);

    // Delete from Elasticsearch
    await this.elasticsearch.deleteProduct(productId);

    // Delete from PostgreSQL (cascade will handle any relations)
    await this.prisma.product.delete({
      where: { id: productId },
    });

    // Invalidate cache
    await this.cache.delete(`products:${tenantId}:${productId}`);
    await this.cache.deletePattern(`products:${tenantId}:list:*`);
    await this.cache.deletePattern(`products:${tenantId}:featured`);
    await this.cache.deletePattern(`products:${tenantId}:trending`);

    // Notify webhooks about the delete
    try {
      await this.webhookService.deliver('product.deleted', tenantId, { id: productId });
    } catch (e) {
      this.logger.warn('Webhook delivery failed for product.deleted: ' + (e as any)?.message);
    }

    this.logger.log(`Product deleted: ${productId}`);
  }

  /**
   * Get featured products for tenant with caching
   */
  async getFeaturedProducts(tenantId: string, take: number = 10): Promise<Product[]> {
    const cacheKey = `products:${tenantId}:featured:${take}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        featured: true,
        status: 'ACTIVE',
      },
      take,
      orderBy: { rating: 'desc' },
    });

    // Cache the result
    await this.cache.set(cacheKey, products, CACHE_TTL);

    return products;
  }

  // Categories
  async createCategory(input: any) {
    return this.prisma.category.create({ data: input });
  }

  async listCategories(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  }

  async getCategory(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async updateCategory(id: string, input: any) {
    return this.prisma.category.update({ where: { id }, data: input });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  // Tags
  async createTag(input: any) {
    return this.prisma.tag.create({ data: input });
  }

  async listTags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async getTag(id: string) {
    return this.prisma.tag.findUnique({ where: { id } });
  }

  async updateTag(id: string, input: any) {
    return this.prisma.tag.update({ where: { id }, data: input });
  }

  async deleteTag(id: string) {
    return this.prisma.tag.delete({ where: { id } });
  }

  // Attributes
  async createAttribute(input: any) {
    return this.prisma.attribute.create({ data: input });
  }

  async listAttributes() {
    return this.prisma.attribute.findMany({ orderBy: { name: 'asc' } });
  }

  async getAttribute(id: string) {
    return this.prisma.attribute.findUnique({ where: { id } });
  }

  async updateAttribute(id: string, input: any) {
    return this.prisma.attribute.update({ where: { id }, data: input });
  }

  async deleteAttribute(id: string) {
    return this.prisma.attribute.delete({ where: { id } });
  }

  /**
   * Get trending products for tenant with caching
   */
  async getTrendingProducts(tenantId: string, take: number = 10): Promise<Product[]> {
    const cacheKey = `products:${tenantId}:trending:${take}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        trending: true,
        status: 'ACTIVE',
      },
      take,
      orderBy: { reviewCount: 'desc' },
    });

    // Cache the result
    await this.cache.set(cacheKey, products, CACHE_TTL);

    return products;
  }

  /**
   * Update product stock
   */
  async updateStock(tenantId: string, productId: string, quantity: number): Promise<Product> {
    const product = await this.getProduct(tenantId, productId);

    if (product.stock + quantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }

  /**
   * List variants for a product (tenant-scoped)
   */
  async listVariants(tenantId: string, productId: string) {
    // Verify product belongs to tenant
    await this.getProduct(tenantId, productId);

    return this.prisma.variant.findMany({
      where: { productId },
      include: { options: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new variant (tenant-scoped)
   */
  async createVariant(tenantId: string, productId: string, createVariantDto: CreateVariantDto) {
    // Verify product belongs to tenant
    await this.getProduct(tenantId, productId);

    // Validate unique SKU within product
    const existing = await this.prisma.variant.findUnique({
      where: {
        productId_sku: {
          productId,
          sku: createVariantDto.sku,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Variant with SKU ${createVariantDto.sku} already exists for this product`);
    }

    // Create variant with options
    const variant = await this.prisma.variant.create({
      data: {
        productId,
        sku: createVariantDto.sku,
        price: createVariantDto.price,
        costPrice: createVariantDto.costPrice,
        discountPrice: createVariantDto.discountPrice,
        stock: createVariantDto.stock || 0,
        images: createVariantDto.images || [],
        metadata: createVariantDto.metadata,
        options: {
          create: createVariantDto.options,
        },
      },
      include: { options: true },
    });

    this.logger.log(`Variant created: ${variant.id} for product: ${productId}`);
    return variant;
  }

  /**
   * Get a specific variant (tenant-scoped)
   */
  async getVariant(tenantId: string, productId: string, variantId: string) {
    // Verify product belongs to tenant
    await this.getProduct(tenantId, productId);

    const variant = await this.prisma.variant.findFirst({
      where: { id: variantId, productId },
      include: { options: true },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    return variant;
  }

  /**
   * Update a variant (tenant-scoped)
   */
  async updateVariant(tenantId: string, productId: string, variantId: string, updateVariantDto: UpdateVariantDto) {
    // Verify variant exists and belongs to tenant
    await this.getVariant(tenantId, productId, variantId);

    // Prepare update data
    const updateData: any = {};
    if (updateVariantDto.price !== undefined) updateData.price = updateVariantDto.price;
    if (updateVariantDto.costPrice !== undefined) updateData.costPrice = updateVariantDto.costPrice;
    if (updateVariantDto.discountPrice !== undefined) updateData.discountPrice = updateVariantDto.discountPrice;
    if (updateVariantDto.stock !== undefined) updateData.stock = updateVariantDto.stock;
    if (updateVariantDto.images !== undefined) updateData.images = updateVariantDto.images;
    if (updateVariantDto.metadata !== undefined) updateData.metadata = updateVariantDto.metadata;

    // Update variant options if provided
    if (updateVariantDto.options) {
      // Delete existing options for this variant
      await this.prisma.variantOption.deleteMany({ where: { variantId } });
      // Create new options
      updateData.options = {
        create: updateVariantDto.options,
      };
    }

    const updated = await this.prisma.variant.update({
      where: { id: variantId },
      data: updateData,
      include: { options: true },
    });

    this.logger.log(`Variant updated: ${variantId}`);
    return updated;
  }

  /**
   * Delete a variant (tenant-scoped)
   */
  async deleteVariant(tenantId: string, productId: string, variantId: string): Promise<void> {
    // Verify variant exists and belongs to tenant
    await this.getVariant(tenantId, productId, variantId);

    // Delete variant (cascade will delete options)
    await this.prisma.variant.delete({
      where: { id: variantId },
    });

    this.logger.log(`Variant deleted: ${variantId}`);
  }
}
