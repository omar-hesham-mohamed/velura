import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaymobService } from './paymob.service';
import { PaymobController } from './paymob.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }), // so process.env works everywhere
  ],
  controllers: [PaymobController],
  providers: [PaymobService],
  exports: [PaymobService],
})
export class PaymobModule {}
