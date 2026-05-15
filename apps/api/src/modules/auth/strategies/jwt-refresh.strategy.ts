import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: { sub: string; email: string }) {
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');
    return { ...payload, refreshToken };
  }
}
