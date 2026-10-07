// ============================================================
// VISTARA Hub — Type Definitions
// ============================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface ProgramKerja {
  id: string;
  slug: string;
  title: string;
  komisi: string;
  komisiColor: string;
  status: 'planned' | 'ongoing' | 'completed';
  description: string;
  thumbnail?: string;
  timeline: string;
  targetOutput: string;
  frekuensi?: 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan' | 'Insidental';
  tujuan?: string;
  misiMingguan?: { minggu: string; tema: string; deskripsi?: string }[];
  mekanisme?: string[];
  pic?: string;
}

export interface BeritaItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  thumbnail?: string;
  content?: string;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'past';
  thumbnail?: string;
}

export interface PrestasiItem {
  id: string;
  slug: string;
  title: string;
  tingkat: 'sekolah' | 'kabupaten' | 'provinsi' | 'nasional' | 'internasional';
  kategori: string;
  peraih: string;
  tahun: string;
  medali: 'emas' | 'perak' | 'perunggu' | 'juara1' | 'juara2' | 'juara3' | 'peserta' | 'harapan';
  penyelenggara: string;
  thumbnail?: string;
}

export interface GaleriItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  coverImage: string;
  imageCount: number;
}

export interface ArsipItem {
  id: string;
  title: string;
  jenis: 'dokumen' | 'laporan' | 'sk' | 'notulen' | 'foto' | 'video';
  tanggal: string;
  ukuran: string;
  deskripsi: string;
}

export interface KomisiInfo {
  id: string;
  name: string;
  fullName: string;
  color: string;
  icon: string;
  description: string;
}

export interface AspirastiForm {
  nama: string;
  kelas: string;
  kategori: string;
  judul: string;
  isi: string;
}
