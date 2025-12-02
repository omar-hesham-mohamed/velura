import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcryptjs';
  import { ConfigService } from '@nestjs/config';
  import { UsersService } from '../users/users.service';
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly usersService: UsersService,
      private readonly jwtService: JwtService,
      private readonly config: ConfigService,
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

      // sign access token using JwtModule config (no explicit secret required for access if configured)
      const accessToken = await this.jwtService.signAsync<{ sub: string; email: string }>(payload, {
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as unknown as any,
      });

      // sign refresh token using refresh secret (JwtModule typically configured for access token)
      const refreshToken = await this.jwtService.signAsync<{ sub: string; email: string }>(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN')) as unknown as any,
      });

      // hash and persist refresh token (rotate / single token per user)
      const hashed = await bcrypt.hash(refreshToken, 12);

      // compute expiresAt from the expiresIn value
      const expiresSeconds = Number(this.config.get<string>('JWT_REFRESH_EXPIRES_IN'));
      const expiresAt = new Date(Date.now() + expiresSeconds * 1000);

      await this.usersService.setCurrentRefreshToken(hashed, Number(userId), expiresAt);

      return { accessToken, refreshToken };
    }
  
    /**
     * Verify refresh token and issue new tokens (rotation comes later)
     */
    async refreshTokens(token: string) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        });

        const userId = Number((payload as any).sub);
        const user = await this.usersService.getUserById(userId);
        if (!user) throw new UnauthorizedException();

        // compare provided token with stored hashed tokens
        const storedTokens = await this.usersService.findRefreshTokensByUser(userId);
        if (!storedTokens || storedTokens.length === 0) throw new UnauthorizedException();

        let match = false;
        for (const row of storedTokens) {
          // row.token stores the hashed token
          // bcrypt.compare handles plain vs hash
          // eslint-disable-next-line no-await-in-loop
          if (await bcrypt.compare(token, row.token)) {
            match = true;
            break;
          }
        }

        if (!match) throw new UnauthorizedException();

        // rotate: generate fresh tokens (this will replace stored hashed token)
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

      // remove stored refresh tokens for the user to revoke sessions
      await this.usersService.setCurrentRefreshToken(null, userId);

      return { message: 'Logged out successfully' };
    }
  }
  