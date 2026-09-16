import { postgresTypeOrmOptions, resolvePostgresSsl } from './typeorm.options';

function env(values: Record<string, string>) {
  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const v = values[key];
      if (v === undefined) throw new Error(`missing ${key}`);
      return v;
    },
  };
}

describe('resolvePostgresSsl', () => {
  it('respects DB_SSL override', () => {
    expect(resolvePostgresSsl(undefined, 'true')).toEqual({
      rejectUnauthorized: false,
    });
    expect(
      resolvePostgresSsl('postgresql://x@ep-x.neon.tech/db', 'false'),
    ).toBe(false);
  });

  it('disables TLS for localhost URLs; enables for remote', () => {
    expect(
      resolvePostgresSsl('postgresql://u:p@localhost:5432/db', undefined),
    ).toBe(false);
    expect(
      resolvePostgresSsl(
        'postgresql://u:p@ep-x.us-east-2.aws.neon.tech/neondb',
        undefined,
      ),
    ).toEqual({ rejectUnauthorized: false });
  });
});

describe('postgresTypeOrmOptions', () => {
  it('uses DATABASE_URL when set', () => {
    const opts = postgresTypeOrmOptions(
      env({
        DATABASE_URL: 'postgresql://u:p@ep-x.neon.tech/db',
        DB_SYNCHRONIZE: 'false',
      }),
    );
    expect(opts).toMatchObject({
      type: 'postgres',
      url: 'postgresql://u:p@ep-x.neon.tech/db',
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    });
    expect(opts).not.toHaveProperty('host');
  });

  it('falls back to DB_* when DATABASE_URL is absent', () => {
    const opts = postgresTypeOrmOptions(
      env({
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USER: 'postgres',
        DB_PASSWORD: 'secret',
        DB_DATABASE: 'rideshare',
        DB_SYNCHRONIZE: 'true',
      }),
    );
    expect(opts).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'secret',
      database: 'rideshare',
      synchronize: true,
      ssl: false,
    });
    expect(opts).not.toHaveProperty('url');
  });
});
