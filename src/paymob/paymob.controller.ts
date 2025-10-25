import { Controller, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymobService } from './paymob.service';

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
      if (!this.paymobService.verifyHmacSignature(data, hmac)) {
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

}
