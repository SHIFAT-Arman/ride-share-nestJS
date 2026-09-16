import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { REFRESH_COOKIE } from './cookie-names';
import {
  RefreshJwtPayload,
  TokenPairService,
} from './token-pair.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly tokenPairs: TokenPairService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = req?.cookies?.[REFRESH_COOKIE];
          return typeof token === 'string' ? token : null;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshJwtPayload) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (typeof rawToken !== 'string') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Store claim is deferred to TokenPairService.rotate (atomic).
    return this.tokenPairs.toRefreshPrincipal(payload, rawToken);
  }
}
