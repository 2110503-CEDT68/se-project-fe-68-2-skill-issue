import { timeOptions } from '@/utils/timeOptions';

describe('timeOptions', () => {
  it('returns an array of time strings', () => {
    const opts = timeOptions();
    expect(Array.isArray(opts)).toBe(true);
    expect(opts.length).toBeGreaterThan(0);
  });

  it('starts at 09:00', () => {
    const opts = timeOptions();
    expect(opts[0]).toBe('09:00');
  });

  it('ends at 17:00', () => {
    const opts = timeOptions();
    expect(opts[opts.length - 1]).toBe('17:00');
  });

  it('includes half-hour intervals except at 17', () => {
    const opts = timeOptions();
    expect(opts).toContain('09:30');
    expect(opts).toContain('10:00');
    expect(opts).toContain('10:30');
    expect(opts).toContain('16:30');
    expect(opts).not.toContain('17:30');
  });

  it('has 17 entries (9–16 × 2 + 17:00)', () => {
    // 9h: 09:00, 09:30 ... 16h: 16:00, 16:30, 17h: 17:00
    const opts = timeOptions();
    expect(opts.length).toBe(17);
  });
});
