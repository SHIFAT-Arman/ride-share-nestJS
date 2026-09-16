/** Minimal env surface so this stays unit-testable without Nest. */
export type DbEnv = {
  get(key: string): string | undefined;
  getOrThrow(key: string): string;
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** Remote Postgres (Neon/Render) needs TLS; local usually does not. */
export function resolvePostgresSsl(
  url: string | undefined,
  dbSsl: string | undefined,
): false | { rejectUnauthorized: false } {
  if (dbSsl === 'true') return { rejectUnauthorized: false };
  if (dbSsl === 'false') return false;
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    if (LOCAL_HOSTS.has(host)) return false;
  } catch {
    return false;
  }
  return { rejectUnauthorized: false };
}

/** Prefers DATABASE_URL (Neon/Render); falls back to DB_* for local Postgres. */
export function postgresTypeOrmOptions(config: DbEnv) {
  const url = config.get('DATABASE_URL');
  return {
    type: 'postgres' as const,
    autoLoadEntities: true,
    // ponytail: DB_SYNCHRONIZE=true locally; false in prod until migrations exist
    synchronize: config.get('DB_SYNCHRONIZE') === 'true',
    ssl: resolvePostgresSsl(url, config.get('DB_SSL')),
    ...(url
      ? { url }
      : {
          host: config.getOrThrow('DB_HOST'),
          port: parseInt(config.getOrThrow('DB_PORT'), 10),
          username: config.getOrThrow('DB_USER'),
          password: config.getOrThrow('DB_PASSWORD'),
          database: config.getOrThrow('DB_DATABASE'),
        }),
  };
}
