import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaymobService } from '../paymob/paymob.service';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private prisma: PrismaService, 
        private paymobService: PaymobService
    ) {}
    
    async create(data: CreateOrderDto) {
        this.logger.log(`Creating order for user ${data.userId} with ${data.items.length} items`);

        // Calculate total amount based on items
        const products = await this.prisma.product.findMany({
          where: { id: { in: data.items.map((item) => item.productId) } },
        });
    
        let amount = 0;
        const orderItems = data.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) throw new Error(`Product with ID ${item.productId} not found`);
    
          const unitPrice = product.price;
          amount += Number(unitPrice) * item.quantity;
    
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


        // Format billing data for PayMob
        const billingData = {
          apartment: 'NA',
          floor: 'NA',
          building: 'NA',
          shipping_method: 'PKG',
          postal_code: 'NA',
          state: 'NA',
          first_name: data.billingData.firstName,
          last_name: data.billingData.lastName,
          email: data.billingData.email,
          phone_number: data.billingData.phoneNumber,
          street: data.billingData.street || '',
          city: data.billingData.city || '',
          country: data.billingData.country || 'EG',
        };


        try {
          
          const authToken = await this.paymobService.authenticate();
          
          const paymobOrderId = await this.paymobService.createOrder(authToken, amount * 100);
          
          const paymentKey = await this.paymobService.generatePaymentKey(
            authToken,
            paymobOrderId,
            amount * 100,
            billingData,
          );
          

          // Generate wallet payment (default to Vodafone Cash)
          const walletPayment = await this.paymobService.generateWalletPayment(
            paymentKey,
            data.walletType || 'vodafone',
          );


          // Update order with PayMob order ID for tracking
          await this.prisma.order.update({
            where: { id: order.id },
            data: { 
              // You might want to add a paymobOrderId field to your schema
              // paymobOrderId: paymobOrderId.toString()
            }
          });

          // Return order info + wallet payment details
          return { 
            order, 
            paymobOrderId,
            paymentKey,
            walletUrl: walletPayment.walletUrl,
            referenceNumber: walletPayment.referenceNumber,
            walletType: data.walletType || 'vodafone'
          };
        } catch (error) {
          // If payment setup fails, mark order as failed
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'FAILED' }
          });
          
          throw new Error(`Payment setup failed: ${error.message}`);
        }
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