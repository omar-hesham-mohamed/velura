import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Provider } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto) {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
  
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async deleteUser(id: number) {
    // Check if user exists first
    const user = await this.getUserById(id);
    
    return this.prisma.user.delete({
      where: { id },
    });
  }

    // 🔹 NEW: find user by provider and providerId
  async findByProviderAndId(provider: Provider, providerId: string) {
    return this.prisma.user.findFirst({
      where: { provider, providerId },
    });
  }

  // 🔹 NEW: create a user coming from OAuth
  async createOAuthUser(oauthUser: {
    provider: Provider;
    providerId: string;
    email: string;
    name: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: oauthUser.email,
        name: oauthUser.name,
        provider: oauthUser.provider,
        providerId: String(oauthUser.providerId),
        password: null, // no password for OAuth users
      },
    });
  }

  // Link a provider (provider + providerId) to an existing user
  async linkProvider(userId: number, provider: Provider, providerId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { provider, providerId: String(providerId) },
    });
  }
}
