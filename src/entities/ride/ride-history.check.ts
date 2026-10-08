/**
 * Assert-style check for history filter + rating gate rules.
 * Run: npx ts-node -r tsconfig-paths/register src/entities/ride/ride-history.check.ts
 */
import { RideStatus } from './enums/ride-status.enum';

const HISTORY = new Set([RideStatus.COMPLETED, RideStatus.CANCELLED]);
const ACTIVE = new Set([
  RideStatus.SEARCHING,
  RideStatus.ACCEPTED,
  RideStatus.IN_PROGRESS,
]);

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

assert(HISTORY.has(RideStatus.COMPLETED), 'completed is history');
assert(HISTORY.has(RideStatus.CANCELLED), 'cancelled is history');
assert(!HISTORY.has(RideStatus.SEARCHING), 'searching is not history');
assert(!HISTORY.has(RideStatus.IN_PROGRESS), 'in-progress is not history');
assert(ACTIVE.has(RideStatus.ACCEPTED), 'accepted is active');
assert(!ACTIVE.has(RideStatus.COMPLETED), 'completed is not active');

const canRate = (status: RideStatus, hasDriver: boolean) =>
  status === RideStatus.COMPLETED && hasDriver;

assert(canRate(RideStatus.COMPLETED, true), 'completed+driver can rate');
assert(!canRate(RideStatus.COMPLETED, false), 'completed without driver cannot');
assert(!canRate(RideStatus.CANCELLED, true), 'cancelled cannot rate');
assert(!canRate(RideStatus.IN_PROGRESS, true), 'in-progress cannot rate');

console.log('ride-history.check: ok');
