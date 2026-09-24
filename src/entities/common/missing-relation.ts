/** Postgres undefined_table. TypeORM wraps it as driverError.code. */
export function isMissingRelation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const wrapped = err as { code?: string; driverError?: { code?: string } };
  return wrapped.driverError?.code === '42P01' || wrapped.code === '42P01';
}
