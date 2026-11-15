import type { EventItem } from '../types';
import { richTextToPlainText } from './richText';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function escapeIcsText(input: string): string {
  return String(input || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * Formats a Date into UTC iCalendar stamp: YYYYMMDDTHHMMSSZ
 */
function formatUtcStamp(date: Date): string {
  return (
    date.getUTCFullYear() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    'T' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Parses event date (YYYY-MM-DD) and WITA (UTC+8) time range strings such as:
 * - "08.00–12.00"
 * - "09:00 - 15:30"
 * - "07.30–Selesai"
 */
export function parseEventWitaRange(dateStr: string, timeStr: string): {
  startUtc: Date | null;
  endUtc: Date | null;
} {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!dateMatch) {
    return { startUtc: null, endUtc: null };
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  const timeMatches = [...timeStr.matchAll(/(\d{1,2})[.:](\d{2})/g)];
  if (timeMatches.length === 0) {
    // Default full-day window 08:00-12:00 WITA
    const startUtc = new Date(Date.UTC(year, month - 1, day, 8 - 8, 0, 0));
    const endUtc = new Date(Date.UTC(year, month - 1, day, 12 - 8, 0, 0));
    return { startUtc, endUtc };
  }

  const startHour = Number(timeMatches[0][1]);
  const startMin = Number(timeMatches[0][2]);
  // Convert WITA (UTC+8) -> UTC
  const startUtc = new Date(Date.UTC(year, month - 1, day, startHour - 8, startMin, 0));

  let endUtc: Date;
  if (timeMatches.length >= 2) {
    const endHour = Number(timeMatches[1][1]);
    const endMin = Number(timeMatches[1][2]);
    endUtc = new Date(Date.UTC(year, month - 1, day, endHour - 8, endMin, 0));
    if (endUtc <= startUtc) {
      endUtc = new Date(startUtc.getTime() + 2 * 60 * 60 * 1000);
    }
  } else {
    endUtc = new Date(startUtc.getTime() + 2 * 60 * 60 * 1000);
  }

  return { startUtc, endUtc };
}

export function generateEventIcs(event: EventItem, dtStampDate = new Date()): string {
  const { startUtc, endUtc } = parseEventWitaRange(event.date, event.time);
  const uid = `${event.slug || event.id}@vistara.opdim.mam.id`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OPDIM VISTARA//VISTARA Hub Calendar//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${formatUtcStamp(dtStampDate)}`,
  ];

  if (startUtc && endUtc) {
    lines.push(`DTSTART:${formatUtcStamp(startUtc)}`);
    lines.push(`DTEND:${formatUtcStamp(endUtc)}`);
  } else {
    const compactDate = event.date.replace(/-/g, '');
    lines.push(`DTSTART;VALUE=DATE:${compactDate}`);
    lines.push(`DTEND;VALUE=DATE:${compactDate}`);
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  const plainDescription = richTextToPlainText(event.description);
  lines.push(
    `DESCRIPTION:${escapeIcsText(
      `${plainDescription}\n\nKategori: ${event.category} | Waktu: ${event.time} WITA — OPDIM VISTARA 2026–2027`
    )}`
  );
  lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  lines.push(`CATEGORIES:${escapeIcsText(event.category)}`);
  lines.push('STATUS:CONFIRMED');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n') + '\r\n';
}

export function downloadEventIcs(event: EventItem): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return false;
  }

  const content = generateEventIcs(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${event.slug || event.id}.ics`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);

  return true;
}
