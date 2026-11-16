import type { AdminModule, AdminRole } from '../types';

export interface AdminRoleMeta {
  role: AdminRole;
  label: string;
  shortLabel: string;
  description: string;
  allowedModules: AdminModule[];
}

export const ADMIN_ROLES_META: Record<AdminRole, AdminRoleMeta> = {
  root: {
    role: 'root',
    label: 'Super Admin (Administrator Root)',
    shortLabel: 'Super Admin',
    description:
      'Kontrol penuh seluruh konten, Anggota OPDIM, dan pengelolaan akun admin pengurus.',
    allowedModules: [
      'events',
      'arsip',
      'prestasi',
      'aspirasi',
      'polling',
      'berita',
      'galeri',
      'anggota',
      'notifikasi',
      'accounts',
    ],
  },
  inti: {
    role: 'inti',
    label: 'Pengurus Inti OPDIM',
    shortLabel: 'Pengurus Inti',
    description:
      'Ketua & Sekretaris OPDIM — mengelola konten, data Anggota OPDIM, serta akun pengurus non-root.',
    allowedModules: [
      'events',
      'arsip',
      'prestasi',
      'aspirasi',
      'polling',
      'berita',
      'galeri',
      'anggota',
      'notifikasi',
      'accounts',
    ],
  },
  komisi4: {
    role: 'komisi4',
    label: 'Komisi 4 — Aspirasi Siswa',
    shortLabel: 'Komisi 4',
    description: 'Mengelola tindak lanjut Kotak Aspirasi Siswa dan topik Polling Siswa.',
    allowedModules: ['aspirasi', 'polling'],
  },
  komisi5: {
    role: 'komisi5',
    label: 'Komisi 5 — Media & Humas',
    shortLabel: 'Komisi 5',
    description: 'Mengelola publikasi artikel Berita, album Galeri, Prestasi, dan Anggota OPDIM.',
    allowedModules: ['berita', 'galeri', 'prestasi', 'anggota'],
  },
};

export const ADMIN_MODULE_LABELS: Record<AdminModule, string> = {
  events: 'Agenda Event',
  arsip: 'Arsip Dokumen',
  prestasi: 'Prestasi',
  aspirasi: 'Aspirasi',
  polling: 'Polling Siswa',
  berita: 'Berita',
  galeri: 'Galeri',
  anggota: 'Anggota OPDIM',
  notifikasi: 'Notifikasi TARA',
  accounts: 'Kelola Akun',
};

export function canAccessModule(role: AdminRole, module: AdminModule): boolean {
  return ADMIN_ROLES_META[role]?.allowedModules.includes(module) ?? false;
}

export function getDefaultModuleForRole(role: AdminRole): AdminModule {
  return ADMIN_ROLES_META[role]?.allowedModules[0] ?? 'aspirasi';
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUsernameFormat(input: string): string | null {
  const clean = normalizeUsername(input);
  if (!clean) return 'Username wajib diisi.';
  if (clean.length < 3 || clean.length > 32) {
    return 'Username harus terdiri dari 3 hingga 32 karakter.';
  }
  if (!/^[a-z0-9._-]+$/.test(clean)) {
    return 'Username hanya boleh berisi huruf kecil, angka, titik (.), garis bawah (_), atau tanda hubung (-).';
  }
  return null;
}

export function validatePasswordStrength(password: string): string | null {
  if (!password) return 'Password wajib diisi.';
  if (password.length > 72) {
    return 'Password maksimal 72 karakter.';
  }
  return null;
}

export function slugifyText(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 72) || `item-${Date.now()}`
  );
}

export function formatBytesReadable(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
