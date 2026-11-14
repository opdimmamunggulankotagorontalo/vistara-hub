import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessModule,
  getDefaultModuleForRole,
  normalizeUsername,
  validateUsernameFormat,
  validatePasswordStrength,
  slugifyText,
  formatBytesReadable,
} from './adminAuth';
import { calculate1080pDimensions } from './imageOptimizer';

test('Super Admin (root) has access to all modules including accounts and prestasi', () => {
  assert.equal(canAccessModule('root', 'accounts'), true);
  assert.equal(canAccessModule('root', 'events'), true);
  assert.equal(canAccessModule('root', 'arsip'), true);
  assert.equal(canAccessModule('root', 'prestasi'), true);
  assert.equal(canAccessModule('root', 'aspirasi'), true);
  assert.equal(canAccessModule('root', 'polling'), true);
  assert.equal(canAccessModule('root', 'berita'), true);
  assert.equal(canAccessModule('root', 'galeri'), true);
  assert.equal(getDefaultModuleForRole('root'), 'accounts');
});

test('Pengurus Inti has content access including prestasi but NOT accounts', () => {
  assert.equal(canAccessModule('inti', 'accounts'), false);
  assert.equal(canAccessModule('inti', 'events'), true);
  assert.equal(canAccessModule('inti', 'arsip'), true);
  assert.equal(canAccessModule('inti', 'prestasi'), true);
  assert.equal(canAccessModule('inti', 'aspirasi'), true);
  assert.equal(canAccessModule('inti', 'polling'), true);
  assert.equal(canAccessModule('inti', 'berita'), true);
  assert.equal(canAccessModule('inti', 'galeri'), true);
  assert.equal(getDefaultModuleForRole('inti'), 'events');
});

test('Komisi 4 only has access to aspirasi and polling', () => {
  assert.equal(canAccessModule('komisi4', 'aspirasi'), true);
  assert.equal(canAccessModule('komisi4', 'polling'), true);
  assert.equal(canAccessModule('komisi4', 'prestasi'), false);
  assert.equal(canAccessModule('komisi4', 'berita'), false);
  assert.equal(canAccessModule('komisi4', 'galeri'), false);
  assert.equal(canAccessModule('komisi4', 'events'), false);
  assert.equal(canAccessModule('komisi4', 'arsip'), false);
  assert.equal(canAccessModule('komisi4', 'accounts'), false);
  assert.equal(getDefaultModuleForRole('komisi4'), 'aspirasi');
});

test('Komisi 5 has access to berita, galeri, and prestasi only', () => {
  assert.equal(canAccessModule('komisi5', 'berita'), true);
  assert.equal(canAccessModule('komisi5', 'galeri'), true);
  assert.equal(canAccessModule('komisi5', 'prestasi'), true);
  assert.equal(canAccessModule('komisi5', 'aspirasi'), false);
  assert.equal(canAccessModule('komisi5', 'polling'), false);
  assert.equal(canAccessModule('komisi5', 'events'), false);
  assert.equal(canAccessModule('komisi5', 'arsip'), false);
  assert.equal(canAccessModule('komisi5', 'accounts'), false);
  assert.equal(getDefaultModuleForRole('komisi5'), 'berita');
});

test('Username and password validators enforce safe constraints', () => {
  assert.equal(normalizeUsername('  SuperAdmin '), 'superadmin');
  assert.equal(validateUsernameFormat('ketua.opdim'), null);
  assert.notEqual(validateUsernameFormat('ab'), null);
  assert.notEqual(validateUsernameFormat('nama spasi'), null);
  assert.equal(validatePasswordStrength('Vistara#2026'), null);
  assert.notEqual(validatePasswordStrength('short7'), null);
});

test('calculate1080pDimensions caps 4K landscape and portrait images cleanly without upscaling smaller images', () => {
  const uhd = calculate1080pDimensions(3840, 2160);
  assert.deepEqual(uhd, { width: 1920, height: 1080, resized: true });

  const portrait = calculate1080pDimensions(2160, 3840);
  assert.deepEqual(portrait, { width: 608, height: 1080, resized: true });

  const ultrawide = calculate1080pDimensions(2560, 1000);
  assert.deepEqual(ultrawide, { width: 1920, height: 750, resized: true });

  const small = calculate1080pDimensions(1280, 720);
  assert.deepEqual(small, { width: 1280, height: 720, resized: false });
});

test('slugifyText and formatBytesReadable produce clean URL slugs and readable file sizes', () => {
  assert.equal(slugifyText('VISTARA Talks #3: AI & Pelajar!'), 'vistara-talks-3-ai-pelajar');
  assert.equal(formatBytesReadable(512000), '500 KB');
  assert.equal(formatBytesReadable(1572864), '1.5 MB');
});
