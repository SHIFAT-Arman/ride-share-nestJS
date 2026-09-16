import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ACCESS_COOKIE } from './cookie-names';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const token = req?.cookies?.[ACCESS_COOKIE];
          return typeof token === 'string' ? token : null;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Access token required');
    }
    // Legacy tokens without type are treated as access.
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
