-- ============================================================
-- VISTARA Hub — Supabase PostgreSQL Schema & Realtime Setup
-- Covers: Aspirasi, Polling, Events, Gallery, Berita, Reminders
-- ============================================================

-- 1. Aspirasi Siswa
CREATE TABLE IF NOT EXISTS public.aspirasi (
  id TEXT PRIMARY KEY,
  kode_lacak TEXT UNIQUE NOT NULL,
  jenis TEXT NOT NULL,
  kategori TEXT NOT NULL,
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  is_anonim BOOLEAN NOT NULL DEFAULT TRUE,
  nama_pengirim TEXT,
  kelas_pengirim TEXT,
  tanggal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Diterima',
  tanggapan_resmi TEXT,
  penindaklanjut TEXT,
  riwayat_status JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Polling Siswa (Topik & Opsi)
CREATE TABLE IF NOT EXISTS public.polling_topics (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Umum',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  closes_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.polling_options (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES public.polling_topics(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Atomic vote increment RPC
CREATE OR REPLACE FUNCTION public.cast_poll_vote(p_poll_id TEXT, p_option_id TEXT)
RETURNS TABLE(id TEXT, poll_id TEXT, label TEXT, votes INTEGER, sort_order INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.polling_options AS po
  SET votes = po.votes + 1
  FROM public.polling_topics AS pt
  WHERE po.poll_id = pt.id
    AND po.poll_id = p_poll_id
    AND po.id = p_option_id
    AND pt.status = 'active'
  RETURNING po.id, po.poll_id, po.label, po.votes, po.sort_order;
END;
$$;

-- 3. Agenda Events & Pengingat
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'past')),
  thumbnail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_reminders (
  client_key TEXT NOT NULL,
  event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (client_key, event_id)
);

-- 4. Galeri Dokumentasi
CREATE TABLE IF NOT EXISTS public.gallery (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  image_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Berita Resmi OPDIM
CREATE TABLE IF NOT EXISTS public.berita (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  author TEXT NOT NULL,
  thumbnail TEXT,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant execute permission on polling RPC to client roles
GRANT EXECUTE ON FUNCTION public.cast_poll_vote(TEXT, TEXT) TO anon, authenticated;

-- Row Level Security (RLS)
ALTER TABLE public.aspirasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polling_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polling_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;

-- Idempotent Public Policies
DROP POLICY IF EXISTS "Public read aspirasi" ON public.aspirasi;
CREATE POLICY "Public read aspirasi" ON public.aspirasi FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert aspirasi" ON public.aspirasi;
CREATE POLICY "Public insert aspirasi" ON public.aspirasi FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update aspirasi status" ON public.aspirasi;
CREATE POLICY "Public update aspirasi status" ON public.aspirasi FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read polling topics" ON public.polling_topics;
CREATE POLICY "Public read polling topics" ON public.polling_topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read polling options" ON public.polling_options;
CREATE POLICY "Public read polling options" ON public.polling_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read berita" ON public.berita;
CREATE POLICY "Public read berita" ON public.berita FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public manage own reminders" ON public.event_reminders;
CREATE POLICY "Public manage own reminders" ON public.event_reminders FOR ALL USING (true) WITH CHECK (true);

-- Seed initial Aspirasi & Polling data (idempotent)
INSERT INTO public.aspirasi (
  id, kode_lacak, jenis, kategori, judul, isi, is_anonim, nama_pengirim, kelas_pengirim,
  tanggal, status, tanggapan_resmi, penindaklanjut, riwayat_status
) VALUES
  (
    'asp-1',
    'ASP-2026-1001',
    'Saran',
    'Fasilitas Madrasah',
    'Penambahan Dispenser Air Minum di Lorong Kelas Lantai 2',
    'Penyediaan dispenser air minum isi ulang di dekat ruang kelas lantai 2 agar santri dan siswa tidak perlu turun ke kantin setiap kali membutuhkan air minum saat jam istirahat.',
    FALSE,
    'Siswa Kelas XI',
    'XI IPA 1',
    '2026-09-28',
    'Selesai',
    'Aspirasi telah disampaikan kepada bagian sarana madrasah. Dispenser tambahan telah dipasang dan beroperasi di koridor barat lantai 2.',
    'Komisi 4 OPDIM & Waka Sarpras',
    '[{"status":"Diterima","waktu":"28 Sep 2026","keterangan":"Aspirasi masuk ke sistem Kotak Aspirasi Komisi 4."},{"status":"Ditinjau","waktu":"29 Sep 2026","keterangan":"Diverifikasi kelayakannya oleh Komisi 4."},{"status":"Didiskusikan","waktu":"30 Sep 2026","keterangan":"Dibahas dalam rapat koordinasi pengurus OPDIM."},{"status":"Tindak Lanjut","waktu":"02 Okt 2026","keterangan":"Disampaikan secara resmi dalam audiensi bersama Waka Sarana & Prasarana."},{"status":"Selesai","waktu":"05 Okt 2026","keterangan":"Dispenser terpasang dan dapat digunakan bersama."}]'::jsonb
  ),
  (
    'asp-2',
    'ASP-2026-1002',
    'Ide',
    'Kegiatan Siswa',
    'Penguatan Mading Kreasi & Sesi Mentoring Belajar Sebaya',
    'Mengusulkan diadakannya rubrik tips belajar mingguan di mading dan sesi belajar kelompok sebaya menjelang ujian semester.',
    TRUE,
    NULL,
    NULL,
    '2026-10-01',
    'Tindak Lanjut',
    'Ide disinkronkan dengan program Papan Informasi Edukasi Komisi 3 dan sedang dirumuskan format jadwal belajarnya.',
    'Komisi 4 & Komisi 3',
    '[{"status":"Diterima","waktu":"01 Okt 2026","keterangan":"Aspirasi diterima dan terdata secara anonim."},{"status":"Ditinjau","waktu":"02 Okt 2026","keterangan":"Dinilai sangat konstruktif untuk akademik siswa."},{"status":"Didiskusikan","waktu":"04 Okt 2026","keterangan":"Dikoordinasikan dengan Komisi 3 bagian Edukasi."},{"status":"Tindak Lanjut","waktu":"06 Okt 2026","keterangan":"Penyusunan jadwal rubrik mading dan fasilitasi tutor sebaya."}]'::jsonb
  ),
  (
    'asp-3',
    'ASP-2026-1003',
    'Saran',
    'Kebersihan & Lingkungan',
    'Wadah Sampah Khusus Daur Ulang untuk Trash to Cash',
    'Agar program Trash to Cash Komisi 3 berjalan optimal, perlu ditandai tempat sampah khusus botol plastik di setiap sudut gazebo madrasah.',
    FALSE,
    'Perwakilan Kelas X',
    'X-2',
    '2026-10-03',
    'Didiskusikan',
    'Sedang dibahas bersama panitia Trash to Cash untuk pengadaan stiker penanda dan karung pilah.',
    'Komisi 4 & Tim Trash to Cash',
    '[{"status":"Diterima","waktu":"03 Okt 2026","keterangan":"Aspirasi diterima oleh tim piket aspirasi."},{"status":"Ditinjau","waktu":"04 Okt 2026","keterangan":"Diteruskan ke Ketua Komisi 4 Nayla Syaqila Husain."},{"status":"Didiskusikan","waktu":"07 Okt 2026","keterangan":"Sedang dimusyawarahkan pembiayaan pengadaan penanda bersama Bendahara."}]'::jsonb
  ),
  (
    'asp-4',
    'ASP-2026-1004',
    'Keluhan',
    'Fasilitas Madrasah',
    'Optimalisasi Jaringan Internet WiFi di Perpustakaan',
    'Kecepatan internet WiFi di perpustakaan sering melambat saat jam istirahat ketika banyak siswa mengakses referensi materi digital.',
    TRUE,
    NULL,
    NULL,
    '2026-10-06',
    'Ditinjau',
    'Dalam proses inventarisasi dan koordinasi bersama tim IT madrasah.',
    'Komisi 4 OPDIM',
    '[{"status":"Diterima","waktu":"06 Okt 2026","keterangan":"Laporan keluhan masuk ke Kotak Aspirasi."},{"status":"Ditinjau","waktu":"07 Okt 2026","keterangan":"Komisi 4 melakukan verifikasi kendala sinyal di lokasi perpustakaan."}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.polling_topics (id, slug, question, description, category, status, closes_at) VALUES
  (
    'poll-1',
    'fokus-agenda-vistara-talks-3',
    'Tema utama apa yang paling kamu harapkan untuk VISTARA Talks #3?',
    'Hasil jajak pendapat ini menjadi dasar Komisi 2 & Komisi 4 menentukan topik dan narasumber sesi diskusi berikutnya.',
    'Kegiatan Siswa',
    'active',
    '30 November 2026'
  ),
  (
    'poll-2',
    'prioritas-fasilitas-madrasah-triwulan-2',
    'Fasilitas madrasah mana yang perlu diprioritaskan pada audiensi Triwulan II?',
    'Pilihan siswa akan dirangkum oleh Komisi 4 dalam rekomendasi resmi ke bagian Sarana & Prasarana.',
    'Fasilitas Madrasah',
    'active',
    '15 Desember 2026'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.polling_options (id, poll_id, label, votes, sort_order) VALUES
  ('poll-1-opt-1', 'poll-1', 'Persiapan Olimpiade & Masuk PTN Favorit', 64, 1),
  ('poll-1-opt-2', 'poll-1', 'Kewirausahaan Muda & Ekonomi Kreatif Pelajar', 49, 2),
  ('poll-1-opt-3', 'poll-1', 'Literasi Digital, AI Produktif & Keamanan Siber', 72, 3),
  ('poll-1-opt-4', 'poll-1', 'Kesehatan Mental & Manajemen Waktu Santri-Siswa', 41, 4),
  ('poll-2-opt-1', 'poll-2', 'Perluasan Area Baca & Stopkontak di Perpustakaan', 83, 1),
  ('poll-2-opt-2', 'poll-2', 'Penambahan Loker Penyimpanan Barang per Kelas', 58, 2),
  ('poll-2-opt-3', 'poll-2', 'Perbaikan Peneduh & Penerangan Area Gazebo', 47, 3)
ON CONFLICT (id) DO NOTHING;

-- Enable Supabase Realtime replication for live sync modules
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.aspirasi;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.polling_topics;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.polling_options;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.berita;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
