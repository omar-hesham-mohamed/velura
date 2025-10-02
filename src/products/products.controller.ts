import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
  import { ProductService } from './products.service';
  import { CreateProductDto } from './dto/create-product.dto';
  import { UpdateProductDto } from './dto/update-product.dto';
  
  @Controller('products')
  export class ProductsController {
    constructor(private readonly ProductService: ProductService) {}
  
    @Post()
    create(@Body() createProductDto: CreateProductDto) {
      return this.ProductService.createProduct(createProductDto);
    }
  
    @Get()
    findAll() {
      return this.ProductService.getAllProducts();
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.ProductService.getProductById(+id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
      return this.ProductService.updateProduct(+id, updateProductDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.ProductService.deleteProduct(+id);
    }
  }
  