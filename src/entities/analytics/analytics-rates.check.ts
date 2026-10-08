/**
 * Assert-style check for analytics rate helpers.
 * Run: npx ts-node -r tsconfig-paths/register src/entities/analytics/analytics-rates.check.ts
 */
import assert from 'node:assert/strict';
import { cancellationRate, completionRate } from './analytics-rates';

assert.equal(completionRate(0, 0), 0);
assert.equal(cancellationRate(0, 0), 0);
assert.equal(completionRate(8, 2), 0.8);
assert.equal(cancellationRate(8, 2), 0.2);
assert.equal(completionRate(0, 5), 0);
assert.equal(cancellationRate(0, 5), 1);
assert.equal(completionRate(3, 0), 1);
assert.equal(cancellationRate(3, 0), 0);

console.log('analytics-rates.check: ok');
