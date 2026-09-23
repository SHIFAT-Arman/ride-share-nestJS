export const TESTIMONIAL_MIN = 6;
export const TESTIMONIAL_MAX = 9;

/** Null when the write is allowed. */
export function testimonialCountError(
  count: number,
  action: 'create' | 'delete',
): string | null {
  if (action === 'create' && count >= TESTIMONIAL_MAX) {
    return `At most ${TESTIMONIAL_MAX} testimonials.`;
  }
  if (action === 'delete' && count <= TESTIMONIAL_MIN) {
    return `At least ${TESTIMONIAL_MIN} testimonials.`;
  }
  return null;
}
