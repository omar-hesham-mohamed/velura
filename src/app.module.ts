import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { PaymobModule } from './paymob/paymob.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    OrdersModule,
    PaymobModule,
    ProductsModule,
  ],
})

export class AppModule {}