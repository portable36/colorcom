import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProductService } from '../../application/services/product.service';
import { CreateAttributeDto, UpdateAttributeDto } from '../../domain/dto/attribute.dto';

@Controller('attributes')
export class AttributeController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async list() {
    return this.productService.listAttributes();
  }

  @Post()
  async create(@Body() input: CreateAttributeDto) {
    return this.productService.createAttribute(input as any);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.productService.getAttribute(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() input: UpdateAttributeDto) {
    return this.productService.updateAttribute(id, input as any);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productService.deleteAttribute(id);
  }
}
