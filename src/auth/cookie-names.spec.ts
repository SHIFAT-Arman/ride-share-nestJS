import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookieOptions,
  clearAuthCookies,
  setAuthCookies,
} from './cookie-names';

describe('auth cookies', () => {
  it('clear uses the same base options as set', () => {
    const res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    setAuthCookies(res, 'access', 'refresh');
    clearAuthCookies(res);

    const base = authCookieOptions();
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
});
