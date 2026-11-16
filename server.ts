import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { INITIAL_ANGGOTA_OPDIM } from './src/data/anggotaSeed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

type AdminRole = 'root' | 'inti' | 'komisi4' | 'komisi5';

interface AuthenticatedAccount {
  id: string;
  username: string;
  fullName: string;
  jabatan: string;
  role: AdminRole;
  mustChangePassword: boolean;
  isActive: boolean;
}

const VALID_ADMIN_ROLES = new Set<AdminRole>(['root', 'inti', 'komisi4', 'komisi5']);
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const LOCKOUT_DURATION_MS = 1000 * 60 * 5; // 5 minutes
const MAX_FAILED_ATTEMPTS = 5;

// ── Ensure SQLite persistent data & upload directories exist ─────
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const db = new DatabaseSync(path.join(DATA_DIR, 'vistara.db'));
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS aspirasi (
    id TEXT PRIMARY KEY,
    kode_lacak TEXT UNIQUE NOT NULL,
    jenis TEXT NOT NULL,
    kategori TEXT NOT NULL,
    judul TEXT NOT NULL,
    isi TEXT NOT NULL,
    is_anonim INTEGER NOT NULL DEFAULT 1,
    nama_pengirim TEXT,
    kelas_pengirim TEXT,
    tanggal TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Diterima',
    tanggapan_resmi TEXT,
    penindaklanjut TEXT,
    riwayat_status TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_aspirasi_kode ON aspirasi (kode_lacak);
  CREATE INDEX IF NOT EXISTS idx_aspirasi_created ON aspirasi (created_at DESC);

  CREATE TABLE IF NOT EXISTS event_reminders (
    client_key TEXT NOT NULL,
    event_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (client_key, event_id)
  );

  CREATE TABLE IF NOT EXISTS polling_topics (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    question TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    closes_at TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS polling_options (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    label TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming',
    thumbnail TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    cover_image TEXT NOT NULL DEFAULT '',
    image_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS berita (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    author TEXT NOT NULL,
    thumbnail TEXT,
    content TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS arsip (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    jenis TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    ukuran TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    file_url TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prestasi (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tingkat TEXT NOT NULL,
    kategori TEXT NOT NULL,
    peraih TEXT NOT NULL,
    tahun TEXT NOT NULL,
    medali TEXT NOT NULL,
    penyelenggara TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    created_at INTEGER NOT NULL
  );
`);

// Idempotent column migration for existing SQLite databases
const prestasiCols = db.prepare('PRAGMA table_info(prestasi)').all() as Array<{ name: string }>;
const prestasiColNames = new Set(prestasiCols.map((c) => c.name));
if (!prestasiColNames.has('description')) {
  db.exec('ALTER TABLE prestasi ADD COLUMN description TEXT;');
}
if (!prestasiColNames.has('thumbnail')) {
  db.exec('ALTER TABLE prestasi ADD COLUMN thumbnail TEXT;');
}

db.exec(`

  DROP TABLE IF EXISTS admin_roles;

  CREATE TABLE IF NOT EXISTS admin_accounts (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    must_change_password INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_login_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS anggota_opdim (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    unit TEXT NOT NULL,
    peran_level TEXT NOT NULL,
    tugas_utama TEXT NOT NULL DEFAULT '',
    foto_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'pengumuman',
    target_path TEXT NOT NULL DEFAULT '/beranda',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL,
    expires_at TEXT,
    created_at INTEGER NOT NULL
  );
`);

// Seed initial Anggota OPDIM from revised Struktur OPDIM VISTARA 2026-2027 if empty
const anggotaCountRow = db.prepare('SELECT COUNT(*) AS count FROM anggota_opdim').get() as { count: number };
if (anggotaCountRow.count === 0) {
  const seedNow = Date.now();
  const insertAnggotaStmt = db.prepare(`
    INSERT INTO anggota_opdim (
      id, full_name, jabatan, unit, peran_level, tugas_utama, foto_url, sort_order, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of INITIAL_ANGGOTA_OPDIM) {
    insertAnggotaStmt.run(
      item.id,
      item.fullName,
      item.jabatan,
      item.unit,
      item.peranLevel,
      item.tugasUtama || '',
      item.fotoUrl || '',
      item.sortOrder,
      item.isActive ? 1 : 0,
      seedNow,
      seedNow
    );
  }
}

// Remove previously seeded dummy rows so the portal starts clean without dummy content
db.exec(`
  DELETE FROM aspirasi WHERE id IN ('asp-1', 'asp-2', 'asp-3', 'asp-4');
  DELETE FROM polling_options WHERE poll_id IN ('poll-1', 'poll-2');
  DELETE FROM polling_topics WHERE id IN ('poll-1', 'poll-2');
`);

// ── Scrypt Password Hashing & Revocable Session Helpers ────────
function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function issueSessionForAccount(accountId: string): string {
  const now = Date.now();
  db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(now);
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  db.prepare(
    'INSERT INTO admin_sessions (token_hash, account_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(tokenHash, accountId, now + SESSION_TTL_MS, now);
  return rawToken;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  root: 'Super Admin (Administrator Root)',
  inti: 'Pengurus Inti OPDIM',
  komisi4: 'Komisi 4 — Aspirasi Siswa',
  komisi5: 'Komisi 5 — Media & Humas',
};

function getRoleLabel(role: AdminRole): string {
  return ROLE_LABELS[role] || 'Pengurus OPDIM';
}

// Seed ONLY ONE initial Super Admin (Administrator Root) account if table is empty
const accountCountRow = db.prepare('SELECT COUNT(*) AS count FROM admin_accounts').get() as { count: number };
if (accountCountRow.count === 0) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO admin_accounts (
      id, username, full_name, jabatan, role, password_hash, must_change_password, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
  `).run(
    'acc-root-001',
    'superadmin',
    'Administrator Root OPDIM',
    'Administrator Root',
    'root',
    hashPasswordScrypt('VistaraRoot#2026'),
    now,
    now
  );
}

interface SqliteAccountRow {
  id: string;
  username: string;
  full_name: string;
  jabatan: string;
  role: AdminRole;
  password_hash: string;
  must_change_password: number;
  is_active: number;
  failed_attempts: number;
  locked_until: number | null;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
}

function mapAccountPublic(row: SqliteAccountRow) {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    jabatan: row.jabatan,
    role: row.role,
    isActive: Boolean(row.is_active),
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

function extractRequestToken(req: Request): string {
  const raw =
    req.header('X-Admin-Token') ||
    req.header('Authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  return raw.trim();
}

function resolveSessionFromToken(rawToken: string): AuthenticatedAccount | null {
  if (!rawToken || rawToken.length < 16) return null;
  const tokenHash = hashSessionToken(rawToken);
  const now = Date.now();
  const row = db
    .prepare(`
      SELECT a.id, a.username, a.full_name, a.jabatan, a.role, a.must_change_password, a.is_active
      FROM admin_sessions s
      JOIN admin_accounts a ON a.id = s.account_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND a.is_active = 1
      LIMIT 1
    `)
    .get(tokenHash, now) as
    | {
        id: string;
        username: string;
        full_name: string;
        jabatan: string;
        role: AdminRole;
        must_change_password: number;
        is_active: number;
      }
    | undefined;

  if (!row || !VALID_ADMIN_ROLES.has(row.role)) return null;
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    jabatan: row.jabatan,
    role: row.role,
    mustChangePassword: Boolean(row.must_change_password),
    isActive: Boolean(row.is_active),
  };
}

function requireAdminSession(
  req: Request,
  res: Response,
  allowedRoles: AdminRole[],
  allowPendingPassword = false
): AuthenticatedAccount | null {
  const token = extractRequestToken(req);
  const account = resolveSessionFromToken(token);
  if (!account) {
    res.status(401).json({ error: 'Sesi admin tidak valid atau telah berakhir. Silakan masuk kembali.' });
    return null;
  }
  if (account.mustChangePassword && !allowPendingPassword) {
    res.status(403).json({
      error: 'Anda wajib mengganti password awal terlebih dahulu sebelum mengakses modul admin.',
    });
    return null;
  }
  if (!allowedRoles.includes(account.role)) {
    res.status(403).json({ error: 'Akun Anda tidak memiliki izin untuk mengakses modul ini.' });
    return null;
  }
  return account;
}

function slugifyServer(text: string): string {
  return (
    text
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

interface SqliteAspirasiRow {
  id: string;
  kode_lacak: string;
  jenis: string;
  kategori: string;
  judul: string;
  isi: string;
  is_anonim: number;
  nama_pengirim: string | null;
  kelas_pengirim: string | null;
  tanggal: string;
  status: string;
  tanggapan_resmi: string | null;
  penindaklanjut: string | null;
  riwayat_status: string;
  created_at: number;
}

function mapAspirasiRow(row: SqliteAspirasiRow) {
  let riwayat: Array<{ status: string; waktu: string; keterangan: string }> = [];
  try {
    const parsed = JSON.parse(row.riwayat_status);
    if (Array.isArray(parsed)) riwayat = parsed;
  } catch {
    riwayat = [];
  }

  return {
    id: row.id,
    kodeLacak: row.kode_lacak,
    jenis: row.jenis,
    kategori: row.kategori,
    judul: row.judul,
    isi: row.isi,
    isAnonim: Boolean(row.is_anonim),
    namaPengirim: row.nama_pengirim ?? undefined,
    kelasPengirim: row.kelas_pengirim ?? undefined,
    tanggal: row.tanggal,
    status: row.status,
    tanggapanResmi: row.tanggapan_resmi ?? undefined,
    penindaklanjut: row.penindaklanjut ?? undefined,
    riwayatStatus: riwayat,
  };
}

const VALID_JENIS = new Set(['Saran', 'Kritik', 'Ide', 'Pertanyaan', 'Pujian', 'Keluhan']);
const VALID_STATUS = new Set(['Diterima', 'Ditinjau', 'Didiskusikan', 'Tindak Lanjut', 'Selesai']);
const VALID_EVENT_STATUS = new Set(['upcoming', 'ongoing', 'past']);
const VALID_ARSIP_JENIS = new Set(['sk', 'notulen', 'dokumen', 'laporan']);
const VALID_PRESTASI_TINGKAT = new Set(['nasional', 'provinsi', 'kabupaten', 'kota']);
const VALID_PRESTASI_MEDALI = new Set([
  'emas',
  'perak',
  'perunggu',
  'juara1',
  'juara2',
  'juara3',
  'peserta',
]);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '16mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // ── Admin Account Auth & Session Management ─────────────────
  app.post('/api/admin/auth/login', (req, res) => {
    try {
      const username = String(req.body?.username || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi.' });
      }

      const row = db
        .prepare('SELECT * FROM admin_accounts WHERE username = ? LIMIT 1')
        .get(username) as SqliteAccountRow | undefined;

      if (!row) {
        return res.status(401).json({ error: 'Username atau password tidak sesuai.' });
      }

      if (!row.is_active) {
        return res.status(403).json({ error: 'Akun ini telah dinonaktifkan oleh Super Admin.' });
      }

      const now = Date.now();
      if (row.locked_until && row.locked_until > now) {
        const waitSec = Math.max(1, Math.ceil((row.locked_until - now) / 1000));
        return res.status(423).json({
          error: `Terlalu banyak percobaan masuk gagal. Coba lagi dalam ${waitSec} detik.`,
        });
      }

      if (!verifyPasswordScrypt(password, row.password_hash)) {
        const nextAttempts = row.failed_attempts + 1;
        if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
          db.prepare(
            'UPDATE admin_accounts SET failed_attempts = 0, locked_until = ?, updated_at = ? WHERE id = ?'
          ).run(now + LOCKOUT_DURATION_MS, now, row.id);
          return res.status(423).json({
            error: 'Terlalu banyak percobaan gagal. Akun dikunci sementara selama 5 menit.',
          });
        }
        db.prepare(
          'UPDATE admin_accounts SET failed_attempts = ?, updated_at = ? WHERE id = ?'
        ).run(nextAttempts, now, row.id);
        return res.status(401).json({ error: 'Username atau password tidak sesuai.' });
      }

      const token = issueSessionForAccount(row.id);
      db.prepare(
        'UPDATE admin_accounts SET failed_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?'
      ).run(now, now, row.id);

      return res.json({
        session: {
          accountId: row.id,
          username: row.username,
          fullName: row.full_name,
          jabatan: row.jabatan,
          role: row.role,
          roleLabel: getRoleLabel(row.role),
          token,
          mustChangePassword: Boolean(row.must_change_password),
          loggedInAt: now,
        },
      });
    } catch (error) {
      console.error('POST /api/admin/auth/login failed:', error);
      return res.status(500).json({ error: 'Gagal memverifikasi akun admin.' });
    }
  });

  app.get('/api/admin/auth/session', (req, res) => {
    const token = extractRequestToken(req);
    const account = resolveSessionFromToken(token);
    if (!account) {
      return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir.' });
    }
    return res.json({
      session: {
        accountId: account.id,
        username: account.username,
        fullName: account.fullName,
        jabatan: account.jabatan,
        role: account.role,
        roleLabel: getRoleLabel(account.role),
        token,
        mustChangePassword: account.mustChangePassword,
        loggedInAt: Date.now(),
      },
    });
  });

  app.post('/api/admin/auth/logout', (req, res) => {
    try {
      const token = extractRequestToken(req);
      if (token) {
        db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashSessionToken(token));
      }
      return res.json({ ok: true });
    } catch (error) {
      console.error('POST /api/admin/auth/logout failed:', error);
      return res.status(500).json({ error: 'Gagal keluar dari sesi.' });
    }
  });

  app.post('/api/admin/auth/change-password', (req, res) => {
    const account = requireAdminSession(req, res, ['root', 'inti', 'komisi4', 'komisi5'], true);
    if (!account) return;
    try {
      const currentPassword = String(req.body?.currentPassword || '');
      const newPassword = String(req.body?.newPassword || '');
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi.' });
      }
      if (newPassword.length < 1 || newPassword.length > 72) {
        return res.status(400).json({ error: 'Password baru wajib diisi (maksimal 72 karakter).' });
      }
      if (newPassword === currentPassword) {
        return res.status(400).json({ error: 'Password baru tidak boleh sama dengan password lama.' });
      }

      const row = db
        .prepare('SELECT * FROM admin_accounts WHERE id = ? LIMIT 1')
        .get(account.id) as SqliteAccountRow | undefined;

      if (!row || !verifyPasswordScrypt(currentPassword, row.password_hash)) {
        return res.status(401).json({ error: 'Password saat ini tidak sesuai.' });
      }

      const now = Date.now();
      db.prepare('DELETE FROM admin_sessions WHERE account_id = ?').run(row.id);
      const nextToken = issueSessionForAccount(row.id);

      db.prepare(
        'UPDATE admin_accounts SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?'
      ).run(hashPasswordScrypt(newPassword), now, row.id);

      return res.json({
        session: {
          accountId: row.id,
          username: row.username,
          fullName: row.full_name,
          jabatan: row.jabatan,
          role: row.role,
          roleLabel: getRoleLabel(row.role),
          token: nextToken,
          mustChangePassword: false,
          loggedInAt: now,
        },
      });
    } catch (error) {
      console.error('POST /api/admin/auth/change-password failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui password akun.' });
    }
  });

  // ── Super Admin Root & Pengurus Inti Account CRUD ───────────
  app.get('/api/admin/accounts', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti'])) return;
    try {
      const rows = db
        .prepare(`
          SELECT * FROM admin_accounts
          ORDER BY CASE role WHEN 'root' THEN 1 WHEN 'inti' THEN 2 WHEN 'komisi4' THEN 3 ELSE 4 END, created_at ASC
        `)
        .all() as unknown as SqliteAccountRow[];
      return res.json({ accounts: rows.map(mapAccountPublic) });
    } catch (error) {
      console.error('GET /api/admin/accounts failed:', error);
      return res.status(500).json({ error: 'Gagal memuat daftar akun admin.' });
    }
  });

  app.post('/api/admin/accounts', (req, res) => {
    const actor = requireAdminSession(req, res, ['root', 'inti']);
    if (!actor) return;
    try {
      const b = req.body ?? {};
      const username = String(b.username || '').trim().toLowerCase();
      const fullName = String(b.fullName || '').trim();
      const jabatan = String(b.jabatan || '').trim();
      const role = String(b.role || '').trim() as AdminRole;
      const password = String(b.password || '');
      const mustChangePassword = b.mustChangePassword !== false;

      if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        return res.status(400).json({
          error: 'Username harus 3–32 karakter (huruf kecil, angka, titik, _ atau -).',
        });
      }
      if (!fullName || !jabatan) {
        return res.status(400).json({ error: 'Nama lengkap dan jabatan pengurus wajib diisi.' });
      }
      if (!VALID_ADMIN_ROLES.has(role)) {
        return res.status(400).json({ error: 'Divisi / peran akses tidak valid.' });
      }
      if (actor.role !== 'root' && role === 'root') {
        return res.status(403).json({ error: 'Hanya Super Admin (Root) yang dapat membuat akun Super Admin.' });
      }
      if (!password || password.length > 72) {
        return res.status(400).json({ error: 'Password awal wajib diisi (maksimal 72 karakter).' });
      }

      const existing = db
        .prepare('SELECT id FROM admin_accounts WHERE username = ? LIMIT 1')
        .get(username);
      if (existing) {
        return res.status(409).json({ error: `Username "${username}" sudah digunakan.` });
      }

      const now = Date.now();
      const id = `acc-${now}-${Math.floor(100 + Math.random() * 900)}`;

      db.prepare(`
        INSERT INTO admin_accounts (
          id, username, full_name, jabatan, role, password_hash, must_change_password, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        id,
        username,
        fullName,
        jabatan,
        role,
        hashPasswordScrypt(password),
        mustChangePassword ? 1 : 0,
        now,
        now
      );

      const created = db
        .prepare('SELECT * FROM admin_accounts WHERE id = ?')
        .get(id) as SqliteAccountRow;

      return res.status(201).json({ account: mapAccountPublic(created) });
    } catch (error) {
      console.error('POST /api/admin/accounts failed:', error);
      return res.status(500).json({ error: 'Gagal membuat akun pengurus baru.' });
    }
  });

  app.patch('/api/admin/accounts/:id', (req, res) => {
    const actor = requireAdminSession(req, res, ['root', 'inti']);
    if (!actor) return;
    try {
      const targetId = String(req.params.id || '').trim();
      const target = db
        .prepare('SELECT * FROM admin_accounts WHERE id = ? LIMIT 1')
        .get(targetId) as SqliteAccountRow | undefined;

      if (!target) {
        return res.status(404).json({ error: 'Akun pengurus tidak ditemukan.' });
      }

      if (actor.role !== 'root' && target.role === 'root') {
        return res.status(403).json({
          error: 'Akun Super Admin (Root) hanya dapat diubah oleh Administrator Root.',
        });
      }

      const b = req.body ?? {};
      const nextUsername =
        b.username !== undefined ? String(b.username).trim().toLowerCase() : target.username;
      const nextFullName = b.fullName !== undefined ? String(b.fullName).trim() : target.full_name;
      const nextJabatan = b.jabatan !== undefined ? String(b.jabatan).trim() : target.jabatan;
      const nextRole =
        b.role !== undefined && VALID_ADMIN_ROLES.has(String(b.role) as AdminRole)
          ? (String(b.role) as AdminRole)
          : target.role;
      const nextIsActive =
        b.isActive !== undefined ? Boolean(b.isActive) : Boolean(target.is_active);
      const nextNewPassword = b.newPassword !== undefined ? String(b.newPassword) : '';
      const nextMustChange =
        b.mustChangePassword !== undefined
          ? Boolean(b.mustChangePassword)
          : Boolean(target.must_change_password);

      if (actor.role !== 'root' && nextRole === 'root') {
        return res.status(403).json({
          error: 'Pengurus Inti tidak dapat mengubah hak akses menjadi Super Admin (Root).',
        });
      }
      if (!/^[a-z0-9._-]{3,32}$/.test(nextUsername)) {
        return res.status(400).json({
          error: 'Username harus 3–32 karakter (huruf kecil, angka, titik, _ atau -).',
        });
      }
      if (nextUsername !== target.username) {
        const dup = db
          .prepare('SELECT id FROM admin_accounts WHERE username = ? AND id != ? LIMIT 1')
          .get(nextUsername, targetId);
        if (dup) {
          return res.status(409).json({ error: `Username "${nextUsername}" sudah dipakai akun lain.` });
        }
      }
      if (targetId === actor.id && !nextIsActive) {
        return res.status(400).json({
          error: 'Anda tidak dapat menonaktifkan akun yang sedang digunakan.',
        });
      }
      if (!nextFullName || !nextJabatan) {
        return res.status(400).json({ error: 'Nama lengkap dan jabatan tidak boleh kosong.' });
      }
      if (nextNewPassword && nextNewPassword.length > 72) {
        return res.status(400).json({ error: 'Password baru maksimal 72 karakter.' });
      }

      const now = Date.now();
      const nextHash = nextNewPassword ? hashPasswordScrypt(nextNewPassword) : target.password_hash;

      db.prepare(`
        UPDATE admin_accounts
        SET username = ?, full_name = ?, jabatan = ?, role = ?, is_active = ?, password_hash = ?, must_change_password = ?, updated_at = ?
        WHERE id = ?
      `).run(
        nextUsername,
        nextFullName,
        nextJabatan,
        nextRole,
        nextIsActive ? 1 : 0,
        nextHash,
        nextMustChange ? 1 : 0,
        now,
        targetId
      );

      if (!nextIsActive || (targetId !== actor.id && (nextNewPassword || nextUsername !== target.username))) {
        db.prepare('DELETE FROM admin_sessions WHERE account_id = ?').run(targetId);
      }

      const updated = db
        .prepare('SELECT * FROM admin_accounts WHERE id = ?')
        .get(targetId) as SqliteAccountRow;

      return res.json({ account: mapAccountPublic(updated) });
    } catch (error) {
      console.error('PATCH /api/admin/accounts/:id failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui data akun pengurus.' });
    }
  });

  app.delete('/api/admin/accounts/:id', (req, res) => {
    const actor = requireAdminSession(req, res, ['root', 'inti']);
    if (!actor) return;
    try {
      const targetId = String(req.params.id || '').trim();
      if (targetId === actor.id) {
        return res.status(400).json({
          error: 'Anda tidak dapat menghapus akun yang sedang aktif digunakan.',
        });
      }
      const target = db
        .prepare('SELECT role FROM admin_accounts WHERE id = ? LIMIT 1')
        .get(targetId) as { role: AdminRole } | undefined;
      if (!target) {
        return res.status(404).json({ error: 'Akun tidak ditemukan.' });
      }
      if (actor.role !== 'root' && target.role === 'root') {
        return res.status(403).json({
          error: 'Akun Super Admin (Root) hanya dapat dihapus oleh Administrator Root.',
        });
      }
      db.prepare('DELETE FROM admin_sessions WHERE account_id = ?').run(targetId);
      db.prepare('DELETE FROM admin_accounts WHERE id = ?').run(targetId);
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/admin/accounts/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus akun pengurus.' });
    }
  });

  // ── Media & File Upload (Local fallback for Supabase Storage) ─
  app.post('/api/upload', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi4', 'komisi5'])) return;
    try {
      const folderRaw = String(req.body?.folder || 'media').replace(/[^a-zA-Z0-9_-]/g, '');
      const folder = folderRaw || 'media';
      const fileNameRaw = String(req.body?.fileName || `upload-${Date.now()}.webp`);
      const base64Raw = String(req.body?.base64 || '');
      if (!base64Raw) {
        return res.status(400).json({ error: 'Berkas unggahan kosong.' });
      }

      const safeFileName = `${Date.now()}-${path.basename(fileNameRaw).replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const targetFolder = path.join(UPLOADS_DIR, folder);
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const cleanBase64 = base64Raw.includes('base64,') ? base64Raw.split('base64,')[1] : base64Raw;
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.byteLength > 12 * 1024 * 1024) {
        return res.status(400).json({ error: 'Ukuran berkas melebihi batas 12 MB.' });
      }

      fs.writeFileSync(path.join(targetFolder, safeFileName), buffer);
      const sizeKb = Math.round(buffer.byteLength / 1024);
      const sizeText = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.max(1, sizeKb)} KB`;

      return res.status(201).json({
        url: `/uploads/${folder}/${safeFileName}`,
        sizeText,
      });
    } catch (error) {
      console.error('POST /api/upload failed:', error);
      return res.status(500).json({ error: 'Gagal mengunggah berkas.' });
    }
  });

  // ── Aspirasi REST Endpoints ─────────────────────────────────
  app.get('/api/aspirasi', (_req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM aspirasi ORDER BY created_at DESC').all() as unknown as SqliteAspirasiRow[];
      res.json({ records: rows.map(mapAspirasiRow) });
    } catch (error) {
      console.error('GET /api/aspirasi failed:', error);
      res.status(500).json({ error: 'Gagal memuat data aspirasi.' });
    }
  });

  app.get('/api/aspirasi/:code', (req, res) => {
    try {
      const code = String(req.params.code || '').trim().toUpperCase();
      if (!code) {
        return res.status(400).json({ error: 'Kode lacak wajib diisi.' });
      }
      const row = db
        .prepare('SELECT * FROM aspirasi WHERE UPPER(kode_lacak) = ? OR UPPER(kode_lacak) LIKE ? ORDER BY created_at DESC LIMIT 1')
        .get(code, `%${code}%`) as SqliteAspirasiRow | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Aspirasi tidak ditemukan.' });
      }
      return res.json({ record: mapAspirasiRow(row) });
    } catch (error) {
      console.error('GET /api/aspirasi/:code failed:', error);
      return res.status(500).json({ error: 'Gagal melacak aspirasi.' });
    }
  });

  app.post('/api/aspirasi', (req, res) => {
    try {
      const body = req.body ?? {};
      const jenis = String(body.jenis || 'Saran');
      const kategori = String(body.kategori || '').trim();
      const judul = String(body.judul || '').trim();
      const isi = String(body.isi || '').trim();
      const isAnonim = body.isAnonim !== false;
      const namaPengirim = isAnonim ? null : String(body.namaPengirim || 'Siswa MAM').trim().slice(0, 80);
      const kelasPengirim = isAnonim ? null : String(body.kelasPengirim || '-').trim().slice(0, 32);

      if (!VALID_JENIS.has(jenis)) {
        return res.status(400).json({ error: 'Jenis aspirasi tidak valid.' });
      }
      if (!kategori || !judul || !isi) {
        return res.status(400).json({ error: 'Kategori, judul, dan isi aspirasi wajib diisi.' });
      }
      if (judul.length > 180 || isi.length > 2500) {
        return res.status(400).json({ error: 'Teks melebihi batas panjang yang diizinkan.' });
      }

      const id = `asp-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      let kodeLacak = `ASP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      while (db.prepare('SELECT 1 FROM aspirasi WHERE kode_lacak = ?').get(kodeLacak)) {
        kodeLacak = `ASP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const todayStr = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());

      const tanggapanResmi = 'Aspirasi telah masuk ke sistem dan akan diverifikasi oleh Komisi 4 Aspirasi Siswa.';
      const penindaklanjut = 'Komisi 4 OPDIM';
      const riwayatStatus = [
        {
          status: 'Diterima',
          waktu: todayStr,
          keterangan: 'Aspirasi berhasil dikirim dan tersimpan di server VISTARA Hub.',
        },
      ];
      const createdAt = Date.now();

      db.prepare(`
        INSERT INTO aspirasi (
          id, kode_lacak, jenis, kategori, judul, isi, is_anonim,
          nama_pengirim, kelas_pengirim, tanggal, status, tanggapan_resmi,
          penindaklanjut, riwayat_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        kodeLacak,
        jenis,
        kategori,
        judul,
        isi,
        isAnonim ? 1 : 0,
        namaPengirim,
        kelasPengirim,
        todayStr,
        'Diterima',
        tanggapanResmi,
        penindaklanjut,
        JSON.stringify(riwayatStatus),
        createdAt
      );

      const inserted = db.prepare('SELECT * FROM aspirasi WHERE id = ?').get(id) as unknown as SqliteAspirasiRow;
      return res.status(201).json({ record: mapAspirasiRow(inserted) });
    } catch (error) {
      console.error('POST /api/aspirasi failed:', error);
      return res.status(500).json({ error: 'Gagal menyimpan aspirasi.' });
    }
  });

  app.patch('/api/aspirasi/:code/status', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi4'])) return;
    try {
      const code = String(req.params.code || '').trim().toUpperCase();
      const body = req.body ?? {};
      const status = String(body.status || '').trim();
      const keterangan = String(body.keterangan || '').trim();
      const tanggapanResmi = body.tanggapanResmi !== undefined ? String(body.tanggapanResmi).trim() : undefined;
      const penindaklanjut = body.penindaklanjut !== undefined ? String(body.penindaklanjut).trim() : undefined;

      if (!VALID_STATUS.has(status)) {
        return res.status(400).json({ error: 'Status tindak lanjut tidak valid.' });
      }

      const row = db
        .prepare('SELECT * FROM aspirasi WHERE UPPER(kode_lacak) = ? LIMIT 1')
        .get(code) as SqliteAspirasiRow | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Aspirasi tidak ditemukan.' });
      }

      const existing = mapAspirasiRow(row);
      const todayStr = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());

      const updatedHistory = [
        ...(existing.riwayatStatus || []),
        {
          status,
          waktu: todayStr,
          keterangan: keterangan || `Status diperbarui menjadi ${status} oleh pengurus Komisi 4.`,
        },
      ];

      db.prepare(`
        UPDATE aspirasi
        SET status = ?, tanggapan_resmi = ?, penindaklanjut = ?, riwayat_status = ?
        WHERE id = ?
      `).run(
        status,
        tanggapanResmi ?? existing.tanggapanResmi ?? null,
        penindaklanjut ?? existing.penindaklanjut ?? null,
        JSON.stringify(updatedHistory),
        existing.id
      );

      const updatedRow = db.prepare('SELECT * FROM aspirasi WHERE id = ?').get(existing.id) as unknown as SqliteAspirasiRow;
      return res.json({ record: mapAspirasiRow(updatedRow) });
    } catch (error) {
      console.error('PATCH /api/aspirasi/:code/status failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui status aspirasi.' });
    }
  });

  app.delete('/api/aspirasi', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi4'])) return;
    try {
      db.prepare('DELETE FROM aspirasi').run();
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/aspirasi failed:', error);
      return res.status(500).json({ error: 'Gagal mengosongkan data aspirasi.' });
    }
  });

  app.delete('/api/aspirasi/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi4'])) return;
    try {
      const id = String(req.params.id || '').trim();
      db.prepare('DELETE FROM aspirasi WHERE id = ?').run(id);
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/aspirasi/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus aspirasi.' });
    }
  });

  // ── Event Reminders REST Endpoints ──────────────────────────
  app.get('/api/reminders', (req, res) => {
    try {
      const clientKey = String(req.query.clientKey || '').trim().slice(0, 128);
      if (!clientKey) return res.json({ eventIds: [] });

      const rows = db
        .prepare('SELECT event_id FROM event_reminders WHERE client_key = ? ORDER BY created_at DESC')
        .all(clientKey) as Array<{ event_id: string }>;

      return res.json({ eventIds: rows.map((r) => r.event_id) });
    } catch (error) {
      console.error('GET /api/reminders failed:', error);
      return res.status(500).json({ error: 'Gagal memuat pengingat event.' });
    }
  });

  app.post('/api/reminders', (req, res) => {
    try {
      const clientKey = String(req.body?.clientKey || '').trim().slice(0, 128);
      const eventId = String(req.body?.eventId || '').trim().slice(0, 64);
      if (!clientKey || !eventId) {
        return res.status(400).json({ error: 'Data pengingat tidak lengkap.' });
      }

      db.prepare(
        'INSERT OR IGNORE INTO event_reminders (client_key, event_id, created_at) VALUES (?, ?, ?)'
      ).run(clientKey, eventId, Date.now());

      const rows = db
        .prepare('SELECT event_id FROM event_reminders WHERE client_key = ?')
        .all(clientKey) as Array<{ event_id: string }>;

      return res.json({ eventIds: rows.map((r) => r.event_id) });
    } catch (error) {
      console.error('POST /api/reminders failed:', error);
      return res.status(500).json({ error: 'Gagal menyimpan pengingat.' });
    }
  });

  app.delete('/api/reminders/:eventId', (req, res) => {
    try {
      const clientKey = String(req.query.clientKey || '').trim().slice(0, 128);
      const eventId = String(req.params.eventId || '').trim().slice(0, 64);
      if (!clientKey || !eventId) {
        return res.status(400).json({ error: 'Parameter tidak valid.' });
      }

      db.prepare('DELETE FROM event_reminders WHERE client_key = ? AND event_id = ?').run(clientKey, eventId);

      const rows = db
        .prepare('SELECT event_id FROM event_reminders WHERE client_key = ?')
        .all(clientKey) as Array<{ event_id: string }>;

      return res.json({ eventIds: rows.map((r) => r.event_id) });
    } catch (error) {
      console.error('DELETE /api/reminders/:eventId failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus pengingat.' });
    }
  });

  // ── Polling REST Endpoints ──────────────────────────────────
  const getHydratedPolls = () => {
    const topics = db
      .prepare('SELECT id, slug, question, description, category, status, closes_at FROM polling_topics ORDER BY created_at DESC')
      .all() as Array<{
        id: string;
        slug: string;
        question: string;
        description: string;
        category: string;
        status: 'active' | 'closed';
        closes_at: string;
      }>;
    const options = db
      .prepare('SELECT id, poll_id, label, votes FROM polling_options ORDER BY sort_order ASC, id ASC')
      .all() as Array<{ id: string; poll_id: string; label: string; votes: number }>;

    return topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      question: t.question,
      description: t.description,
      category: t.category,
      status: t.status,
      closesAt: t.closes_at,
      options: options
        .filter((o) => o.poll_id === t.id)
        .map((o) => ({ id: o.id, label: o.label, votes: Number(o.votes) })),
    }));
  };

  app.get('/api/polling', (_req, res) => {
    try {
      return res.json({ polls: getHydratedPolls() });
    } catch (error) {
      console.error('GET /api/polling failed:', error);
      return res.status(500).json({ error: 'Gagal memuat data polling.' });
    }
  });

  app.post('/api/polling', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi4'])) return;
    try {
      const body = req.body ?? {};
      const question = String(body.question || '').trim();
      const description = String(body.description || '').trim();
      const category = String(body.category || 'Kegiatan Siswa').trim();
      const closesAt = String(body.closesAt || '').trim();
      const optionLabels = Array.isArray(body.options)
        ? body.options.map((v: unknown) => String(v || '').trim()).filter(Boolean)
        : [];

      if (!question || !closesAt || optionLabels.length < 2) {
        return res.status(400).json({ error: 'Pertanyaan, batas waktu, dan minimal 2 opsi wajib diisi.' });
      }

      const id = `poll-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyServer(question)}-${Math.floor(100 + Math.random() * 900)}`;

      db.prepare(`
        INSERT INTO polling_topics (id, slug, question, description, category, status, closes_at, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
      `).run(id, slug, question, description || question, category, closesAt, Date.now());

      const insertOpt = db.prepare(
        'INSERT INTO polling_options (id, poll_id, label, votes, sort_order) VALUES (?, ?, ?, 0, ?)'
      );
      optionLabels.forEach((label, idx) => {
        insertOpt.run(`${id}-opt-${idx + 1}`, id, label, idx + 1);
      });

      return res.status(201).json({ polls: getHydratedPolls() });
    } catch (error) {
      console.error('POST /api/polling failed:', error);
      return res.status(500).json({ error: 'Gagal membuat topik polling.' });
    }
  });

  app.patch('/api/polling/:pollId/status', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi4'])) return;
    try {
      const pollId = String(req.params.pollId || '').trim();
      const status = req.body?.status === 'closed' ? 'closed' : 'active';
      db.prepare('UPDATE polling_topics SET status = ? WHERE id = ?').run(status, pollId);
      return res.json({ polls: getHydratedPolls() });
    } catch (error) {
      console.error('PATCH /api/polling/:pollId/status failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui status polling.' });
    }
  });

  app.delete('/api/polling', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi4'])) return;
    try {
      db.prepare('DELETE FROM polling_options').run();
      db.prepare('DELETE FROM polling_topics').run();
      return res.json({ polls: [] });
    } catch (error) {
      console.error('DELETE /api/polling failed:', error);
      return res.status(500).json({ error: 'Gagal mengosongkan seluruh data polling.' });
    }
  });

  app.delete('/api/polling/:pollId', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi4'])) return;
    try {
      const pollId = String(req.params.pollId || '').trim();
      db.prepare('DELETE FROM polling_options WHERE poll_id = ?').run(pollId);
      db.prepare('DELETE FROM polling_topics WHERE id = ?').run(pollId);
      return res.json({ polls: getHydratedPolls() });
    } catch (error) {
      console.error('DELETE /api/polling/:pollId failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus topik polling.' });
    }
  });

  app.post('/api/polling/:pollId/vote', (req, res) => {
    try {
      const pollId = String(req.params.pollId || '').trim();
      const optionId = String(req.body?.optionId || '').trim();
      if (!pollId || !optionId) {
        return res.status(400).json({ error: 'Data pilihan polling tidak valid.' });
      }

      const topic = db
        .prepare('SELECT status FROM polling_topics WHERE id = ? LIMIT 1')
        .get(pollId) as { status: string } | undefined;

      if (!topic || topic.status !== 'active') {
        return res.status(404).json({ error: 'Polling tidak ditemukan atau sudah ditutup.' });
      }

      const result = db
        .prepare('UPDATE polling_options SET votes = votes + 1 WHERE id = ? AND poll_id = ?')
        .run(optionId, pollId);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Opsi polling tidak ditemukan.' });
      }

      return res.json({ polls: getHydratedPolls() });
    } catch (error) {
      console.error('POST /api/polling/:pollId/vote failed:', error);
      return res.status(500).json({ error: 'Gagal mengirim suara polling.' });
    }
  });

  // ── Berita REST Endpoints ───────────────────────────────────
  app.get('/api/berita', (_req, res) => {
    try {
      const rows = db.prepare('SELECT id, slug, title, excerpt, category, date, author, thumbnail, content FROM berita ORDER BY date DESC, created_at DESC').all();
      return res.json({ records: rows });
    } catch (error) {
      console.error('GET /api/berita failed:', error);
      return res.status(500).json({ error: 'Gagal memuat daftar berita.' });
    }
  });

  app.post('/api/berita', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const excerpt = String(b.excerpt || '').trim();
      const category = String(b.category || 'Kegiatan').trim();
      const date = String(b.date || new Date().toISOString().slice(0, 10)).trim();
      const author = String(b.author || 'Komisi 5 Media').trim();
      const thumbnail = b.thumbnail ? String(b.thumbnail).trim() : null;
      const content = b.content ? String(b.content).trim() : null;
      if (!title || !excerpt) {
        return res.status(400).json({ error: 'Judul dan ringkasan berita wajib diisi.' });
      }
      const id = `berita-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyServer(title)}-${Math.floor(100 + Math.random() * 900)}`;

      db.prepare(`
        INSERT INTO berita (id, slug, title, excerpt, category, date, author, thumbnail, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, slug, title, excerpt, category, date, author, thumbnail, content, Date.now());

      const created = db.prepare('SELECT id, slug, title, excerpt, category, date, author, thumbnail, content FROM berita WHERE id = ?').get(id);
      return res.status(201).json({ record: created });
    } catch (error) {
      console.error('POST /api/berita failed:', error);
      return res.status(500).json({ error: 'Gagal menerbitkan berita.' });
    }
  });

  app.put('/api/berita/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      const id = String(req.params.id || '').trim();
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const excerpt = String(b.excerpt || '').trim();
      const category = String(b.category || 'Kegiatan').trim();
      const date = String(b.date || '').trim();
      const author = String(b.author || '').trim();
      const thumbnail = b.thumbnail ? String(b.thumbnail).trim() : null;
      const content = b.content ? String(b.content).trim() : null;
      if (!title || !excerpt) {
        return res.status(400).json({ error: 'Judul dan ringkasan berita wajib diisi.' });
      }

      db.prepare(`
        UPDATE berita SET title = ?, excerpt = ?, category = ?, date = ?, author = ?, thumbnail = ?, content = ?
        WHERE id = ?
      `).run(title, excerpt, category, date, author, thumbnail, content, id);

      const updated = db.prepare('SELECT id, slug, title, excerpt, category, date, author, thumbnail, content FROM berita WHERE id = ?').get(id);
      return res.json({ record: updated });
    } catch (error) {
      console.error('PUT /api/berita/:id failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui berita.' });
    }
  });

  app.delete('/api/berita/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      db.prepare('DELETE FROM berita WHERE id = ?').run(String(req.params.id || '').trim());
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/berita/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus berita.' });
    }
  });

  // ── Galeri REST Endpoints ───────────────────────────────────
  app.get('/api/galeri', (_req, res) => {
    try {
      const rows = db.prepare('SELECT id, slug, title, description, category, date, cover_image, image_count FROM gallery ORDER BY date DESC, created_at DESC').all() as Array<{
        id: string;
        slug: string;
        title: string;
        description: string;
        category: string;
        date: string;
        cover_image: string;
        image_count: number;
      }>;
      return res.json({
        records: rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          description: r.description,
          category: r.category,
          date: r.date,
          coverImage: r.cover_image,
          imageCount: Number(r.image_count),
        })),
      });
    } catch (error) {
      console.error('GET /api/galeri failed:', error);
      return res.status(500).json({ error: 'Gagal memuat data galeri.' });
    }
  });

  app.post('/api/galeri', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const description = String(b.description || '').trim();
      const category = String(b.category || 'Kegiatan').trim();
      const date = String(b.date || new Date().toISOString().slice(0, 10)).trim();
      const coverImage = String(b.coverImage || '').trim();
      const imageCount = Math.max(1, Number(b.imageCount) || 1);
      if (!title || !description) {
        return res.status(400).json({ error: 'Judul dan deskripsi album wajib diisi.' });
      }
      const id = `gal-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyServer(title)}-${Math.floor(100 + Math.random() * 900)}`;

      db.prepare(`
        INSERT INTO gallery (id, slug, title, description, category, date, cover_image, image_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, slug, title, description, category, date, coverImage, imageCount, Date.now());

      return res.status(201).json({
        record: { id, slug, title, description, category, date, coverImage, imageCount },
      });
    } catch (error) {
      console.error('POST /api/galeri failed:', error);
      return res.status(500).json({ error: 'Gagal menyimpan album galeri.' });
    }
  });

  app.put('/api/galeri/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      const id = String(req.params.id || '').trim();
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const description = String(b.description || '').trim();
      const category = String(b.category || 'Kegiatan').trim();
      const date = String(b.date || '').trim();
      const coverImage = String(b.coverImage || '').trim();
      const imageCount = Math.max(1, Number(b.imageCount) || 1);

      db.prepare(`
        UPDATE gallery SET title = ?, description = ?, category = ?, date = ?, cover_image = ?, image_count = ?
        WHERE id = ?
      `).run(title, description, category, date, coverImage, imageCount, id);

      const updated = db.prepare('SELECT id, slug, title, description, category, date, cover_image, image_count FROM gallery WHERE id = ?').get(id) as {
        id: string;
        slug: string;
        title: string;
        description: string;
        category: string;
        date: string;
        cover_image: string;
        image_count: number;
      };
      return res.json({
        record: {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          description: updated.description,
          category: updated.category,
          date: updated.date,
          coverImage: updated.cover_image,
          imageCount: Number(updated.image_count),
        },
      });
    } catch (error) {
      console.error('PUT /api/galeri/:id failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui album galeri.' });
    }
  });

  app.delete('/api/galeri/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      db.prepare('DELETE FROM gallery WHERE id = ?').run(String(req.params.id || '').trim());
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/galeri/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus album galeri.' });
    }
  });

  // ── Events REST Endpoints ───────────────────────────────────
  app.get('/api/events', (_req, res) => {
    try {
      const rows = db.prepare('SELECT id, slug, title, description, date, time, location, category, status, thumbnail FROM events ORDER BY date DESC, created_at DESC').all();
      return res.json({ records: rows });
    } catch (error) {
      console.error('GET /api/events failed:', error);
      return res.status(500).json({ error: 'Gagal memuat agenda event.' });
    }
  });

  app.post('/api/events', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti'])) return;
    try {
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const description = String(b.description || '').trim();
      const date = String(b.date || '').trim();
      const time = String(b.time || '08:00').trim();
      const location = String(b.location || '').trim();
      const category = String(b.category || 'Agenda OPDIM').trim();
      const status = VALID_EVENT_STATUS.has(String(b.status)) ? String(b.status) : 'upcoming';
      const thumbnail = b.thumbnail ? String(b.thumbnail).trim() : null;
      if (!title || !description || !date || !location) {
        return res.status(400).json({ error: 'Judul, deskripsi, tanggal, dan lokasi wajib diisi.' });
      }
      const id = `evt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyServer(title)}-${Math.floor(100 + Math.random() * 900)}`;

      db.prepare(`
        INSERT INTO events (id, slug, title, description, date, time, location, category, status, thumbnail, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, slug, title, description, date, time, location, category, status, thumbnail, Date.now());

      const created = db.prepare('SELECT id, slug, title, description, date, time, location, category, status, thumbnail FROM events WHERE id = ?').get(id);
      return res.status(201).json({ record: created });
    } catch (error) {
      console.error('POST /api/events failed:', error);
      return res.status(500).json({ error: 'Gagal membuat agenda event.' });
    }
  });

  app.put('/api/events/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti'])) return;
    try {
      const id = String(req.params.id || '').trim();
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const description = String(b.description || '').trim();
      const date = String(b.date || '').trim();
      const time = String(b.time || '08:00').trim();
      const location = String(b.location || '').trim();
      const category = String(b.category || 'Agenda OPDIM').trim();
      const status = VALID_EVENT_STATUS.has(String(b.status)) ? String(b.status) : 'upcoming';
      const thumbnail = b.thumbnail ? String(b.thumbnail).trim() : null;

      db.prepare(`
        UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, category = ?, status = ?, thumbnail = ?
        WHERE id = ?
      `).run(title, description, date, time, location, category, status, thumbnail, id);

      const updated = db.prepare('SELECT id, slug, title, description, date, time, location, category, status, thumbnail FROM events WHERE id = ?').get(id);
      return res.json({ record: updated });
    } catch (error) {
      console.error('PUT /api/events/:id failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui agenda event.' });
    }
  });

  app.delete('/api/events/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti'])) return;
    try {
      db.prepare('DELETE FROM events WHERE id = ?').run(String(req.params.id || '').trim());
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/events/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus event.' });
    }
  });

  // ── Arsip REST Endpoints ────────────────────────────────────
  app.get('/api/arsip', (_req, res) => {
    try {
      const rows = db.prepare('SELECT id, title, jenis, tanggal, ukuran, deskripsi, file_url FROM arsip ORDER BY created_at DESC').all() as Array<{
        id: string;
        title: string;
        jenis: string;
        tanggal: string;
        ukuran: string;
        deskripsi: string;
        file_url: string | null;
      }>;
      return res.json({
        records: rows.map((r) => ({
          id: r.id,
          title: r.title,
          jenis: r.jenis,
          tanggal: r.tanggal,
          ukuran: r.ukuran,
          deskripsi: r.deskripsi,
          fileUrl: r.file_url ?? undefined,
        })),
      });
    } catch (error) {
      console.error('GET /api/arsip failed:', error);
      return res.status(500).json({ error: 'Gagal memuat dokumen arsip.' });
    }
  });

  app.post('/api/arsip', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti'])) return;
    try {
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const jenis = VALID_ARSIP_JENIS.has(String(b.jenis)) ? String(b.jenis) : 'dokumen';
      const tanggal = String(b.tanggal || '').trim();
      const ukuran = String(b.ukuran || 'PDF').trim();
      const deskripsi = String(b.deskripsi || '').trim();
      const fileUrl = b.fileUrl ? String(b.fileUrl).trim() : null;
      if (!title || !deskripsi || !tanggal) {
        return res.status(400).json({ error: 'Judul, tanggal, dan deskripsi arsip wajib diisi.' });
      }
      const id = `arsip-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      db.prepare(`
        INSERT INTO arsip (id, title, jenis, tanggal, ukuran, deskripsi, file_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, title, jenis, tanggal, ukuran, deskripsi, fileUrl, Date.now());

      return res.status(201).json({
        record: { id, title, jenis, tanggal, ukuran, deskripsi, fileUrl: fileUrl ?? undefined },
      });
    } catch (error) {
      console.error('POST /api/arsip failed:', error);
      return res.status(500).json({ error: 'Gagal menerbitkan dokumen arsip.' });
    }
  });

  app.put('/api/arsip/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti'])) return;
    try {
      const id = String(req.params.id || '').trim();
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const jenis = VALID_ARSIP_JENIS.has(String(b.jenis)) ? String(b.jenis) : 'dokumen';
      const tanggal = String(b.tanggal || '').trim();
      const ukuran = String(b.ukuran || 'PDF').trim();
      const deskripsi = String(b.deskripsi || '').trim();
      const fileUrl = b.fileUrl ? String(b.fileUrl).trim() : null;

      db.prepare(`
        UPDATE arsip SET title = ?, jenis = ?, tanggal = ?, ukuran = ?, deskripsi = ?, file_url = ?
        WHERE id = ?
      `).run(title, jenis, tanggal, ukuran, deskripsi, fileUrl, id);

      return res.json({
        record: { id, title, jenis, tanggal, ukuran, deskripsi, fileUrl: fileUrl ?? undefined },
      });
    } catch (error) {
      console.error('PUT /api/arsip/:id failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui dokumen arsip.' });
    }
  });

  app.delete('/api/arsip/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti'])) return;
    try {
      db.prepare('DELETE FROM arsip WHERE id = ?').run(String(req.params.id || '').trim());
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/arsip/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus dokumen arsip.' });
    }
  });

  // ── Prestasi REST Endpoints ─────────────────────────────────
  app.get('/api/prestasi', (_req, res) => {
    try {
      const rows = db
        .prepare('SELECT id, slug, title, tingkat, kategori, peraih, tahun, medali, penyelenggara, description, thumbnail FROM prestasi ORDER BY tahun DESC, created_at DESC')
        .all();
      return res.json({ records: rows });
    } catch (error) {
      console.error('GET /api/prestasi failed:', error);
      return res.status(500).json({ error: 'Gagal memuat data prestasi.' });
    }
  });

  app.post('/api/prestasi', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const tingkatRaw = String(b.tingkat || 'provinsi').trim().toLowerCase();
      const tingkat = VALID_PRESTASI_TINGKAT.has(tingkatRaw) ? tingkatRaw : 'provinsi';
      const kategori = String(b.kategori || 'Akademik').trim();
      const peraih = String(b.peraih || '').trim();
      const tahun = String(b.tahun || new Date().getFullYear()).trim();
      const medaliRaw = String(b.medali || 'juara1').trim().toLowerCase();
      const medali = VALID_PRESTASI_MEDALI.has(medaliRaw) ? medaliRaw : 'juara1';
      const penyelenggara = String(b.penyelenggara || '').trim();
      const description = typeof b.description === 'string' && b.description.trim() ? b.description.trim() : null;
      const thumbnail = typeof b.thumbnail === 'string' && b.thumbnail.trim() ? b.thumbnail.trim() : null;

      if (!title || !peraih || !penyelenggara) {
        return res.status(400).json({ error: 'Judul prestasi, peraih, dan penyelenggara wajib diisi.' });
      }

      const id = `prestasi-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyServer(title)}-${Math.floor(100 + Math.random() * 900)}`;

      db.prepare(`
        INSERT INTO prestasi (id, slug, title, tingkat, kategori, peraih, tahun, medali, penyelenggara, description, thumbnail, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, slug, title, tingkat, kategori, peraih, tahun, medali, penyelenggara, description, thumbnail, Date.now());

      const created = db
        .prepare('SELECT id, slug, title, tingkat, kategori, peraih, tahun, medali, penyelenggara, description, thumbnail FROM prestasi WHERE id = ?')
        .get(id);
      return res.status(201).json({ record: created });
    } catch (error) {
      console.error('POST /api/prestasi failed:', error);
      return res.status(500).json({ error: 'Gagal menyimpan data prestasi.' });
    }
  });

  app.put('/api/prestasi/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      const id = String(req.params.id || '').trim();
      const b = req.body ?? {};
      const title = String(b.title || '').trim();
      const tingkatRaw = String(b.tingkat || 'provinsi').trim().toLowerCase();
      const tingkat = VALID_PRESTASI_TINGKAT.has(tingkatRaw) ? tingkatRaw : 'provinsi';
      const kategori = String(b.kategori || 'Akademik').trim();
      const peraih = String(b.peraih || '').trim();
      const tahun = String(b.tahun || '').trim();
      const medaliRaw = String(b.medali || 'juara1').trim().toLowerCase();
      const medali = VALID_PRESTASI_MEDALI.has(medaliRaw) ? medaliRaw : 'juara1';
      const penyelenggara = String(b.penyelenggara || '').trim();
      const description = typeof b.description === 'string' && b.description.trim() ? b.description.trim() : null;
      const thumbnail = typeof b.thumbnail === 'string' && b.thumbnail.trim() ? b.thumbnail.trim() : null;

      if (!title || !peraih || !penyelenggara) {
        return res.status(400).json({ error: 'Judul prestasi, peraih, dan penyelenggara wajib diisi.' });
      }

      db.prepare(`
        UPDATE prestasi
        SET title = ?, tingkat = ?, kategori = ?, peraih = ?, tahun = ?, medali = ?, penyelenggara = ?, description = ?, thumbnail = ?
        WHERE id = ?
      `).run(title, tingkat, kategori, peraih, tahun, medali, penyelenggara, description, thumbnail, id);

      const updated = db
        .prepare('SELECT id, slug, title, tingkat, kategori, peraih, tahun, medali, penyelenggara, description, thumbnail FROM prestasi WHERE id = ?')
        .get(id);
      return res.json({ record: updated });
    } catch (error) {
      console.error('PUT /api/prestasi/:id failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui data prestasi.' });
    }
  });

  app.delete('/api/prestasi/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      db.prepare('DELETE FROM prestasi WHERE id = ?').run(String(req.params.id || '').trim());
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/prestasi/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus data prestasi.' });
    }
  });

  // ── Anggota OPDIM REST Endpoints ─────────────────────────────
  const VALID_ANGGOTA_UNIT = new Set([
    'pimpinan',
    'inti',
    'komisi1',
    'komisi2',
    'komisi3',
    'komisi4',
    'komisi5',
  ]);
  const VALID_ANGGOTA_LEVEL = new Set([
    'kepala_madrasah',
    'pembina',
    'inti',
    'ketua_komisi',
    'anggota',
  ]);

  interface SqliteAnggotaRow {
    id: string;
    full_name: string;
    jabatan: string;
    unit: string;
    peran_level: string;
    tugas_utama: string;
    foto_url: string;
    sort_order: number;
    is_active: number;
  }

  function mapAnggotaRow(row: SqliteAnggotaRow) {
    return {
      id: row.id,
      fullName: row.full_name,
      jabatan: row.jabatan,
      unit: row.unit,
      peranLevel: row.peran_level,
      tugasUtama: row.tugas_utama || '',
      fotoUrl: row.foto_url || '',
      sortOrder: Number(row.sort_order) || 100,
      isActive: Boolean(row.is_active),
    };
  }

  app.get('/api/anggota', (_req, res) => {
    try {
      const rows = db
        .prepare(
          'SELECT id, full_name, jabatan, unit, peran_level, tugas_utama, foto_url, sort_order, is_active FROM anggota_opdim ORDER BY sort_order ASC, created_at ASC'
        )
        .all() as unknown as SqliteAnggotaRow[];
      return res.json({ records: rows.map(mapAnggotaRow) });
    } catch (error) {
      console.error('GET /api/anggota failed:', error);
      return res.status(500).json({ error: 'Gagal memuat data anggota OPDIM.' });
    }
  });

  app.post('/api/anggota', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      const b = req.body ?? {};
      const fullName = String(b.fullName || '').trim();
      const jabatan = String(b.jabatan || '').trim();
      const unit = VALID_ANGGOTA_UNIT.has(String(b.unit)) ? String(b.unit) : 'komisi1';
      const peranLevel = VALID_ANGGOTA_LEVEL.has(String(b.peranLevel))
        ? String(b.peranLevel)
        : 'anggota';
      const tugasUtama = String(b.tugasUtama || '').trim();
      const fotoUrl = String(b.fotoUrl || '').trim();
      const sortOrder = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 50;
      const isActive = b.isActive !== false;

      if (!fullName || !jabatan) {
        return res.status(400).json({ error: 'Nama lengkap dan jabatan anggota wajib diisi.' });
      }

      const id = `ang-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const now = Date.now();
      db.prepare(`
        INSERT INTO anggota_opdim (
          id, full_name, jabatan, unit, peran_level, tugas_utama, foto_url, sort_order, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        fullName,
        jabatan,
        unit,
        peranLevel,
        tugasUtama,
        fotoUrl,
        sortOrder,
        isActive ? 1 : 0,
        now,
        now
      );

      const created = db
        .prepare(
          'SELECT id, full_name, jabatan, unit, peran_level, tugas_utama, foto_url, sort_order, is_active FROM anggota_opdim WHERE id = ?'
        )
        .get(id) as SqliteAnggotaRow;
      return res.status(201).json({ record: mapAnggotaRow(created) });
    } catch (error) {
      console.error('POST /api/anggota failed:', error);
      return res.status(500).json({ error: 'Gagal menambahkan anggota OPDIM.' });
    }
  });

  app.put('/api/anggota/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      const id = String(req.params.id || '').trim();
      const existing = db
        .prepare('SELECT id FROM anggota_opdim WHERE id = ? LIMIT 1')
        .get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Data anggota OPDIM tidak ditemukan.' });
      }

      const b = req.body ?? {};
      const fullName = String(b.fullName || '').trim();
      const jabatan = String(b.jabatan || '').trim();
      const unit = VALID_ANGGOTA_UNIT.has(String(b.unit)) ? String(b.unit) : 'komisi1';
      const peranLevel = VALID_ANGGOTA_LEVEL.has(String(b.peranLevel))
        ? String(b.peranLevel)
        : 'anggota';
      const tugasUtama = String(b.tugasUtama || '').trim();
      const fotoUrl = String(b.fotoUrl || '').trim();
      const sortOrder = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 50;
      const isActive = b.isActive !== false;

      if (!fullName || !jabatan) {
        return res.status(400).json({ error: 'Nama lengkap dan jabatan anggota wajib diisi.' });
      }

      db.prepare(`
        UPDATE anggota_opdim
        SET full_name = ?, jabatan = ?, unit = ?, peran_level = ?, tugas_utama = ?, foto_url = ?, sort_order = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `).run(
        fullName,
        jabatan,
        unit,
        peranLevel,
        tugasUtama,
        fotoUrl,
        sortOrder,
        isActive ? 1 : 0,
        Date.now(),
        id
      );

      const updated = db
        .prepare(
          'SELECT id, full_name, jabatan, unit, peran_level, tugas_utama, foto_url, sort_order, is_active FROM anggota_opdim WHERE id = ?'
        )
        .get(id) as SqliteAnggotaRow;
      return res.json({ record: mapAnggotaRow(updated) });
    } catch (error) {
      console.error('PUT /api/anggota/:id failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui data anggota OPDIM.' });
    }
  });

  app.delete('/api/anggota/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti', 'komisi5'])) return;
    try {
      db.prepare('DELETE FROM anggota_opdim WHERE id = ?').run(String(req.params.id || '').trim());
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/anggota/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus anggota OPDIM.' });
    }
  });

  // ── Custom TARA Notifications REST Endpoints ────────────────
  const VALID_NOTIF_CATEGORIES = new Set(['pengumuman', 'semangat', 'libur', 'event', 'berita']);

  interface SqliteCustomNotificationRow {
    id: string;
    title: string;
    message: string;
    category: string;
    target_path: string;
    is_active: number;
    created_by: string;
    expires_at: string | null;
    created_at: number;
  }

  function mapNotificationRow(row: SqliteCustomNotificationRow) {
    return {
      id: row.id,
      title: row.title,
      message: row.message,
      category: VALID_NOTIF_CATEGORIES.has(row.category) ? row.category : 'pengumuman',
      targetPath: row.target_path || '/beranda',
      isActive: Boolean(row.is_active),
      createdBy: row.created_by || 'Pengurus OPDIM',
      expiresAt: row.expires_at ?? null,
      createdAt: row.created_at,
    };
  }

  app.get('/api/notifications', (req, res) => {
    try {
      const includeAll = String(req.query.all || '') === '1';
      if (includeAll) {
        const account = resolveSessionFromToken(extractRequestToken(req));
        if (!account || (account.role !== 'root' && account.role !== 'inti')) {
          return res.status(403).json({ error: 'Hanya Super Admin atau Pengurus Inti yang dapat melihat seluruh daftar notifikasi.' });
        }
        const rows = db
          .prepare('SELECT * FROM custom_notifications ORDER BY created_at DESC')
          .all() as unknown as SqliteCustomNotificationRow[];
        return res.json({ records: rows.map(mapNotificationRow) });
      }

      const todayIso = new Date().toISOString().slice(0, 10);
      const rows = db
        .prepare('SELECT * FROM custom_notifications WHERE is_active = 1 ORDER BY created_at DESC')
        .all() as unknown as SqliteCustomNotificationRow[];
      const activeRows = rows.filter((r) => !r.expires_at || r.expires_at >= todayIso);
      return res.json({ records: activeRows.map(mapNotificationRow) });
    } catch (error) {
      console.error('GET /api/notifications failed:', error);
      return res.status(500).json({ error: 'Gagal memuat notifikasi custom.' });
    }
  });

  app.post('/api/notifications', (req, res) => {
    const actor = requireAdminSession(req, res, ['root', 'inti']);
    if (!actor) return;
    try {
      const b = req.body ?? {};
      const title = String(b.title || '').trim().slice(0, 100);
      const message = String(b.message || '').trim().slice(0, 320);
      const category = VALID_NOTIF_CATEGORIES.has(String(b.category)) ? String(b.category) : 'pengumuman';
      const targetPathRaw = String(b.targetPath || '/beranda').trim();
      const targetPath = targetPathRaw.startsWith('/') ? targetPathRaw : '/beranda';
      const isActive = b.isActive !== false;
      const expiresAt = typeof b.expiresAt === 'string' && b.expiresAt.trim() ? b.expiresAt.trim().slice(0, 24) : null;

      if (!title || !message) {
        return res.status(400).json({ error: 'Judul dan isi pesan notifikasi wajib diisi.' });
      }

      const id = `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const now = Date.now();
      db.prepare(`
        INSERT INTO custom_notifications (
          id, title, message, category, target_path, is_active, created_by, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, title, message, category, targetPath, isActive ? 1 : 0, actor.fullName, expiresAt, now);

      const created = db
        .prepare('SELECT * FROM custom_notifications WHERE id = ?')
        .get(id) as unknown as SqliteCustomNotificationRow;
      return res.status(201).json({ record: mapNotificationRow(created) });
    } catch (error) {
      console.error('POST /api/notifications failed:', error);
      return res.status(500).json({ error: 'Gagal menerbitkan notifikasi custom.' });
    }
  });

  app.put('/api/notifications/:id', (req, res) => {
    const actor = requireAdminSession(req, res, ['root', 'inti']);
    if (!actor) return;
    try {
      const id = String(req.params.id || '').trim();
      const existing = db
        .prepare('SELECT * FROM custom_notifications WHERE id = ? LIMIT 1')
        .get(id) as SqliteCustomNotificationRow | undefined;
      if (!existing) {
        return res.status(404).json({ error: 'Notifikasi tidak ditemukan.' });
      }

      const b = req.body ?? {};
      const title = b.title !== undefined ? String(b.title).trim().slice(0, 100) : existing.title;
      const message = b.message !== undefined ? String(b.message).trim().slice(0, 320) : existing.message;
      const category =
        b.category !== undefined && VALID_NOTIF_CATEGORIES.has(String(b.category))
          ? String(b.category)
          : existing.category;
      const targetPathRaw = b.targetPath !== undefined ? String(b.targetPath).trim() : existing.target_path;
      const targetPath = targetPathRaw.startsWith('/') ? targetPathRaw : '/beranda';
      const isActive = b.isActive !== undefined ? Boolean(b.isActive) : Boolean(existing.is_active);
      const expiresAt =
        b.expiresAt !== undefined
          ? typeof b.expiresAt === 'string' && b.expiresAt.trim()
            ? b.expiresAt.trim().slice(0, 24)
            : null
          : existing.expires_at;

      if (!title || !message) {
        return res.status(400).json({ error: 'Judul dan isi pesan notifikasi wajib diisi.' });
      }

      db.prepare(`
        UPDATE custom_notifications
        SET title = ?, message = ?, category = ?, target_path = ?, is_active = ?, expires_at = ?
        WHERE id = ?
      `).run(title, message, category, targetPath, isActive ? 1 : 0, expiresAt, id);

      const updated = db
        .prepare('SELECT * FROM custom_notifications WHERE id = ?')
        .get(id) as unknown as SqliteCustomNotificationRow;
      return res.json({ record: mapNotificationRow(updated) });
    } catch (error) {
      console.error('PUT /api/notifications/:id failed:', error);
      return res.status(500).json({ error: 'Gagal memperbarui notifikasi custom.' });
    }
  });

  app.delete('/api/notifications/:id', (req, res) => {
    if (!requireAdminSession(req, res, ['root', 'inti'])) return;
    try {
      db.prepare('DELETE FROM custom_notifications WHERE id = ?').run(String(req.params.id || '').trim());
      return res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/notifications/:id failed:', error);
      return res.status(500).json({ error: 'Gagal menghapus notifikasi custom.' });
    }
  });

  // ── Vite Dev Middleware / Production Static Serve ───────────
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });

    // Vite 8 @vite/client calls transport.connect(...) unconditionally even with hmr: false.
    // Neutralize the WebSocket connect call in middleware mode so proxied previews never emit WebSocket errors.
    app.use((req, res, next) => {
      if (req.path !== '/@vite/client') {
        next();
        return;
      }
      delete req.headers['accept-encoding'];
      const chunks: Buffer[] = [];
      const origWrite = res.write.bind(res);
      const origEnd = res.end.bind(res);

      res.write = ((chunk: unknown) => {
        if (chunk !== undefined && chunk !== null) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }
        return true;
      }) as typeof res.write;

      res.end = ((chunk?: unknown, ...rest: unknown[]) => {
        if (chunk !== undefined && chunk !== null && typeof chunk !== 'function') {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        const patched = raw.replace(
          'transport.connect(createHMRHandler(handleMessage));',
          '/* HMR WebSocket disabled */'
        );
        res.removeHeader('Content-Length');
        res.setHeader('Content-Length', Buffer.byteLength(patched, 'utf8'));
        res.write = origWrite;
        res.end = origEnd;
        const cb = typeof chunk === 'function' ? chunk : rest.find((arg) => typeof arg === 'function');
        return origEnd(patched, ...(cb ? [cb as () => void] : []));
      }) as typeof res.end;

      next();
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VISTARA Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
