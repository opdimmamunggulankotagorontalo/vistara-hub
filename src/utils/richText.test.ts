import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRichTextStats,
  isSafeHref,
  plainTextToEditableHtml,
  richTextToPlainText,
  sanitizeRichHtml,
} from './richText.ts';

test('sanitizeRichHtml strips script tags, inline event handlers, and unsafe hrefs', () => {
  const dirty =
    '<p onclick="alert(1)">Halo <b>OPDIM</b> <a href="javascript:alert(1)">bahaya</a> <a href="https://vistara.id">aman</a></p><script>evil()</script>';
  const cleaned = sanitizeRichHtml(dirty);
  assert.equal(cleaned.includes('<script'), false);
  assert.equal(cleaned.includes('onclick'), false);
  assert.equal(cleaned.includes('javascript:'), false);
  assert.equal(cleaned.includes('<b>OPDIM</b>'), true);
  assert.equal(cleaned.includes('href="https://vistara.id"'), true);
});

test('isSafeHref accepts https, http, mailto, relative paths, and normalizes bare domains', () => {
  assert.equal(isSafeHref('https://mamunggulan.sch.id'), 'https://mamunggulan.sch.id');
  assert.equal(isSafeHref('/beranda/event'), '/beranda/event');
  assert.equal(isSafeHref('opdim.sch.id/info'), 'https://opdim.sch.id/info');
  assert.equal(isSafeHref('javascript:void(0)'), null);
  assert.equal(isSafeHref('data:text/html,hi'), null);
});

test('plainTextToEditableHtml upgrades legacy newline paragraphs cleanly and richTextToPlainText extracts plain copy', () => {
  const legacy = 'Paragraf pertama.\nBaris kedua.\n\nParagraf kedua.';
  const html = plainTextToEditableHtml(legacy);
  assert.equal(html, '<p>Paragraf pertama.<br>Baris kedua.</p><p>Paragraf kedua.</p>');
  const plain = richTextToPlainText('<h2>Judul</h2><ul><li>Satu</li><li>Dua</li></ul>');
  assert.match(plain, /Judul/);
  assert.match(plain, /• Satu/);
  assert.match(plain, /• Dua/);
});

test('getRichTextStats counts words, characters, and reading minutes accurately', () => {
  const stats = getRichTextStats('<p>Satu dua <strong>tiga empat</strong> lima.</p>');
  assert.equal(stats.words, 5);
  assert.equal(stats.chars > 20, true);
  assert.equal(stats.readingMinutes, 1);
  assert.deepEqual(getRichTextStats(''), { words: 0, chars: 0, readingMinutes: 0 });
});
