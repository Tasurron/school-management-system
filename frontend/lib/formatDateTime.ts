// Built by hand instead of relying on toLocaleString(), since its time-of-day output
// (12-hour vs 24-hour, AM/PM casing) depends on the browser/OS locale and isn't consistent
// across machines. The date part keeps using the locale's short date format (e.g. "8/22/2026")
// since that part already displays correctly everywhere.
export function formatDeadline(isoString: string): string {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString();
  const timePart = formatTime12Hour(date);
  return `${datePart}, ${timePart}`;
}

export function formatTime12Hour(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const period = date.getHours() < 12 ? "AM" : "PM";
  const hours = date.getHours() % 12 || 12;
  return `${pad(hours)}:${pad(date.getMinutes())} ${period}`;
}
