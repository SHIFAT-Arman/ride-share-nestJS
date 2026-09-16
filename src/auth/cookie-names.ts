import { ConfigService } from '@nestjs/config';

/** Cookie names for JWT session. Renamed from access_token to avoid stale Secure cookies on HTTP localhost. */
export const ACCESS_COOKIE = 'rs_access';
export const REFRESH_COOKIE = 'rs_refresh';

/** Shared options for set and clear — attrs must match or the browser keeps the cookie. */
export function authCookieOptions(config: ConfigService) {
  const sameSite = (config.get<string>('COOKIE_SAME_SITE') ?? 'lax') as
    | 'lax'
    | 'none'
    | 'strict';
  return {
    httpOnly: true,
    secure: config.get<string>('COOKIE_SECURE') === 'true',
    sameSite,
    path: '/',
  };
}

type CookieRes = {
  cookie(name: string, value: string, options: object): void;
  clearCookie(name: string, options: object): void;
};

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookies(
  res: Pick<CookieRes, 'cookie'>,
  accessToken: string,
  refreshToken: string,
  config: ConfigService,
  maxAge?: { accessMs?: number; refreshMs?: number },
) {
  const base = authCookieOptions(config);
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: maxAge?.accessMs ?? ACCESS_MAX_AGE_MS,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: maxAge?.refreshMs ?? REFRESH_MAX_AGE_MS,
  });
}

export function clearAuthCookies(
  res: Pick<CookieRes, 'clearCookie'>,
  config: ConfigService,
) {
  const base = authCookieOptions(config);
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
