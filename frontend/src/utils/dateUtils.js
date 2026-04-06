/**
 * Date utilities for BudgetFlow.
 *
 * Stored format in DB: YYYY-MM-DD  (pure date, no time)
 * Display format:      DD/MM/YYYY
 */

/**
 * Extract the YYYY-MM-DD portion from any date string.
 * Handles "YYYY-MM-DD", "YYYY-MM-DD HH:MM:SS", "YYYY-MM-DDTHH:MM:SS.sssZ"
 */
export const toDateKey = (str) => {
  if (!str) return '';
  return String(str).split('T')[0].split(' ')[0];
};

/**
 * Format any date string as DD/MM/YYYY for display.
 */
export const formatDate = (str) => {
  const key = toDateKey(str);
  if (!key || key === 'Unknown') return '';
  try {
    const [yyyy, mm, dd] = key.split('-');
    if (!yyyy || !mm || !dd) return key;
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return key;
  }
};

/**
 * Return today's date as YYYY-MM-DD.
 */
export const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Given a YYYY-MM-DD key, return { weekday, dateStr } for grouping headers.
 * weekday → "Monday", "Tuesday", …
 * dateStr → "06/04/2026"
 */
export const formatDayHeader = (dateKey) => {
  try {
    const d = new Date(dateKey + 'T00:00:00');
    return {
      weekday: d.toLocaleDateString('en-GB', { weekday: 'long' }),
      dateStr: formatDate(dateKey),
    };
  } catch {
    return { weekday: dateKey, dateStr: '' };
  }
};
