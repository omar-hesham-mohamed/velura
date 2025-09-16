import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
// import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    // ProductsModule,
    // later: OrdersModule, PaymentsModule, etc.
  ],
})

export class AppModule {}