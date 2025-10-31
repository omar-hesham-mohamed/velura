import { Body, Controller, Get, Post, Param, Delete, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateOAuthUserDto } from './dto/create-oauth-user.dto';
import type { Provider } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /users
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // POST /users/oauth - create or return existing OAuth user
  @Post('oauth')
  async createOAuth(@Body() dto: CreateOAuthUserDto) {
    // normalize provider to Prisma enum values (uppercase)
    const providerKey = String(dto.provider ?? 'local').toLowerCase();
    const map: Record<string, Provider> = {
      local: 'LOCAL',
      google: 'GOOGLE',
      facebook: 'FACEBOOK',
    };

    const provider = map[providerKey];
    if (!provider) throw new BadRequestException('Invalid provider');

    // If a user exists with this provider+providerId, return it
    const existing = await this.usersService.findByProviderAndId(provider, String(dto.providerId));
    if (existing) return existing;

    // If a user exists with this email, link the provider and return
    if (dto.email) {
      const byEmail = await this.usersService.findByEmail(dto.email);
      if (byEmail) {
        // attach provider info
        const updated = await this.usersService.linkProvider(byEmail.id, provider, String(dto.providerId));
        return updated;
      }
    }

    // otherwise create a fresh OAuth user
    return this.usersService.createOAuthUser({
      provider,
      providerId: String(dto.providerId),
      email: dto.email ?? '',
      name: dto.name,
    });
  }

  // GET /users
  @Get()
  findAll() {
    return this.usersService.getAllUsers();
  }

  // GET /users/:id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.getUserById(Number(id));
  }

  // DELETE /users/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(Number(id));
  }
}
