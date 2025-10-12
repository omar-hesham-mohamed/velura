import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaymobService } from '../paymob/paymob.service';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService, private paymobService: PaymobService,) {}
    
    async create(data: CreateOrderDto) {
        // Calculate total amount based on items
        const products = await this.prisma.product.findMany({
          where: { id: { in: data.items.map((item) => item.productId) } },
        });
    
        let amount = 0;
        const orderItems = data.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) throw new Error(`Product with ID ${item.productId} not found`);
    
          const unitPrice = product.price;
          amount += unitPrice * item.quantity;
    
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
          };
        });
    
        const order = await this.prisma.order.create({
          data: {
            userId: data.userId,
            status: 'PENDING',
            totalAmount : amount,
            orderItems: {
                create: orderItems,
            },
          },
          include: {
            orderItems: true,
          },
        });

        const billingData = {
          first_name: 'Omar',
          last_name: 'Hesham',
          email: 'omar@example.com',
          phone_number: '01000000000',
          street: 'Test St.',
          city: 'Alexandria',
          country: 'EG',
        };

        const authToken = await this.paymobService.authenticate();
        const orderId = await this.paymobService.createOrder(authToken, amount * 100);
        const paymentKey = await this.paymobService.generatePaymentKey(
          authToken,
          orderId,
          amount * 100,
          billingData,
        );

        const paymentUrl = this.paymobService.getPaymentUrl(paymentKey);

        // Return both order info + Paymob payment URL
        return { order, paymentUrl };
      }

      async findAll() {
        return this.prisma.order.findMany({
          include: {
            orderItems: true,
          },
        });
      }

      async findOne(id: number) {
        return this.prisma.order.findUnique({
          where: { id },
          include: { orderItems: true },
        });
      }
    
      async update(id: number, data: UpdateOrderDto) {
        return this.prisma.order.update({
          where: { id },
          data,
          include: { orderItems: true },
        });
      }
    
      async remove(id: number) {
        return this.prisma.order.delete({ where: { id } });
      }
    
}