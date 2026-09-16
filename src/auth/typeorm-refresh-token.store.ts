import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenStore,
  RotateRefreshTokenInput,
  RotateResult,
} from './refresh-token.store';

@Injectable()
export class TypeOrmRefreshTokenStore implements RefreshTokenStore {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  async create(input: CreateRefreshTokenInput): Promise<void> {
    await this.repo.insert({
      userId: input.userId,
      jti: input.jti,
      familyId: input.familyId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedByJti: null,
    });
  }

  async findByJti(jti: string): Promise<RefreshTokenRecord | null> {
    const row = await this.repo.findOne({ where: { jti } });
    if (!row) return null;
    return {
      jti: row.jti,
      userId: row.userId,
      familyId: row.familyId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      replacedByJti: row.replacedByJti,
    };
  }

  async rotate(input: RotateRefreshTokenInput): Promise<RotateResult> {
    return this.repo.manager.transaction(async (em) => {
      const result = await em.update(
        RefreshToken,
        {
          jti: input.oldJti,
          tokenHash: input.oldTokenHash,
          revokedAt: IsNull(),
          expiresAt: MoreThan(new Date()),
        },
        {
          revokedAt: new Date(),
          replacedByJti: input.next.jti,
        },
      );

      if (!result.affected) {
        const row = await em.findOne(RefreshToken, {
          where: { jti: input.oldJti },
        });
        return row ? 'not_claimable' : 'not_found';
      }

      await em.insert(RefreshToken, {
        userId: input.next.userId,
        jti: input.next.jti,
        familyId: input.next.familyId,
        tokenHash: input.next.tokenHash,
        expiresAt: input.next.expiresAt,
        revokedAt: null,
        replacedByJti: null,
      });
      return 'rotated';
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.repo.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
