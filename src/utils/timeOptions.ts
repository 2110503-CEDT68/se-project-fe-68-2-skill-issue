export function timeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 9; h <= 17; h++) {
    const hStr = String(h).padStart(2, '0');
    opts.push(`${hStr}:00`);
    if (h !== 17) opts.push(`${hStr}:30`);
  }
  return opts;
}