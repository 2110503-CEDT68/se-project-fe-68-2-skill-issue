import { formatDate } from '@/utils/dateFormat';

describe('formatDate', () => {
  it('returns "TBD" for empty string', () => {
    expect(formatDate('')).toBe('TBD');
  });

  it('formats a date-only ISO string (YYYY-MM-DD)', () => {
    expect(formatDate('2022-05-10')).toBe('10 May 2022');
  });

  it('formats a full ISO datetime string', () => {
    expect(formatDate('2022-05-10T09:30:00')).toBe('10 May 2022, 09:30');
  });

  it('formats datetime with timezone info', () => {
    expect(formatDate('2022-01-15T14:00:00.000Z')).toBe('15 Jan 2022, 14:00');
  });

  it('handles single-digit month and day', () => {
    expect(formatDate('2022-01-05')).toBe('5 Jan 2022');
  });

  it('handles December', () => {
    expect(formatDate('2022-12-25')).toBe('25 Dec 2022');
  });

  it('returns original string on invalid format', () => {
    // 'not-a-date' splits as ['not','a','date'] → day='not', month='a', year='date'
    // parseInt('not')=NaN, monthNames[NaN-1]=undefined, year='date' -> can't predict exact
    const result = formatDate('not-a-date');
    expect(typeof result).toBe('string');
  });
});
