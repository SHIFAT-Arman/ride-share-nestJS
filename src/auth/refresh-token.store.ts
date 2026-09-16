export const REFRESH_TOKEN_STORE = Symbol('REFRESH_TOKEN_STORE');

export type RefreshTokenRecord = {
  jti: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByJti: string | null;
};

export type CreateRefreshTokenInput = {
  userId: string;
  jti: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type RotateRefreshTokenInput = {
  oldJti: string;
  /** Must match the stored hash or the claim fails. */
  oldTokenHash: string;
  next: CreateRefreshTokenInput;
};

export type RotateResult = 'rotated' | 'not_found' | 'not_claimable';

/** Swappable persistence for refresh tokens (TypeORM today, Redis later). */
export interface RefreshTokenStore {
  create(input: CreateRefreshTokenInput): Promise<void>;
  findByJti(jti: string): Promise<RefreshTokenRecord | null>;
  /**
   * Atomically claim oldJti (unrevoked + hash match + not expired) and insert next.
   * Concurrent losers get `not_claimable` instead of creating a second valid token.
   */
  rotate(input: RotateRefreshTokenInput): Promise<RotateResult>;
  revokeFamily(familyId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
