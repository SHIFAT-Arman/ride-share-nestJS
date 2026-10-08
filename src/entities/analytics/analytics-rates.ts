/** Pure rate helpers for analytics KPIs. */

export function completionRate(
  completed: number,
  cancelled: number,
): number {
  const denom = completed + cancelled;
  return denom === 0 ? 0 : completed / denom;
}

export function cancellationRate(
  completed: number,
  cancelled: number,
): number {
  const denom = completed + cancelled;
  return denom === 0 ? 0 : cancelled / denom;
}

export function ratedShare(
  ratingCount: number,
  completedRides: number,
): number {
  return completedRides === 0 ? 0 : ratingCount / completedRides;
}
