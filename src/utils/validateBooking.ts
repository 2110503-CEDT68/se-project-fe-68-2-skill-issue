export function validateBookingDate(date: string, time: string): string | null {
  const [y, m, d] = date.split('-').map(Number);
  if (
    new Date(y, m - 1, d) < new Date(2022, 4, 10) ||
    new Date(y, m - 1, d) > new Date(2022, 4, 13)
  ) {
    return 'Date must be between May 10–13, 2022.';
  }
  const [h, min] = time.split(':').map(Number);
  if (h < 9 || h > 17 || (h === 17 && min > 0)) {
    return 'Time must be between 09:00 and 17:00.';
  }
  return null;
}