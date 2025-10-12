import { Controller, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymobService } from './paymob.service';
import * as crypto from 'crypto';

@Controller('paymob')
export class PaymobController {
  constructor(
    private prisma: PrismaService,
    private paymobService: PaymobService
  ) {}

  @Post('callback')
  async handleCallback(@Req() req) {
    const data = req.body;
    
    try {
      // Verify HMAC signature for security
      const hmac = req.headers['x-paymob-signature'] as string;
      if (!this.verifyHmac(data, hmac)) {
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      if (data.obj && data.obj.success) {
        const orderId = data.obj.order.merchant_order_id;
        
        if (orderId) {
          await this.prisma.order.update({
            where: { id: Number(orderId) },
            data: { status: 'PAID' },
          });
        }
      } else if (data.obj && !data.obj.success) {
        // Handle failed payment
        const orderId = data.obj.order.merchant_order_id;
        if (orderId) {
          await this.prisma.order.update({
            where: { id: Number(orderId) },
            data: { status: 'FAILED' },
          });
        }
      }

      return { message: 'Callback processed successfully' };
    } catch (error) {
      console.error('PayMob callback error:', error);
      throw new HttpException('Callback processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private verifyHmac(data: any, signature: string): boolean {
    // You need to implement HMAC verification based on PayMob's documentation
    // This is a placeholder - check PayMob docs for the exact implementation
    return true; // Replace with actual HMAC verification
  }
}
