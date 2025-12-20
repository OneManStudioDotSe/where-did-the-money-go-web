import type { AppSettings } from '../components/SettingsPanel';

type DateFormat = AppSettings['dateFormat'];

/**
 * Formats a date according to the specified format setting
 */
export function formatDate(date: Date, format: DateFormat): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Formats a date with month name (e.g., "Dec 21, 2025" or "21 Dec 2025")
 */
export function formatDateWithMonth(date: Date, format: DateFormat): string {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();

  // For US format, use "Month Day, Year"
  if (format === 'MM/DD/YYYY') {
    return `${month} ${day}, ${year}`;
  }
  // For all other formats, use "Day Month Year"
  return `${day} ${month} ${year}`;
}

/**
 * Formats a date range (e.g., "Dec 1 - Dec 31, 2025")
 */
export function formatDateRange(start: Date, end: Date, format: DateFormat): string {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return format === 'MM/DD/YYYY'
        ? `${startMonth} ${startDay} - ${endDay}, ${startYear}`
        : `${startDay} - ${endDay} ${startMonth} ${startYear}`;
    }
    return format === 'MM/DD/YYYY'
      ? `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`
      : `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  }

  return format === 'MM/DD/YYYY'
    ? `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`
    : `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}
