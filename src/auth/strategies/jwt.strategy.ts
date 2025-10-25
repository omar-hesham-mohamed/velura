import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET!, // Ensure this environment variable is set
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // payload is what you signed earlier in generateTokens()
    return { userId: payload.sub, email: payload.email };
  }
}
