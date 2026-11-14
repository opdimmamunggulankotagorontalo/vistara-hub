import test from 'node:test';
import assert from 'node:assert/strict';
import { searchGlobalContent } from './globalSearch';

test('returns suggested news, events, and programs when query is empty', () => {
  const res = searchGlobalContent('');
  assert.ok(res.results.length > 0);
  assert.ok(res.counts.berita > 0);
  assert.ok(res.counts.event > 0);
  assert.ok(res.counts.program > 0);
  assert.equal(res.counts.all, res.counts.berita + res.counts.event + res.counts.program);
});

test('finds matching news, events, and programs for shared keyword VISTARA', () => {
  const res = searchGlobalContent('VISTARA');
  const types = new Set(res.results.map((r) => r.type));
  assert.ok(types.has('berita'));
  assert.ok(types.has('event'));
  assert.ok(types.has('program'));
});

test('filters results accurately by category tab', () => {
  const onlyEvents = searchGlobalContent('VISTARA', 'event');
  assert.ok(onlyEvents.results.length > 0);
  assert.ok(onlyEvents.results.every((r) => r.type === 'event'));
  assert.ok(onlyEvents.counts.berita > 0);
  assert.ok(onlyEvents.counts.program > 0);
});

test('ranks exact title matches ahead of description-only matches', () => {
  const res = searchGlobalContent('Trash to Cash', 'program');
  assert.ok(res.results.length >= 1);
  assert.equal(res.results[0].title, 'Trash to Cash');
  assert.equal(res.results[0].href, '/beranda/program-kerja/trash-to-cash');
});

test('supports multi-word search across program commission and title', () => {
  const res = searchGlobalContent('Razia Komisi 1');
  assert.ok(res.results.some((r) => r.href === '/beranda/program-kerja/razia-rutin-2-minggu'));
});

test('returns empty results cleanly when nothing matches', () => {
  const res = searchGlobalContent('zzzznonexistentkeyword123');
  assert.equal(res.results.length, 0);
  assert.equal(res.counts.all, 0);
});
