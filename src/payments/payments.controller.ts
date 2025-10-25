import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payments.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: CreatePaymentDto) {
    return this.paymentService.createPayment(data);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.paymentService.getPaymentById(Number(id));
  }

  @Get()
  getAll() {
    return this.paymentService.getPayments();
  }
}
