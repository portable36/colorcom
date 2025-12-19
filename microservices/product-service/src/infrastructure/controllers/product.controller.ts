import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UploadedFile, UseInterceptors, Res, Header } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csv from 'fast-csv';
import { Response } from 'express';
import { ProductService } from '../../application/services/product.service';
import { CreateProductDto } from '../../domain/dto/create-product.dto';
import { UpdateProductDto } from '../../domain/dto/update-product.dto';
import { SearchProductsDto } from '../../domain/dto/search-products.dto';
import { CreateVariantDto, UpdateVariantDto } from '../../domain/dto/variant.dto';
import { RecommendationService } from '../../application/services/recommendation.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly recommendationService: RecommendationService,
  ) {}

  // RecommendationService is injected by the module provider when present
  // (we'll access it via the productService container if needed)

  @Get('health')
  health() {
    return { status: 'ok', service: 'product-service', timestamp: new Date().toISOString() };
  }

  @Get('featured')
  async getFeaturedProducts(@Query('take') take?: string, @Request() req?: any) {
    const tenantId = req.headers['x-tenant-id'];
    const lang = req.query?.lang as string | undefined;
    return this.productService.getFeaturedProducts(tenantId, parseInt(take || '10'));
  }

  @Get('trending')
  async getTrendingProducts(@Query('take') take?: string, @Request() req?: any) {
    const tenantId = req.headers['x-tenant-id'];
    const lang = req.query?.lang as string | undefined;
    return this.productService.getTrendingProducts(tenantId, parseInt(take || '10'));
  }

  @Post('search')
  async searchProducts(@Body() searchDto: SearchProductsDto, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.searchProducts(tenantId, searchDto);
  }

  @Get('suggest')
  async suggest(@Query('q') q: string, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.suggest(tenantId, q);
  }

  @Post('reindex')
  async reindex(@Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.reindex(tenantId);
  }

  @Post()
  async create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.createProduct(tenantId, createProductDto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: any, @Body() body: any, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];

    // If JSON array posted directly
    if (body && Array.isArray(body)) {
      return this.productService.bulkImport(tenantId, body as CreateProductDto[]);
    }

    // If CSV uploaded
    if (!file) {
      return { error: 'No file uploaded' };
    }

    const items: CreateProductDto[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = csv.parseString(file.buffer.toString(), { headers: true })
        .on('error', (err) => reject(err))
        .on('data', (row) => {
          // normalize tags and attributes
          if (row.tags && typeof row.tags === 'string') {
            row.tags = row.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          if (row.attributes && typeof row.attributes === 'string') {
            try { row.attributes = JSON.parse(row.attributes); } catch (e) { /* ignore */ }
          }
          items.push(row as any);
        })
        .on('end', () => resolve());
    });

    return this.productService.bulkImport(tenantId, items);
  }

  @Get()
  async listProducts(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Request() req?: any,
  ) {
    const tenantId = req.headers['x-tenant-id'];
    const lang = req.query?.lang as string | undefined;
    return this.productService.listProducts(tenantId, parseInt(skip || '0'), parseInt(take || '20'), {
      category,
      status,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    }, lang);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    const lang = req.query?.lang as string | undefined;
    return this.productService.getProduct(tenantId, id, lang);
  }

  @Get(':id/recommendations')
  async recommendations(@Param('id') id: string, @Query('take') take?: string, @Request() req?: any) {
    const tenantId = req.headers['x-tenant-id'];
    const t = parseInt(take || '10');
    return this.recommendationService.recommendForProduct(tenantId, id, t);
  }

  @Get('export')
  async exportProducts(@Query('format') format?: string, @Res() res?: Response, @Request() req?: any) {
    const tenantId = req.headers['x-tenant-id'];
    const data = await this.productService.exportAll(tenantId);

    if ((format || '').toLowerCase() === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="products_${tenantId}.csv"`);
      const ws = csv.format({ headers: true });
      ws.pipe(res as any);
      for (const p of data) {
        ws.write(p as any);
      }
      ws.end();
      return;
    }

    // default JSON
    return { data };
  }

  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.updateProduct(tenantId, id, updateProductDto);
  }

  @Put(':id/stock')
  async updateStock(@Param('id') id: string, @Body('quantity') quantity: number, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.updateStock(tenantId, id, quantity);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    await this.productService.deleteProduct(tenantId, id);
    return { message: 'Product deleted successfully' };
  }

  // Variant endpoints
  @Get(':productId/variants')
  async listVariants(@Param('productId') productId: string, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.listVariants(tenantId, productId);
  }

  @Post(':productId/variants')
  async createVariant(
    @Param('productId') productId: string,
    @Body() createVariantDto: CreateVariantDto,
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.createVariant(tenantId, productId, createVariantDto);
  }

  @Get(':productId/variants/:variantId')
  async getVariant(@Param('productId') productId: string, @Param('variantId') variantId: string, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.getVariant(tenantId, productId, variantId);
  }

  @Put(':productId/variants/:variantId')
  async updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() updateVariantDto: UpdateVariantDto,
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'];
    return this.productService.updateVariant(tenantId, productId, variantId, updateVariantDto);
  }

  @Delete(':productId/variants/:variantId')
  async deleteVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'];
    await this.productService.deleteVariant(tenantId, productId, variantId);
    return { message: 'Variant deleted successfully' };
  }
}
