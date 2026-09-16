import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms, { StringValue } from 'ms';
import { User } from '../entities/user/user.entity';
import { UserType } from './user-type.enum';
import {
  REFRESH_TOKEN_STORE,
  type RefreshTokenStore,
} from './refresh-token.store';

export type AccessJwtPayload = {
  sub: string;
  email: string;
  role: UserType;
  type: 'access';
};

export type RefreshJwtPayload = {
  sub: string;
  email: string;
  role: UserType;
  type: 'refresh';
  jti: string;
  familyId: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  role: UserType;
  sub: string;
  email: string;
};

export type RefreshPrincipal = {
  sub: string;
  email: string;
  role: UserType;
  jti: string;
  familyId: string;
  rawToken: string;
};

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function hashesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

@Injectable()
export class TokenPairService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly store: RefreshTokenStore,
  ) {}

  async issue(user: Pick<User, 'id' | 'email' | 'role'>): Promise<TokenPair> {
    // One active refresh family per login (logout-everywhere on re-auth).
    await this.store.revokeAllForUser(user.id);
    return this.mintAndPersist(user, randomUUID(), randomUUID());
  }

  async rotate(principal: RefreshPrincipal): Promise<TokenPair> {
    if (!principal.jti || !principal.familyId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const record = await this.store.findByJti(principal.jti);
    if (!record || record.userId !== principal.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const oldHash = hashToken(principal.rawToken);
    if (!hashesEqual(record.tokenHash, oldHash)) {
      await this.store.revokeFamily(record.familyId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Presented an already-rotated token → theft; kill family.
    // Concurrent losers hit not_claimable below and must NOT kill the winner.
    if (record.revokedAt) {
      await this.store.revokeFamily(record.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const nextJti = randomUUID();
    const accessExpiresIn = (this.config.get<string>('JWT_EXPIRES_IN') ??
      '15m') as StringValue;
    const refreshExpiresIn = (this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) ?? '7d') as StringValue;

    const accessToken = this.jwtService.sign(
      {
        sub: principal.sub,
        email: principal.email,
        role: principal.role,
        type: 'access',
      } satisfies AccessJwtPayload,
      { secret: this.accessSecret(), expiresIn: accessExpiresIn },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: principal.sub,
        email: principal.email,
        role: principal.role,
        type: 'refresh',
        jti: nextJti,
        familyId: record.familyId,
      } satisfies RefreshJwtPayload,
      { secret: this.refreshSecret(), expiresIn: refreshExpiresIn },
    );

    const result = await this.store.rotate({
      oldJti: principal.jti,
      oldTokenHash: oldHash,
      next: {
        userId: principal.sub,
        jti: nextJti,
        familyId: record.familyId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshMaxAgeMs()),
      },
    });

    if (result === 'rotated') {
      return {
        accessToken,
        refreshToken,
        role: principal.role,
        sub: principal.sub,
        email: principal.email,
      };
    }

    // Lost atomic claim (other request won) — soft fail, keep winner's family.
    throw new UnauthorizedException('Invalid refresh token');
  }

  async revokeRawRefreshToken(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    try {
      const payload = this.jwtService.verify<RefreshJwtPayload>(rawToken, {
        secret: this.refreshSecret(),
      });
      if (payload.type !== 'refresh' || !payload.jti) return;
      const record = await this.store.findByJti(payload.jti);
      if (record) await this.store.revokeFamily(record.familyId);
    } catch {
      // Cookie may be stale/corrupt — still clear cookies at the controller.
    }
  }

  /**
   * Passport shape check after signature verify.
   * DB claim is only in rotate() so concurrent refreshes cannot double-issue.
   */
  toRefreshPrincipal(
    payload: RefreshJwtPayload,
    rawToken: string,
  ): RefreshPrincipal {
    if (payload.type !== 'refresh' || !payload.jti || !payload.familyId) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (typeof rawToken !== 'string' || !rawToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      familyId: payload.familyId,
      rawToken,
    };
  }

  accessMaxAgeMs(): number {
    return this.ttlMs(
      this.config.get<string>('JWT_EXPIRES_IN') ?? '15m',
      15 * 60 * 1000,
    );
  }

  refreshMaxAgeMs(): number {
    return this.ttlMs(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      7 * 24 * 60 * 60 * 1000,
    );
  }

  private async mintAndPersist(
    user: Pick<User, 'id' | 'email' | 'role'>,
    familyId: string,
    jti: string,
  ): Promise<TokenPair> {
    const accessExpiresIn = (this.config.get<string>('JWT_EXPIRES_IN') ??
      '15m') as StringValue;
    const refreshExpiresIn = (this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) ?? '7d') as StringValue;

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      } satisfies AccessJwtPayload,
      { secret: this.accessSecret(), expiresIn: accessExpiresIn },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
        jti,
        familyId,
      } satisfies RefreshJwtPayload,
      { secret: this.refreshSecret(), expiresIn: refreshExpiresIn },
    );

    await this.store.create({
      userId: user.id,
      jti,
      familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + this.refreshMaxAgeMs()),
    });

    return {
      accessToken,
      refreshToken,
      role: user.role,
      sub: user.id,
      email: user.email,
    };
  }

  private accessSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  private refreshSecret(): string {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  private ttlMs(value: string, fallback: number): number {
    const parsed = ms(value as StringValue);
    return typeof parsed === 'number' ? parsed : fallback;
  }
}
