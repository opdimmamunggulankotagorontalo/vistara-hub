-- ============================================================
-- VISTARA Hub — Supabase PostgreSQL Schema, Auth RPCs & Storage
-- Covers: Aspirasi, Polling, Events, Gallery, Berita, Arsip,
--         Prestasi, & Secure Account Auth (Super Admin Root + Pengurus)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  cover_image TEXT NOT NULL DEFAULT '',
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

-- 6. Pusat Arsip & Dokumen Digital
CREATE TABLE IF NOT EXISTS public.arsip (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('sk', 'notulen', 'dokumen', 'laporan')),
  tanggal TEXT NOT NULL,
  ukuran TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Hall of Fame Prestasi
CREATE TABLE IF NOT EXISTS public.prestasi (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tingkat TEXT NOT NULL CHECK (tingkat IN ('nasional', 'provinsi', 'kabupaten', 'kota')),
  kategori TEXT NOT NULL,
  peraih TEXT NOT NULL,
  tahun TEXT NOT NULL,
  medali TEXT NOT NULL CHECK (medali IN ('emas', 'perak', 'perunggu', 'juara1', 'juara2', 'juara3', 'peserta')),
  penyelenggara TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.prestasi ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.prestasi ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- 7b. Struktur Anggota OPDIM, Kepala Madrasah & Pembina
CREATE TABLE IF NOT EXISTS public.anggota_opdim (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('pimpinan', 'inti', 'komisi1', 'komisi2', 'komisi3', 'komisi4', 'komisi5')),
  peran_level TEXT NOT NULL CHECK (peran_level IN ('kepala_madrasah', 'pembina', 'inti', 'ketua_komisi', 'anggota')),
  tugas_utama TEXT NOT NULL DEFAULT '',
  foto_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.anggota_opdim (id, full_name, jabatan, unit, peran_level, tugas_utama, foto_url, sort_order, is_active) VALUES
  ('ang-pimpinan-1', 'Hj. Sitti Khasriani, S.S., M.Pd.', 'Kepala Madrasah', 'pimpinan', 'kepala_madrasah', 'Penanggung jawab tertinggi dan pengawas institusional seluruh gerak OPDIM VISTARA.', '', 1, TRUE),
  ('ang-pimpinan-2', 'Selvianingsih Salilama, S.Pd.', 'Pembina OPDIM', 'pimpinan', 'pembina', 'Pembimbing teknis harian dan pengarah strategis organisasi OPDIM VISTARA 2026–2027.', '', 2, TRUE),
  ('ang-inti-1', 'Muhamad Aryansyah Thaib', 'Ketua OPDIM', 'inti', 'inti', 'Memimpin, mengoordinasikan, dan mengarahkan roda organisasi serta mewakili OPDIM dalam hubungan internal maupun eksternal.', '', 3, TRUE),
  ('ang-inti-2', 'Khansa Salsabila Azzahra', 'Wakil Ketua OPDIM', 'inti', 'inti', 'Mendampingi Ketua, mengoordinasikan target capaian 5 Komisi, serta mengawasi kedisiplinan dan soliditas internal kepengurusan.', '', 4, TRUE),
  ('ang-inti-3', 'Muhammad Yusuf Lauma', 'Sekretaris', 'inti', 'inti', 'Mengelola tata persuratan resmi, arsip digital, notulen rapat pleno, serta kompilasi Laporan Pertanggungjawaban (LPJ).', '', 5, TRUE),
  ('ang-inti-4', 'Alifia Salsabila Kasim', 'Bendahara', 'inti', 'inti', 'Mengelola dan membukukan kas keuangan secara transparan, memverifikasi RAB komisi, dan menyusun laporan arus kas berkala.', '', 6, TRUE),
  ('ang-inti-5', 'Muhammad Akmal Karsimin', 'Koordinator Lapangan (Korlap)', 'inti', 'inti', 'Mengoordinasikan kesiapan teknis, logistik lapangan, pengondisian peserta didik, dan komando taktis acara madrasah.', '', 7, TRUE),
  ('ang-k1-1', 'Muhamad Al-Faruq Hi Djaim', 'Ketua Komisi 1 — Pengawasan', 'komisi1', 'ketua_komisi', 'Memimpin pengawasan program kerja seluruh komisi, kedisiplinan pengurus terhadap AD/ART, dan kepatuhan keputusan paripurna.', '', 8, TRUE),
  ('ang-k1-2', 'Dava Rizky Ramadhan Lelengboto', 'Anggota Komisi 1 — Pengawasan', 'komisi1', 'anggota', 'Memantau kedisiplinan pelaksanaan proker dan kepatuhan tata tertib AD/ART.', '', 9, TRUE),
  ('ang-k1-3', 'Mohamad Luthfi Ismail', 'Anggota Komisi 1 — Pengawasan', 'komisi1', 'anggota', 'Melaksanakan monitoring kegiatan dan evaluasi keputusan rapat paripurna.', '', 10, TRUE),
  ('ang-k1-4', 'Ziviwilyani', 'Anggota Komisi 1 — Pengawasan', 'komisi1', 'anggota', 'Mendampingi pengawasan operasional dan laporan kepatuhan program kerja komisi.', '', 11, TRUE),
  ('ang-k1-5', 'Muhammad Azzam Almir', 'Anggota Komisi 1 — Pengawasan', 'komisi1', 'anggota', 'Mendukung pengawasan disiplin organisasi dan evaluasi berkala antar-komisi.', '', 12, TRUE),
  ('ang-k2-1', 'Muhammad Yusuf Lauma', 'Ketua Komisi 2 — Eksternal & Diplomasi', 'komisi2', 'ketua_komisi', 'Memimpin diplomasi dengan organisasi pelajar lain, kemitraan alumni, serta kerja sama eksternal atas izin Kepala Madrasah.', '', 13, TRUE),
  ('ang-k2-2', 'Naylah Fadhiya Putri Giasi', 'Anggota Komisi 2 — Eksternal & Diplomasi', 'komisi2', 'anggota', 'Membangun komunikasi antar-OSIS sekolah mitra dan koordinasi studi banding.', '', 14, TRUE),
  ('ang-k2-3', 'Fakhirah Hikmah Ramadhani Duengo', 'Anggota Komisi 2 — Eksternal & Diplomasi', 'komisi2', 'anggota', 'Menjalin relasi kemitraan positif bersama alumni dan mitra kegiatan.', '', 15, TRUE),
  ('ang-k2-4', 'Reyhana Qanitah', 'Anggota Komisi 2 — Eksternal & Diplomasi', 'komisi2', 'anggota', 'Mengelola korespondensi dan protokol kunjungan eksternal madrasah.', '', 16, TRUE),
  ('ang-k2-5', 'Sharifa Fukayna Urbi Aswan', 'Anggota Komisi 2 — Eksternal & Diplomasi', 'komisi2', 'anggota', 'Membantu koordinasi delegasi pelajar dan agenda kolaborasi sosial.', '', 17, TRUE),
  ('ang-k3-1', 'Moh. Rifhal Saputra', 'Ketua Komisi 3 — Hubungan Internal', 'komisi3', 'ketua_komisi', 'Memimpin koordinasi harmonis antar-kelas, solidaritas ekstrakurikuler, dan musyawarah penyelesaian dinamika santri.', '', 18, TRUE),
  ('ang-k3-2', 'Moh. Ardiansya K. Barata', 'Anggota Komisi 3 — Hubungan Internal', 'komisi3', 'anggota', 'Mengoordinasikan komunikasi pengurus kelas dan agenda kebersamaan internal.', '', 19, TRUE),
  ('ang-k3-3', 'Muhammad Alif Alfaridzi Hapiz', 'Anggota Komisi 3 — Hubungan Internal', 'komisi3', 'anggota', 'Menghubungkan sinergi antar-ekstrakurikuler di lingkungan madrasah.', '', 20, TRUE),
  ('ang-k3-4', 'Iedh R. Abas', 'Anggota Komisi 3 — Hubungan Internal', 'komisi3', 'anggota', 'Membantu mediasi kekeluargaan dan kegiatan solidaritas antar-santri.', '', 21, TRUE),
  ('ang-k3-5', 'Magfirah Hasan', 'Anggota Komisi 3 — Hubungan Internal', 'komisi3', 'anggota', 'Menjaga harmonisasi komunikasi internal kelas dan program lingkungan sekolah.', '', 22, TRUE),
  ('ang-k3-6', 'Anugrah Basri', 'Anggota Komisi 3 — Hubungan Internal', 'komisi3', 'anggota', 'Mendukung koordinasi kegiatan internal madrasah bersama seluruh warga kelas.', '', 23, TRUE),
  ('ang-k4-1', 'Nailah Syaqilah Husain', 'Ketua Komisi 4 — Aspirasi Siswa', 'komisi4', 'ketua_komisi', 'Memimpin pengelolaan Kotak Aspirasi, kurasi masukan siswa, jajak pendapat, dan advokasi kebutuhan santri.', '', 24, TRUE),
  ('ang-k4-2', 'Ain Tahir', 'Anggota Komisi 4 — Aspirasi Siswa', 'komisi4', 'anggota', 'Mengumpulkan, memverifikasi, dan merekapitulasi aspirasi maupun polling siswa.', '', 25, TRUE),
  ('ang-k4-3', 'Aisyah Karimah', 'Anggota Komisi 4 — Aspirasi Siswa', 'komisi4', 'anggota', 'Menindaklanjuti kotak saran dan menyiapkan laporan aspirasi untuk audiensi.', '', 26, TRUE),
  ('ang-k5-1', 'Ihsan Abdussalam Ma''ruf', 'Ketua Komisi 5 — Media & Humas', 'komisi5', 'ketua_komisi', 'Memimpin publikasi informasi organisasi, dokumentasi multimedia, penjagaan brand guide VISTARA, dan media sosial resmi.', '', 27, TRUE),
  ('ang-k5-2', 'Rafika Devi Sekar Sari', 'Anggota Komisi 5 — Media & Humas', 'komisi5', 'anggota', 'Mengelola redaksi berita, copywriting publikasi, dan dokumentasi agenda madrasah.', '', 28, TRUE),
  ('ang-k5-3', 'Rafael Ahmad Baihaqih Djafara', 'Anggota Komisi 5 — Media & Humas', 'komisi5', 'anggota', 'Melaksanakan liputan fotografi, videografi, dan arsip visual setiap kegiatan.', '', 29, TRUE),
  ('ang-k5-4', 'Sulaiman Nul Ihza D. Hasan', 'Anggota Komisi 5 — Media & Humas', 'komisi5', 'anggota', 'Mengembangkan desain visual, poster publikasi, dan konten media sosial VISTARA.', '', 30, TRUE),
  ('ang-k5-5', 'Razwa Raihana Maabu', 'Anggota Komisi 5 — Media & Humas', 'komisi5', 'anggota', 'Mengelola penjadwalan publikasi, galeri dokumentasi, dan apresiasi prestasi siswa.', '', 31, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. Akun Pengurus & Sesi Terenkripsi (Username + Password bcrypt + Revocable Server Sessions)
DROP FUNCTION IF EXISTS public.verify_admin_pin(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_admin_roles();
DROP FUNCTION IF EXISTS public.update_admin_pin(TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS public.admin_roles;

CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('root', 'inti', 'komisi4', 'komisi5')),
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed ONLY ONE initial Super Admin (Administrator Root) account.
-- Other accounts (Ketua/Sekretaris Inti, Komisi 4, Komisi 5) are created by Super Admin after login.
INSERT INTO public.admin_accounts (
  id, username, full_name, jabatan, role, password_hash, must_change_password, is_active
) VALUES (
  'acc-root-001',
  'superadmin',
  'Administrator Root OPDIM',
  'Administrator Root',
  'root',
  crypt('VistaraRoot#2026', gen_salt('bf', 10)),
  TRUE,
  TRUE
)
ON CONFLICT (username) DO NOTHING;

CREATE OR REPLACE FUNCTION public._resolve_active_admin_session(p_token TEXT)
RETURNS TABLE(
  account_id TEXT,
  username TEXT,
  full_name TEXT,
  jabatan TEXT,
  role TEXT,
  must_change_password BOOLEAN,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  IF p_token IS NULL OR LENGTH(TRIM(p_token)) < 16 THEN
    RETURN;
  END IF;
  v_hash := encode(digest(TRIM(p_token), 'sha256'), 'hex');
  RETURN QUERY
  SELECT a.id, a.username, a.full_name, a.jabatan, a.role, a.must_change_password, a.is_active
  FROM public.admin_sessions s
  JOIN public.admin_accounts a ON a.id = s.account_id
  WHERE s.token_hash = v_hash
    AND s.expires_at > NOW()
    AND a.is_active = TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_login(p_username TEXT, p_password TEXT)
RETURNS TABLE(
  account_id TEXT,
  username TEXT,
  full_name TEXT,
  jabatan TEXT,
  role TEXT,
  token TEXT,
  must_change_password BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user TEXT := LOWER(TRIM(COALESCE(p_username, '')));
  v_acc public.admin_accounts%ROWTYPE;
  v_raw_token TEXT;
  v_token_hash TEXT;
  v_next_attempts INTEGER;
BEGIN
  SELECT * INTO v_acc FROM public.admin_accounts WHERE admin_accounts.username = v_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Username atau password tidak sesuai.';
  END IF;

  IF NOT v_acc.is_active THEN
    RAISE EXCEPTION 'Akun ini telah dinonaktifkan oleh Super Admin.';
  END IF;

  IF v_acc.locked_until IS NOT NULL AND v_acc.locked_until > NOW() THEN
    RAISE EXCEPTION 'Terlalu banyak percobaan masuk gagal. Coba lagi beberapa menit lagi.';
  END IF;

  IF v_acc.password_hash <> crypt(COALESCE(p_password, ''), v_acc.password_hash) THEN
    v_next_attempts := v_acc.failed_attempts + 1;
    UPDATE public.admin_accounts
    SET failed_attempts = CASE WHEN v_next_attempts >= 5 THEN 0 ELSE v_next_attempts END,
        locked_until = CASE WHEN v_next_attempts >= 5 THEN NOW() + INTERVAL '5 minutes' ELSE NULL END,
        updated_at = NOW()
    WHERE id = v_acc.id;
    IF v_next_attempts >= 5 THEN
      RAISE EXCEPTION 'Terlalu banyak percobaan gagal. Akun dikunci sementara selama 5 menit.';
    END IF;
    RAISE EXCEPTION 'Username atau password tidak sesuai.';
  END IF;

  v_raw_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');

  DELETE FROM public.admin_sessions WHERE expires_at <= NOW();
  INSERT INTO public.admin_sessions (token_hash, account_id, expires_at)
  VALUES (v_token_hash, v_acc.id, NOW() + INTERVAL '12 hours');

  UPDATE public.admin_accounts
  SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW()
  WHERE id = v_acc.id;

  RETURN QUERY SELECT v_acc.id, v_acc.username, v_acc.full_name, v_acc.jabatan, v_acc.role, v_raw_token, v_acc.must_change_password;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_validate_session(p_token TEXT)
RETURNS TABLE(
  account_id TEXT,
  username TEXT,
  full_name TEXT,
  jabatan TEXT,
  role TEXT,
  must_change_password BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.account_id, s.username, s.full_name, s.jabatan, s.role, s.must_change_password
  FROM public._resolve_active_admin_session(p_token) s;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_logout(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT := encode(digest(TRIM(COALESCE(p_token, '')), 'sha256'), 'hex');
BEGIN
  DELETE FROM public.admin_sessions WHERE token_hash = v_hash;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_own_password(
  p_token TEXT,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS TABLE(token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sess RECORD;
  v_acc public.admin_accounts%ROWTYPE;
  v_raw_token TEXT;
  v_token_hash TEXT;
BEGIN
  SELECT * INTO v_sess FROM public._resolve_active_admin_session(p_token) LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sesi tidak valid atau telah berakhir.';
  END IF;

  SELECT * INTO v_acc FROM public.admin_accounts WHERE id = v_sess.account_id;
  IF v_acc.password_hash <> crypt(COALESCE(p_current_password, ''), v_acc.password_hash) THEN
    RAISE EXCEPTION 'Password saat ini tidak sesuai.';
  END IF;

  IF LENGTH(COALESCE(p_new_password, '')) < 1 OR LENGTH(COALESCE(p_new_password, '')) > 72 THEN
    RAISE EXCEPTION 'Password baru wajib diisi (maksimal 72 karakter).';
  END IF;

  IF p_new_password = p_current_password THEN
    RAISE EXCEPTION 'Password baru tidak boleh sama dengan password lama.';
  END IF;

  DELETE FROM public.admin_sessions WHERE account_id = v_acc.id;
  v_raw_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');
  INSERT INTO public.admin_sessions (token_hash, account_id, expires_at)
  VALUES (v_token_hash, v_acc.id, NOW() + INTERVAL '12 hours');

  UPDATE public.admin_accounts
  SET password_hash = crypt(p_new_password, gen_salt('bf', 10)),
      must_change_password = FALSE,
      updated_at = NOW()
  WHERE id = v_acc.id;

  RETURN QUERY SELECT v_raw_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_accounts(p_token TEXT)
RETURNS TABLE(
  id TEXT,
  username TEXT,
  full_name TEXT,
  jabatan TEXT,
  role TEXT,
  is_active BOOLEAN,
  must_change_password BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sess RECORD;
BEGIN
  SELECT * INTO v_sess FROM public._resolve_active_admin_session(p_token) LIMIT 1;
  IF NOT FOUND OR v_sess.role NOT IN ('root', 'inti') OR v_sess.must_change_password THEN
    RAISE EXCEPTION 'Hanya Super Admin atau Pengurus Inti aktif yang diizinkan melihat daftar akun.';
  END IF;

  RETURN QUERY
  SELECT a.id, a.username, a.full_name, a.jabatan, a.role, a.is_active, a.must_change_password, a.created_at, a.updated_at, a.last_login_at
  FROM public.admin_accounts a
  ORDER BY CASE a.role WHEN 'root' THEN 1 WHEN 'inti' THEN 2 WHEN 'komisi4' THEN 3 ELSE 4 END, a.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_account(
  p_token TEXT,
  p_username TEXT,
  p_full_name TEXT,
  p_jabatan TEXT,
  p_role TEXT,
  p_password TEXT,
  p_must_change BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
  id TEXT,
  username TEXT,
  full_name TEXT,
  jabatan TEXT,
  role TEXT,
  is_active BOOLEAN,
  must_change_password BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sess RECORD;
  v_user TEXT := LOWER(TRIM(COALESCE(p_username, '')));
  v_id TEXT := 'acc-' || FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT || '-' || FLOOR(100 + RANDOM() * 900)::TEXT;
BEGIN
  SELECT * INTO v_sess FROM public._resolve_active_admin_session(p_token) LIMIT 1;
  IF NOT FOUND OR v_sess.role NOT IN ('root', 'inti') OR v_sess.must_change_password THEN
    RAISE EXCEPTION 'Hanya Super Admin atau Pengurus Inti aktif yang diizinkan membuat akun baru.';
  END IF;

  IF v_user !~ '^[a-z0-9._-]{3,32}$' THEN
    RAISE EXCEPTION 'Username tidak valid (3-32 karakter huruf kecil, angka, titik, _ atau -).';
  END IF;

  IF LENGTH(COALESCE(p_password, '')) < 1 OR LENGTH(COALESCE(p_password, '')) > 72 THEN
    RAISE EXCEPTION 'Password awal wajib diisi (maksimal 72 karakter).';
  END IF;

  IF p_role NOT IN ('root', 'inti', 'komisi4', 'komisi5') THEN
    RAISE EXCEPTION 'Peran akses tidak valid.';
  END IF;

  IF v_sess.role <> 'root' AND p_role = 'root' THEN
    RAISE EXCEPTION 'Hanya Super Admin (Root) yang dapat membuat akun Super Admin.';
  END IF;

  INSERT INTO public.admin_accounts (
    id, username, full_name, jabatan, role, password_hash, must_change_password, is_active
  ) VALUES (
    v_id,
    v_user,
    TRIM(p_full_name),
    TRIM(p_jabatan),
    p_role,
    crypt(p_password, gen_salt('bf', 10)),
    COALESCE(p_must_change, TRUE),
    TRUE
  );

  RETURN QUERY
  SELECT a.id, a.username, a.full_name, a.jabatan, a.role, a.is_active, a.must_change_password, a.created_at, a.updated_at, a.last_login_at
  FROM public.admin_accounts a WHERE a.id = v_id;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_update_account(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.admin_update_account(
  p_token TEXT,
  p_account_id TEXT,
  p_username TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_jabatan TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_new_password TEXT DEFAULT NULL,
  p_must_change BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
  id TEXT,
  username TEXT,
  full_name TEXT,
  jabatan TEXT,
  role TEXT,
  is_active BOOLEAN,
  must_change_password BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sess RECORD;
  v_target public.admin_accounts%ROWTYPE;
  v_next_username TEXT;
BEGIN
  SELECT * INTO v_sess FROM public._resolve_active_admin_session(p_token) LIMIT 1;
  IF NOT FOUND OR v_sess.role NOT IN ('root', 'inti') OR v_sess.must_change_password THEN
    RAISE EXCEPTION 'Hanya Super Admin atau Pengurus Inti aktif yang diizinkan memperbarui akun.';
  END IF;

  SELECT * INTO v_target FROM public.admin_accounts WHERE admin_accounts.id = p_account_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Akun pengurus tidak ditemukan.';
  END IF;

  IF v_sess.role <> 'root' AND v_target.role = 'root' THEN
    RAISE EXCEPTION 'Akun Super Admin (Root) hanya dapat diubah oleh Administrator Root.';
  END IF;

  IF v_sess.role <> 'root' AND p_role = 'root' THEN
    RAISE EXCEPTION 'Pengurus Inti tidak dapat mengubah hak akses menjadi Super Admin (Root).';
  END IF;

  IF p_account_id = v_sess.account_id AND p_is_active = FALSE THEN
    RAISE EXCEPTION 'Anda tidak dapat menonaktifkan akun yang sedang digunakan.';
  END IF;

  v_next_username := LOWER(TRIM(COALESCE(NULLIF(p_username, ''), v_target.username)));
  IF v_next_username !~ '^[a-z0-9._-]{3,32}$' THEN
    RAISE EXCEPTION 'Username harus 3-32 karakter (huruf kecil, angka, titik, _ atau -).';
  END IF;

  IF v_next_username <> v_target.username AND EXISTS (
    SELECT 1 FROM public.admin_accounts a WHERE a.username = v_next_username AND a.id <> p_account_id
  ) THEN
    RAISE EXCEPTION 'Username tersebut sudah dipakai oleh akun lain.';
  END IF;

  IF p_new_password IS NOT NULL AND LENGTH(p_new_password) > 72 THEN
    RAISE EXCEPTION 'Password baru maksimal 72 karakter.';
  END IF;

  UPDATE public.admin_accounts
  SET username = v_next_username,
      full_name = COALESCE(NULLIF(TRIM(p_full_name), ''), full_name),
      jabatan = COALESCE(NULLIF(TRIM(p_jabatan), ''), jabatan),
      role = CASE WHEN p_role IN ('root', 'inti', 'komisi4', 'komisi5') THEN p_role ELSE role END,
      is_active = COALESCE(p_is_active, is_active),
      password_hash = CASE WHEN p_new_password IS NOT NULL AND LENGTH(p_new_password) >= 1
        THEN crypt(p_new_password, gen_salt('bf', 10)) ELSE password_hash END,
      must_change_password = COALESCE(p_must_change, must_change_password),
      updated_at = NOW()
  WHERE admin_accounts.id = p_account_id;

  IF p_is_active = FALSE OR (p_account_id <> v_sess.account_id AND ((p_new_password IS NOT NULL AND LENGTH(p_new_password) >= 1) OR v_next_username <> v_target.username)) THEN
    DELETE FROM public.admin_sessions WHERE account_id = p_account_id;
  END IF;

  RETURN QUERY
  SELECT a.id, a.username, a.full_name, a.jabatan, a.role, a.is_active, a.must_change_password, a.created_at, a.updated_at, a.last_login_at
  FROM public.admin_accounts a WHERE a.id = p_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_account(p_token TEXT, p_account_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sess RECORD;
  v_target_role TEXT;
BEGIN
  SELECT * INTO v_sess FROM public._resolve_active_admin_session(p_token) LIMIT 1;
  IF NOT FOUND OR v_sess.role NOT IN ('root', 'inti') OR v_sess.must_change_password THEN
    RAISE EXCEPTION 'Hanya Super Admin atau Pengurus Inti aktif yang diizinkan menghapus akun.';
  END IF;

  IF p_account_id = v_sess.account_id THEN
    RAISE EXCEPTION 'Anda tidak dapat menghapus akun yang sedang aktif digunakan.';
  END IF;

  SELECT a.role INTO v_target_role FROM public.admin_accounts a WHERE a.id = p_account_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  IF v_sess.role <> 'root' AND v_target_role = 'root' THEN
    RAISE EXCEPTION 'Akun Super Admin (Root) hanya dapat dihapus oleh Administrator Root.';
  END IF;

  DELETE FROM public.admin_accounts WHERE id = p_account_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_poll_vote(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_validate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_logout(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_own_password(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_accounts(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_account(TEXT, TEXT) TO anon, authenticated;

-- Clean up ALL residual dummy rows from Aspirasi & Polling
DELETE FROM public.polling_options;
DELETE FROM public.polling_topics;
DELETE FROM public.aspirasi;

-- Row Level Security (RLS)
ALTER TABLE public.aspirasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polling_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polling_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arsip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota_opdim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Lock admin_accounts and admin_sessions completely from direct REST queries
DROP POLICY IF EXISTS "Deny direct admin_accounts access" ON public.admin_accounts;
CREATE POLICY "Deny direct admin_accounts access" ON public.admin_accounts FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Deny direct admin_sessions access" ON public.admin_sessions;
CREATE POLICY "Deny direct admin_sessions access" ON public.admin_sessions FOR ALL USING (false) WITH CHECK (false);

-- Content Table Policies
DROP POLICY IF EXISTS "Public manage aspirasi" ON public.aspirasi;
DROP POLICY IF EXISTS "Public read aspirasi" ON public.aspirasi;
DROP POLICY IF EXISTS "Public insert aspirasi" ON public.aspirasi;
DROP POLICY IF EXISTS "Public update aspirasi status" ON public.aspirasi;
CREATE POLICY "Public manage aspirasi" ON public.aspirasi FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage polling topics" ON public.polling_topics;
DROP POLICY IF EXISTS "Public read polling topics" ON public.polling_topics;
CREATE POLICY "Public manage polling topics" ON public.polling_topics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage polling options" ON public.polling_options;
DROP POLICY IF EXISTS "Public read polling options" ON public.polling_options;
CREATE POLICY "Public manage polling options" ON public.polling_options FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage events" ON public.events;
DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public manage events" ON public.events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage gallery" ON public.gallery;
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;
CREATE POLICY "Public manage gallery" ON public.gallery FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage berita" ON public.berita;
DROP POLICY IF EXISTS "Public read berita" ON public.berita;
CREATE POLICY "Public manage berita" ON public.berita FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage arsip" ON public.arsip;
CREATE POLICY "Public manage arsip" ON public.arsip FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage prestasi" ON public.prestasi;
CREATE POLICY "Public manage prestasi" ON public.prestasi FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage anggota_opdim" ON public.anggota_opdim;
CREATE POLICY "Public manage anggota_opdim" ON public.anggota_opdim FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage own reminders" ON public.event_reminders;
CREATE POLICY "Public manage own reminders" ON public.event_reminders FOR ALL USING (true) WITH CHECK (true);

-- 9. Notifikasi Custom Maskot TARA (Admin Root & Pengurus Inti)
CREATE TABLE IF NOT EXISTS public.custom_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'pengumuman',
  target_path TEXT NOT NULL DEFAULT '/beranda',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT 'Pengurus OPDIM',
  expires_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public manage custom_notifications" ON public.custom_notifications;
CREATE POLICY "Public manage custom_notifications" ON public.custom_notifications FOR ALL USING (true) WITH CHECK (true);

-- Supabase Storage Bucket for Optimized 1080p WebP Media & Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vistara-media', 'vistara-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read vistara-media" ON storage.objects;
CREATE POLICY "Public read vistara-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'vistara-media');

DROP POLICY IF EXISTS "Public upload vistara-media" ON storage.objects;
CREATE POLICY "Public upload vistara-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vistara-media');

DROP POLICY IF EXISTS "Public update vistara-media" ON storage.objects;
CREATE POLICY "Public update vistara-media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'vistara-media') WITH CHECK (bucket_id = 'vistara-media');

DROP POLICY IF EXISTS "Public delete vistara-media" ON storage.objects;
CREATE POLICY "Public delete vistara-media" ON storage.objects
  FOR DELETE USING (bucket_id = 'vistara-media');

-- Enable Supabase Realtime replication for live sync modules
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.aspirasi;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.polling_topics;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.polling_options;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.berita;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.arsip;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.prestasi;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.anggota_opdim;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
