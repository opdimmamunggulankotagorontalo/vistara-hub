import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Ensure SQLite persistent data directory exists ──────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
`);

const SEED_ASPIRASI = [
  {
    id: 'asp-1',
    kodeLacak: 'ASP-2026-1001',
    jenis: 'Saran',
    kategori: 'Fasilitas Madrasah',
    judul: 'Penambahan Dispenser Air Minum di Lorong Kelas Lantai 2',
    isi: 'Penyediaan dispenser air minum isi ulang di dekat ruang kelas lantai 2 agar santri dan siswa tidak perlu turun ke kantin setiap kali membutuhkan air minum saat jam istirahat.',
    isAnonim: false,
    namaPengirim: 'Siswa Kelas XI',
    kelasPengirim: 'XI IPA 1',
    tanggal: '2026-09-28',
    status: 'Selesai',
    tanggapanResmi: 'Aspirasi telah disampaikan kepada bagian sarana madrasah. Dispenser tambahan telah dipasang dan beroperasi di koridor barat lantai 2.',
    penindaklanjut: 'Komisi 4 OPDIM & Waka Sarpras',
    riwayatStatus: [
      { status: 'Diterima', waktu: '28 Sep 2026', keterangan: 'Aspirasi masuk ke sistem Kotak Aspirasi Komisi 4.' },
      { status: 'Ditinjau', waktu: '29 Sep 2026', keterangan: 'Diverifikasi kelayakannya oleh Komisi 4.' },
      { status: 'Didiskusikan', waktu: '30 Sep 2026', keterangan: 'Dibahas dalam rapat koordinasi pengurus OPDIM.' },
      { status: 'Tindak Lanjut', waktu: '02 Okt 2026', keterangan: 'Disampaikan secara resmi dalam audiensi bersama Waka Sarana & Prasarana.' },
      { status: 'Selesai', waktu: '05 Okt 2026', keterangan: 'Dispenser terpasang dan dapat digunakan bersama.' },
    ],
    createdAt: 1759017600000,
  },
  {
    id: 'asp-2',
    kodeLacak: 'ASP-2026-1002',
    jenis: 'Ide',
    kategori: 'Kegiatan Siswa',
    judul: 'Penguatan Mading Kreasi & Sesi Mentoring Belajar Sebaya',
    isi: 'Mengusulkan diadakannya rubrik tips belajar mingguan di mading dan sesi belajar kelompok sebaya menjelang ujian semester.',
    isAnonim: true,
    namaPengirim: null,
    kelasPengirim: null,
    tanggal: '2026-10-01',
    status: 'Tindak Lanjut',
    tanggapanResmi: 'Ide disinkronkan dengan program Papan Informasi Edukasi Komisi 3 dan sedang dirumuskan format jadwal belajarnya.',
    penindaklanjut: 'Komisi 4 & Komisi 3',
    riwayatStatus: [
      { status: 'Diterima', waktu: '01 Okt 2026', keterangan: 'Aspirasi diterima dan terdata secara anonim.' },
      { status: 'Ditinjau', waktu: '02 Okt 2026', keterangan: 'Dinilai sangat konstruktif untuk akademik siswa.' },
      { status: 'Didiskusikan', waktu: '04 Okt 2026', keterangan: 'Dikoordinasikan dengan Komisi 3 bagian Edukasi.' },
      { status: 'Tindak Lanjut', waktu: '06 Okt 2026', keterangan: 'Penyusunan jadwal rubrik mading dan fasilitasi tutor sebaya.' },
    ],
    createdAt: 1759276800000,
  },
  {
    id: 'asp-3',
    kodeLacak: 'ASP-2026-1003',
    jenis: 'Saran',
    kategori: 'Kebersihan & Lingkungan',
    judul: 'Wadah Sampah Khusus Daur Ulang untuk Trash to Cash',
    isi: 'Agar program Trash to Cash Komisi 3 berjalan optimal, perlu ditandai tempat sampah khusus botol plastik di setiap sudut gazebo madrasah.',
    isAnonim: false,
    namaPengirim: 'Perwakilan Kelas X',
    kelasPengirim: 'X-2',
    tanggal: '2026-10-03',
    status: 'Didiskusikan',
    tanggapanResmi: 'Sedang dibahas bersama panitia Trash to Cash untuk pengadaan stiker penanda dan karung pilah.',
    penindaklanjut: 'Komisi 4 & Tim Trash to Cash',
    riwayatStatus: [
      { status: 'Diterima', waktu: '03 Okt 2026', keterangan: 'Aspirasi diterima oleh tim piket aspirasi.' },
      { status: 'Ditinjau', waktu: '04 Okt 2026', keterangan: 'Diteruskan ke Ketua Komisi 4 Nayla Syaqila Husain.' },
      { status: 'Didiskusikan', waktu: '07 Okt 2026', keterangan: 'Sedang dimusyawarahkan pembiayaan pengadaan penanda bersama Bendahara.' },
    ],
    createdAt: 1759449600000,
  },
  {
    id: 'asp-4',
    kodeLacak: 'ASP-2026-1004',
    jenis: 'Keluhan',
    kategori: 'Fasilitas Madrasah',
    judul: 'Optimalisasi Jaringan Internet WiFi di Perpustakaan',
    isi: 'Kecepatan internet WiFi di perpustakaan sering melambat saat jam istirahat ketika banyak siswa mengakses referensi materi digital.',
    isAnonim: true,
    namaPengirim: null,
    kelasPengirim: null,
    tanggal: '2026-10-06',
    status: 'Ditinjau',
    tanggapanResmi: 'Dalam proses inventarisasi dan koordinasi bersama tim IT madrasah.',
    penindaklanjut: 'Komisi 4 OPDIM',
    riwayatStatus: [
      { status: 'Diterima', waktu: '06 Okt 2026', keterangan: 'Laporan keluhan masuk ke Kotak Aspirasi.' },
      { status: 'Ditinjau', waktu: '07 Okt 2026', keterangan: 'Komisi 4 melakukan verifikasi kendala sinyal di lokasi perpustakaan.' },
    ],
    createdAt: 1759708800000,
  },
];

// Seed baseline records if empty
const existingCountRow = db.prepare('SELECT COUNT(*) AS count FROM aspirasi').get() as { count: number };
if (existingCountRow.count === 0) {
  const insertSeed = db.prepare(`
    INSERT INTO aspirasi (
      id, kode_lacak, jenis, kategori, judul, isi, is_anonim,
      nama_pengirim, kelas_pengirim, tanggal, status, tanggapan_resmi,
      penindaklanjut, riwayat_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of SEED_ASPIRASI) {
    insertSeed.run(
      row.id,
      row.kodeLacak,
      row.jenis,
      row.kategori,
      row.judul,
      row.isi,
      row.isAnonim ? 1 : 0,
      row.namaPengirim,
      row.kelasPengirim,
      row.tanggal,
      row.status,
      row.tanggapanResmi,
      row.penindaklanjut,
      JSON.stringify(row.riwayatStatus),
      row.createdAt
    );
  }
}

const existingPollCountRow = db.prepare('SELECT COUNT(*) AS count FROM polling_topics').get() as { count: number };
if (existingPollCountRow.count === 0) {
  const seedPolls = [
    {
      id: 'poll-1',
      slug: 'fokus-agenda-vistara-talks-3',
      question: 'Tema utama apa yang paling kamu harapkan untuk VISTARA Talks #3?',
      description: 'Hasil jajak pendapat ini menjadi dasar Komisi 2 & Komisi 4 menentukan topik dan narasumber sesi diskusi berikutnya.',
      category: 'Kegiatan Siswa',
      status: 'active',
      closesAt: '30 November 2026',
      createdAt: 1759708800000,
      options: [
        { id: 'poll-1-opt-1', label: 'Persiapan Olimpiade & Masuk PTN Favorit', votes: 64, sortOrder: 1 },
        { id: 'poll-1-opt-2', label: 'Kewirausahaan Muda & Ekonomi Kreatif Pelajar', votes: 49, sortOrder: 2 },
        { id: 'poll-1-opt-3', label: 'Literasi Digital, AI Produktif & Keamanan Siber', votes: 72, sortOrder: 3 },
        { id: 'poll-1-opt-4', label: 'Kesehatan Mental & Manajemen Waktu Santri-Siswa', votes: 41, sortOrder: 4 },
      ],
    },
    {
      id: 'poll-2',
      slug: 'prioritas-fasilitas-madrasah-triwulan-2',
      question: 'Fasilitas madrasah mana yang perlu diprioritaskan pada audiensi Triwulan II?',
      description: 'Pilihan siswa akan dirangkum oleh Komisi 4 dalam rekomendasi resmi ke bagian Sarana & Prasarana.',
      category: 'Fasilitas Madrasah',
      status: 'active',
      closesAt: '15 Desember 2026',
      createdAt: 1759622400000,
      options: [
        { id: 'poll-2-opt-1', label: 'Perluasan Area Baca & Stopkontak di Perpustakaan', votes: 83, sortOrder: 1 },
        { id: 'poll-2-opt-2', label: 'Penambahan Loker Penyimpanan Barang per Kelas', votes: 58, sortOrder: 2 },
        { id: 'poll-2-opt-3', label: 'Perbaikan Peneduh & Penerangan Area Gazebo', votes: 47, sortOrder: 3 },
      ],
    },
  ];

  const insertTopic = db.prepare(`
    INSERT INTO polling_topics (id, slug, question, description, category, status, closes_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertOption = db.prepare(`
    INSERT INTO polling_options (id, poll_id, label, votes, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const p of seedPolls) {
    insertTopic.run(p.id, p.slug, p.question, p.description, p.category, p.status, p.closesAt, p.createdAt);
    for (const o of p.options) {
      insertOption.run(o.id, p.id, o.label, o.votes, o.sortOrder);
    }
  }
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

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
    try {
      const code = String(req.params.code || '').trim().toUpperCase();
      const body = req.body ?? {};
      const status = String(body.status || '').trim();
      const keterangan = String(body.keterangan || '').trim();
      const tanggapanResmi = body.tanggapanResmi ? String(body.tanggapanResmi).trim() : undefined;

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
        SET status = ?, tanggapan_resmi = ?, riwayat_status = ?
        WHERE id = ?
      `).run(
        status,
        tanggapanResmi ?? existing.tanggapanResmi ?? null,
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

  // ── Vite Dev Middleware / Production Static Serve ───────────
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
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
