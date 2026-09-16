import { createHash, randomUUID } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPairService } from './token-pair.service';
import {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenStore,
  RotateRefreshTokenInput,
  RotateResult,
} from './refresh-token.store';

class MemoryRefreshTokenStore implements RefreshTokenStore {
  readonly rows = new Map<string, RefreshTokenRecord>();

  async create(input: CreateRefreshTokenInput): Promise<void> {
    this.rows.set(input.jti, {
      ...input,
      revokedAt: null,
      replacedByJti: null,
    });
  }

  async findByJti(jti: string): Promise<RefreshTokenRecord | null> {
    return this.rows.get(jti) ?? null;
  }

  async rotate(input: RotateRefreshTokenInput): Promise<RotateResult> {
    const old = this.rows.get(input.oldJti);
    if (!old) return 'not_found';
    if (
      old.revokedAt ||
      old.tokenHash !== input.oldTokenHash ||
      old.expiresAt.getTime() <= Date.now()
    ) {
      return 'not_claimable';
    }
    this.rows.set(input.oldJti, {
      ...old,
      revokedAt: new Date(),
      replacedByJti: input.next.jti,
    });
    await this.create(input.next);
    return 'rotated';
  }

  async revokeFamily(familyId: string): Promise<void> {
    for (const [jti, row] of this.rows) {
      if (row.familyId === familyId && !row.revokedAt) {
        this.rows.set(jti, { ...row, revokedAt: new Date() });
      }
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const [jti, row] of this.rows) {
      if (row.userId === userId && !row.revokedAt) {
        this.rows.set(jti, { ...row, revokedAt: new Date() });
      }
    }
  }
}

describe('TokenPairService', () => {
  const accessSecret = 'access-secret-test';
  const refreshSecret = 'refresh-secret-test';
  let store: MemoryRefreshTokenStore;
  let service: TokenPairService;
  let jwt: JwtService;

  beforeEach(() => {
    store = new MemoryRefreshTokenStore();
    jwt = new JwtService({});
    const config = {
      get: (key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return undefined;
      },
      getOrThrow: (key: string) => {
        if (key === 'JWT_SECRET') return accessSecret;
        if (key === 'JWT_REFRESH_SECRET') return refreshSecret;
        throw new Error(`missing ${key}`);
      },
    } as unknown as ConfigService;

    service = new TokenPairService(jwt, config, store);
  });

  const user = {
    id: randomUUID(),
    email: 'jane@example.com',
    role: 'rider' as const,
  };

  function principalFrom(refreshToken: string) {
    const payload = jwt.verify(refreshToken, { secret: refreshSecret });
    return service.toRefreshPrincipal(payload as never, refreshToken);
  }

  it('rotates: old jti revoked, new jti valid', async () => {
    const first = await service.issue(user);
    const firstPayload = jwt.verify<{ jti: string }>(first.refreshToken, {
      secret: refreshSecret,
    });

    const second = await service.rotate(principalFrom(first.refreshToken));

    const old = await store.findByJti(firstPayload.jti);
    expect(old?.revokedAt).toBeTruthy();
    expect(old?.replacedByJti).toBeTruthy();

    const secondPayload = jwt.verify<{ jti: string }>(second.refreshToken, {
      secret: refreshSecret,
    });
    const neu = await store.findByJti(secondPayload.jti);
    expect(neu?.revokedAt).toBeNull();
    expect(neu?.tokenHash).toBe(
      createHash('sha256').update(second.refreshToken).digest('hex'),
    );
  });

  it('reusing a rotated refresh token revokes the family', async () => {
    const first = await service.issue(user);
    await service.rotate(principalFrom(first.refreshToken));

    await expect(
      service.rotate(principalFrom(first.refreshToken)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const familyId = jwt.verify<{ familyId: string }>(first.refreshToken, {
      secret: refreshSecret,
    }).familyId;
    for (const row of store.rows.values()) {
      if (row.familyId === familyId) {
        expect(row.revokedAt).toBeTruthy();
      }
    }
  });

  it('concurrent rotate: one wins, loser does not kill winner family', async () => {
    const first = await service.issue(user);
    const p = principalFrom(first.refreshToken);

    const [a, b] = await Promise.allSettled([
      service.rotate(p),
      service.rotate(p),
    ]);

    const fulfilled = [a, b].filter((r) => r.status === 'fulfilled');
    const rejected = [a, b].filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const winner = (fulfilled[0] as PromiseFulfilledResult<{ refreshToken: string }>)
      .value;
    const winJti = jwt.verify<{ jti: string; familyId: string }>(
      winner.refreshToken,
      { secret: refreshSecret },
    );
    const winRow = await store.findByJti(winJti.jti);
    expect(winRow?.revokedAt).toBeNull();
  });

  it('rejects access JWTs as refresh principals', () => {
    const pair = service.issue(user);
    return pair.then((p) => {
      const accessPayload = jwt.verify(p.accessToken, {
        secret: accessSecret,
      });
      expect(() =>
        service.toRefreshPrincipal(accessPayload as never, p.accessToken),
      ).toThrow(UnauthorizedException);
    });
  });

  it('login issue revokes prior refresh families', async () => {
    const first = await service.issue(user);
    const firstJti = jwt.verify<{ jti: string }>(first.refreshToken, {
      secret: refreshSecret,
    }).jti;

    await service.issue(user);

    const old = await store.findByJti(firstJti);
    expect(old?.revokedAt).toBeTruthy();
  });
});
