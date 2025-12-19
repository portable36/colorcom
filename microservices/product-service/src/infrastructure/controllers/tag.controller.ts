import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProductService } from '../../application/services/product.service';
import { CreateTagDto, UpdateTagDto } from '../../domain/dto/tag.dto';

@Controller('tags')
export class TagController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async list() {
    return this.productService.listTags();
  }

  @Post()
  async create(@Body() input: CreateTagDto) {
    return this.productService.createTag(input as any);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.productService.getTag(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() input: UpdateTagDto) {
    return this.productService.updateTag(id, input as any);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productService.deleteTag(id);
  }
}
