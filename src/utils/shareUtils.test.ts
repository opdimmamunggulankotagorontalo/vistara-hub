import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsAppShareUrl, formatShareMessage } from './shareUtils.ts';

test('formatShareMessage structures VISTARA Hub WhatsApp message cleanly', () => {
  const msg = formatShareMessage({
    title: 'Pelantikan VISTARA 2026',
    summary: 'Pengurus resmi OPDIM periode 2026–2027 resmi dilantik.',
    url: 'https://vistara-hub.example/beranda/berita/pelantikan',
    tag: 'Berita VISTARA',
  });

  assert.ok(msg.includes('[Berita VISTARA] *Pelantikan VISTARA 2026*'));
  assert.ok(msg.includes('Pengurus resmi OPDIM periode 2026–2027 resmi dilantik.'));
  assert.ok(msg.includes('https://vistara-hub.example/beranda/berita/pelantikan'));
});

test('buildWhatsAppShareUrl returns properly encoded wa.me URL', () => {
  const href = buildWhatsAppShareUrl({
    title: 'Agenda & Lomba',
    url: 'https://vistara.id/event?highlight=lomba',
  });

  assert.ok(href.startsWith('https://wa.me/?text='));
  const decoded = decodeURIComponent(href.replace('https://wa.me/?text=', ''));
  assert.ok(decoded.includes('*Agenda & Lomba*'));
  assert.ok(decoded.includes('https://vistara.id/event?highlight=lomba'));
});
