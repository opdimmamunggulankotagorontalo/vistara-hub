import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeIcsText, generateEventIcs, parseEventWitaRange } from './icsCalendar.ts';
import type { EventItem } from '../types/index.ts';

const sampleEvent: EventItem = {
  id: 'e1',
  slug: 'pelantikan-pengurus-vistara',
  title: 'Pelantikan Pengurus OPDIM VISTARA, 2026',
  description: 'Pelantikan resmi; sesi serah terima jabatan\nAula Utama',
  date: '2026-10-15',
  time: '08.00–12.00',
  location: 'Aula Utama MAM Unggulan Kota Gorontalo',
  category: 'Organisasi',
  status: 'upcoming',
};

test('parseEventWitaRange converts WITA (UTC+8) range cleanly to UTC', () => {
  const { startUtc, endUtc } = parseEventWitaRange('2026-10-15', '08.00–12.00');
  assert.ok(startUtc);
  assert.ok(endUtc);
  assert.equal(startUtc.toISOString(), '2026-10-15T00:00:00.000Z');
  assert.equal(endUtc.toISOString(), '2026-10-15T04:00:00.000Z');
});

test('parseEventWitaRange handles open-ended "Selesai" times with 2h default duration', () => {
  const { startUtc, endUtc } = parseEventWitaRange('2026-10-20', '09.30–Selesai');
  assert.ok(startUtc);
  assert.ok(endUtc);
  assert.equal(startUtc.toISOString(), '2026-10-20T01:30:00.000Z');
  assert.equal(endUtc.toISOString(), '2026-10-20T03:30:00.000Z');
});

test('escapeIcsText escapes commas, semicolons, backslashes, and newlines', () => {
  assert.equal(escapeIcsText('A, B; C\\D\nE'), 'A\\, B\\; C\\\\D\\nE');
});

test('generateEventIcs produces RFC 5545 compliant CRLF VCALENDAR payload', () => {
  const fixedStamp = new Date('2026-10-01T00:00:00.000Z');
  const ics = generateEventIcs(sampleEvent, fixedStamp);

  assert.ok(ics.includes('\r\n'));
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('UID:pelantikan-pengurus-vistara@vistara.opdim.mam.id\r\n'));
  assert.ok(ics.includes('DTSTAMP:20261001T000000Z\r\n'));
  assert.ok(ics.includes('DTSTART:20261015T000000Z\r\n'));
  assert.ok(ics.includes('DTEND:20261015T040000Z\r\n'));
  assert.ok(ics.includes('SUMMARY:Pelantikan Pengurus OPDIM VISTARA\\, 2026\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
});
