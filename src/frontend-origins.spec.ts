import {
  assertCookieEnv,
  canonicalizeOrigin,
  parseFrontendOrigins,
  requestOriginFromHeaders,
} from './frontend-origins';
import { CsrfOriginGuard } from './auth/guards/csrf-origin.guard';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

describe('frontend origins', () => {
  const keys = [
    'NODE_ENV',
    'FRONTEND_URL',
    'COOKIE_SECURE',
    'COOKIE_SAME_SITE',
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of keys) saved[k] = process.env[k];
  });

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('canonicalizes and strips trailing slash', () => {
    expect(canonicalizeOrigin('https://app.vercel.app/', false)).toBe(
      'https://app.vercel.app',
    );
  });

  it('rejects path, wildcard, and null', () => {
    expect(() => canonicalizeOrigin('https://app.vercel.app/admin', false)).toThrow();
    expect(() => canonicalizeOrigin('*', false)).toThrow();
    expect(() => canonicalizeOrigin('null', false)).toThrow();
  });

  it('requires https in production', () => {
    expect(() =>
      canonicalizeOrigin('http://app.vercel.app', true),
    ).toThrow(/https/);
  });

  it('parses comma-separated FRONTEND_URL', () => {
    expect(
      parseFrontendOrigins('https://a.vercel.app, https://b.vercel.app/', true),
    ).toEqual(['https://a.vercel.app', 'https://b.vercel.app']);
  });

  it('fails production when FRONTEND_URL empty', () => {
    expect(() => parseFrontendOrigins('', true)).toThrow(/required/);
    expect(() => parseFrontendOrigins(undefined, true)).toThrow(/required/);
  });

  it('defaults to localhost when unset outside production', () => {
    expect(parseFrontendOrigins(undefined, false)).toEqual([
      'http://localhost:3001',
    ]);
  });

  it('rejects SameSite=None without Secure', () => {
    process.env.COOKIE_SAME_SITE = 'none';
    process.env.COOKIE_SECURE = 'false';
    expect(() => assertCookieEnv()).toThrow(/COOKIE_SECURE/);
  });

  it('allows SameSite=None with Secure', () => {
    process.env.COOKIE_SAME_SITE = 'none';
    process.env.COOKIE_SECURE = 'true';
    expect(() => assertCookieEnv()).not.toThrow();
  });

  it('reads Origin then Referer', () => {
    expect(
      requestOriginFromHeaders({ origin: 'https://app.vercel.app' }),
    ).toBe('https://app.vercel.app');
    expect(
      requestOriginFromHeaders({
        referer: 'https://app.vercel.app/dashboard',
      }),
    ).toBe('https://app.vercel.app');
    expect(requestOriginFromHeaders({})).toBeNull();
  });
});

describe('CsrfOriginGuard', () => {
  const keys = ['NODE_ENV', 'FRONTEND_URL'] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of keys) saved[k] = process.env[k];
  });

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  function ctx(headers: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as ExecutionContext;
  }

  it('allows allowlisted Origin', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'http://localhost:3001';
    const guard = new CsrfOriginGuard();
    expect(guard.canActivate(ctx({ origin: 'http://localhost:3001' }))).toBe(
      true,
    );
  });

  it('rejects missing or foreign Origin', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'http://localhost:3001';
    const guard = new CsrfOriginGuard();
    expect(() => guard.canActivate(ctx({}))).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(ctx({ origin: 'https://evil.example' })),
    ).toThrow(ForbiddenException);
  });
});
