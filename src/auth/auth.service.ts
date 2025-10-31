import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  import { UsersService } from '../users/users.service';
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly usersService: UsersService,
      private readonly jwtService: JwtService,
    ) {}
  
    /**
     * Register a new LOCAL user
     */
    async register(email: string, password: string, name: string) {
      const existing = await this.usersService.findByEmail(email);
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
  
      const user = await this.usersService.createUser({
        email,
        password,
        name,
        provider: 'LOCAL',
      });

      const tokens = await this.generateTokens(String(user.id), user.email);
      return { user, ...tokens };
    }
  
    /**
     * Validate credentials for login
     */
    async validateUser(email: string, password: string) {
      const user = await this.usersService.findByEmail(email);
      if (!user || !user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      return user;
    }
  
    /**
     * Login — return new JWT tokens
     */
    async login(email: string, password: string) {
      const user = await this.validateUser(email, password);
      const tokens = await this.generateTokens(String(user.id), user.email);
      return { user, ...tokens };
    }
  
    /**
     * Generate JWT access + refresh tokens
     * (We'll later add refresh-token storage + rotation)
     */
    async generateTokens(userId: string, email: string) {
      const payload = { sub: userId, email } as const;

      const accessToken = await this.jwtService.signAsync<{ sub: string; email: string }>(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN) || 900, // 15 mins
      });

      const refreshToken = await this.jwtService.signAsync<{ sub: string; email: string }>(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 604800, // 7 days
      });

      return { accessToken, refreshToken };
    }
  
    /**
     * Verify refresh token and issue new tokens (rotation comes later)
     */
    async refreshTokens(token: string) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_REFRESH_SECRET,
        });
        const user = await this.usersService.getUserById(payload.sub);
        if (!user) throw new UnauthorizedException();
        const tokens = await this.generateTokens(String(user.id), user.email);
        return { user, ...tokens };
      } catch (err) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    }

    async handleOAuthLogin(oauthUser: any) {
      let user = await this.usersService.findByProviderAndId(
        oauthUser.provider,
        oauthUser.providerId,
      );

      if (!user) {
        user = await this.usersService.createOAuthUser(oauthUser);
      }

      return this.generateTokens(String(user.id), user.email);
    }

    async logout(userId: number) {
      const user = await this.usersService.getUserById(userId);
      if (!user) throw new UnauthorizedException('User not found');

      // If later you store refresh tokens in DB, you'd nullify them here
      // e.g., await this.usersService.update(userId, { refreshToken: null });

      return { message: 'Logged out successfully' };
    }
  }
  