import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';

@Injectable()
export class ProductService{
    constructor (private prisma: PrismaService) {}
    
    async createProduct(data: CreateProductDto){
        return this.prisma.product.create({
            data,
        });
    }

    async getProductById(id: number){
        return this.prisma.product.findUnique({
            where: { id },
    });
    }

    async getAllProducts(){
        return this.prisma.product.findMany();
    }

    async updateProduct(id: number, data: UpdateProductDto){
        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    async deleteProduct(id: number){
        return this.prisma.product.delete({
            where: { id },
        });
    }
}
