import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService{
    constructor (private prisma: PrismaService) {}
    
    async createProduct(data: CreateProductDto){
        return this.prisma.product.create({
            data,
        });
    }

    async getProductById(id: number){
        const product = await this.prisma.product.findUnique({
            where: { id },
        });
        
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        
        return product;
    }

    async getAllProducts(){
        return this.prisma.product.findMany();
    }

    async updateProduct(id: number, data: UpdateProductDto){
        // Check if product exists first
        await this.getProductById(id);
        
        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    async deleteProduct(id: number){
        // Check if product exists first
        await this.getProductById(id);
        
        return this.prisma.product.delete({
            where: { id },
        });
    }
}
