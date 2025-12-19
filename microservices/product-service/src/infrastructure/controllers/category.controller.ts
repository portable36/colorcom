import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProductService } from '../../application/services/product.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../domain/dto/category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async list(@Body() body: any) {
    return this.productService.listCategories(body?.tenantId);
  }

  @Post()
  async create(@Body() input: CreateCategoryDto) {
    return this.productService.createCategory(input as any);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.productService.getCategory(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() input: UpdateCategoryDto) {
    return this.productService.updateCategory(id, input as any);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productService.deleteCategory(id);
  }
}
