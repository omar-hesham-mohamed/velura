import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Connect to the database when app starts
    await this.$connect();
  }

  async onModuleDestroy() {
    // Gracefully disconnect when app shuts down
    await this.$disconnect();
  }
}
