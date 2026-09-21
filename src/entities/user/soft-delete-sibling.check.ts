/**
 * Assert-based check for softDeleteOrKeepForSibling semantics (pure).
 * Run: npx ts-node src/entities/user/soft-delete-sibling.check.ts
 */
function softDeleteOrKeep(
  siblingAlive: boolean,
): 'softDelete' | 'keepAndFlipRole' {
  return siblingAlive ? 'keepAndFlipRole' : 'softDelete';
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

assert(
  softDeleteOrKeep(true) === 'keepAndFlipRole',
  'dual: deleting driver must keep user for rider',
);
assert(
  softDeleteOrKeep(false) === 'softDelete',
  'solo driver delete must soft-delete user',
);

console.log('soft-delete-sibling.check: ok');
