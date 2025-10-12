import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payments.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(data: CreatePaymentDto) {
    // Check if order exists
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });
    if (!order) {
      throw new Error(`Order with ID ${data.orderId} not found`);
    }

    // Create payment entry
    return this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        status: data.status,
      },
    });
  }

  async getPaymentById(id: number) {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  async getPayments() {
    return this.prisma.payment.findMany();
  }
}