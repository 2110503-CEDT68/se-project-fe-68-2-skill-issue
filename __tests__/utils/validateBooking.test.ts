import { validateBookingDate } from '@/utils/validateBooking';

describe('validateBookingDate', () => {
  // === Valid dates ===
  it('returns null for a valid date and time (May 10, 09:00)', () => {
    expect(validateBookingDate('2022-05-10', '09:00')).toBeNull();
  });

  it('returns null for May 13, 17:00', () => {
    expect(validateBookingDate('2022-05-13', '17:00')).toBeNull();
  });

  it('returns null for May 11, 12:30', () => {
    expect(validateBookingDate('2022-05-11', '12:30')).toBeNull();
  });

  // === Invalid dates ===
  it('returns error for date before May 10', () => {
    const result = validateBookingDate('2022-05-09', '09:00');
    expect(result).toBe('Date must be between May 10–13, 2022.');
  });

  it('returns error for date after May 13', () => {
    const result = validateBookingDate('2022-05-14', '09:00');
    expect(result).toBe('Date must be between May 10–13, 2022.');
  });

  it('returns error for completely out-of-range date', () => {
    const result = validateBookingDate('2023-01-01', '10:00');
    expect(result).toBe('Date must be between May 10–13, 2022.');
  });

  // === Invalid times ===
  it('returns error for time before 09:00', () => {
    const result = validateBookingDate('2022-05-10', '08:00');
    expect(result).toBe('Time must be between 09:00 and 17:00.');
  });

  it('returns error for time after 17:00', () => {
    const result = validateBookingDate('2022-05-10', '18:00');
    expect(result).toBe('Time must be between 09:00 and 17:00.');
  });

  it('returns error for 17:30 (past 17:00)', () => {
    const result = validateBookingDate('2022-05-10', '17:30');
    expect(result).toBe('Time must be between 09:00 and 17:00.');
  });
});
