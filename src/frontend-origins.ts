const LOCAL_DEFAULT = 'http://localhost:3001';

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Canonical origin only (`scheme://host[:port]`). Rejects *, null, paths, query, hash. */
export function canonicalizeOrigin(
  value: string,
  production = isProduction(),
): string {
  const raw = value.trim();
  if (!raw || raw === '*' || raw.toLowerCase() === 'null') {
    throw new Error(`Invalid FRONTEND_URL origin: ${value}`);
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid FRONTEND_URL origin: ${value}`);
  }

  if (url.username || url.password) {
    throw new Error(`Invalid FRONTEND_URL origin: ${value}`);
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error(`FRONTEND_URL must be an origin (no path): ${value}`);
  }
  if (url.search || url.hash) {
    throw new Error(`FRONTEND_URL must be an origin (no query/hash): ${value}`);
  }
  if (production && url.protocol !== 'https:') {
    throw new Error(`FRONTEND_URL must use https in production: ${value}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Invalid FRONTEND_URL scheme: ${value}`);
  }

  return url.origin;
}

/**
 * Parse FRONTEND_URL (comma-separated). Empty in non-production → localhost default.
 * Production empty or any invalid entry → throw (fail boot).
 */
export function parseFrontendOrigins(
  raw: string | undefined = process.env.FRONTEND_URL,
  production = isProduction(),
): string[] {
  const source = raw?.trim() ? raw : production ? '' : LOCAL_DEFAULT;
  if (!source.trim()) {
    throw new Error('FRONTEND_URL is required in production');
  }

  const parts = source
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    throw new Error('FRONTEND_URL is required in production');
  }

  return parts.map((p) => canonicalizeOrigin(p, production));
}

export function frontendOriginAllowlist(
  raw?: string,
  production = isProduction(),
): Set<string> {
  return new Set(parseFrontendOrigins(raw, production));
}

/** Origin from Origin header, else Referer. */
export function requestOriginFromHeaders(headers: {
  origin?: string | string[];
  referer?: string | string[];
}): string | null {
  const originHeader = headerValue(headers.origin);
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      return null;
    }
  }

  const referer = headerValue(headers.referer);
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export type SameSiteOpt = 'lax' | 'strict' | 'none';

export function cookieSecureFromEnv(): boolean {
  if (process.env.COOKIE_SECURE != null) {
    return process.env.COOKIE_SECURE === 'true';
  }
  return isProduction();
}

export function cookieSameSiteFromEnv(): SameSiteOpt {
  const raw = (process.env.COOKIE_SAME_SITE ?? 'lax').toLowerCase();
  if (raw !== 'lax' && raw !== 'strict' && raw !== 'none') {
    throw new Error(
      `COOKIE_SAME_SITE must be lax|strict|none, got: ${process.env.COOKIE_SAME_SITE}`,
    );
  }
  return raw;
}

/** Fail boot if SameSite=None without Secure. */
export function assertCookieEnv(): void {
  const sameSite = cookieSameSiteFromEnv();
  const secure = cookieSecureFromEnv();
  if (sameSite === 'none' && !secure) {
    throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
  }
}
