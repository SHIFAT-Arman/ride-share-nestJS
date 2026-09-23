import {
  TESTIMONIAL_MAX,
  TESTIMONIAL_MIN,
  testimonialCountError,
} from './testimonial-count';

describe('testimonialCountError', () => {
  it('blocks create at the maximum', () => {
    expect(testimonialCountError(TESTIMONIAL_MAX, 'create')).toMatch(/9/);
    expect(testimonialCountError(TESTIMONIAL_MAX - 1, 'create')).toBeNull();
  });

  it('blocks delete at the minimum', () => {
    expect(testimonialCountError(TESTIMONIAL_MIN, 'delete')).toMatch(/6/);
    expect(testimonialCountError(TESTIMONIAL_MIN + 1, 'delete')).toBeNull();
  });
});
