import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      // Extract refresh token from cookies OR Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          // Look for refreshToken cookie
          const token = req?.cookies?.refreshToken;
          if (!token) return null;

          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true, // So we can access the request in validate()
    } as any); // expects passReqToCallback to be false
  }

  /**
   * Called automatically after verifying the refresh token.
   * We can attach extra info or reject if needed.
   */
  async validate(req: Request, payload: { sub: string; email: string }) {
    const refreshToken = req?.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    return { userId: payload.sub, email: payload.email, refreshToken };
  }
}
