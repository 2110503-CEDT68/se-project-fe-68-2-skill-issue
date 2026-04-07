export function formatDate(iso: string): string {
  if (!iso) return 'TBD';
  try {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (iso.length > 10) {
      const [datePart, timePart] = iso.split('T');
      const [year, month, day] = datePart.split('-');
      const time = timePart?.slice(0, 5) || '00:00';
      return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}, ${time}`;
    }
    const [year, month, day] = iso.split('-');
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
  } catch {
    return iso;
  }
}