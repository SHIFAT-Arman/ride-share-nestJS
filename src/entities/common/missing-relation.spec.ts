import { isMissingRelation } from './missing-relation';

describe('isMissingRelation', () => {
  it('matches a missing Postgres relation', () => {
    expect(isMissingRelation({ driverError: { code: '42P01' } })).toBe(true);
    expect(isMissingRelation({ code: '42P01' })).toBe(true);
  });

  it('ignores other failures', () => {
    expect(isMissingRelation({ driverError: { code: '23505' } })).toBe(false);
    expect(isMissingRelation(new Error('down'))).toBe(false);
    expect(isMissingRelation(null)).toBe(false);
  });
});
