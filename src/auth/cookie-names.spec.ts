import { ConfigService } from '@nestjs/config';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookieOptions,
  clearAuthCookies,
  setAuthCookies,
} from './cookie-names';

function mockConfig(overrides: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    COOKIE_SECURE: 'false',
    COOKIE_SAME_SITE: 'lax',
    ...overrides,
  };
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('auth cookies', () => {
  it('clear uses the same base options as set', () => {
    const config = mockConfig();
    const res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    setAuthCookies(res, 'access', 'refresh', config);
    clearAuthCookies(res, config);

    const base = authCookieOptions(config);
    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_COOKIE,
      'access',
      expect.objectContaining(base),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      'refresh',
      expect.objectContaining(base),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_COOKIE, base);
    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE, base);
  });

  it('reads COOKIE_SECURE and COOKIE_SAME_SITE from config', () => {
    const config = mockConfig({
      COOKIE_SECURE: 'true',
      COOKIE_SAME_SITE: 'none',
    });
    expect(authCookieOptions(config)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  });
});
