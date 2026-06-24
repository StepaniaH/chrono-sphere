import { DateTime } from 'luxon';

/**
 * Convert an IANA timezone name (e.g. 'Asia/Shanghai') to a compact UTC offset
 * notation suitable for display on share cards.
 *
 * Examples:
 *   utcOffsetLabel('Asia/Shanghai') → 'UTC+8'
 *   utcOffsetLabel('America/New_York') → 'UTC-5'
 *   utcOffsetLabel('Asia/Kolkata') → 'UTC+5:30'
 *   utcOffsetLabel('UTC') → 'UTC'
 */
export function utcOffsetLabel(zone: string): string {
  try {
    const dt = DateTime.now().setZone(zone);
    const offset = dt.offset; // minutes east of UTC

    if (offset === 0) return 'UTC';

    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;

    if (minutes === 0) return `UTC${sign}${hours}`;
    return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
  } catch {
    // Fallback: strip city from IANA name
    const parts = zone.split('/');
    return parts[parts.length - 1] || zone;
  }
}
