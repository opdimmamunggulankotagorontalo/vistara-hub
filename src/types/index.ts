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
  // Extended official properties
  frekuensi?: string;
  kategoriProker?: 'Siklus' | 'Komisi 1' | 'Komisi 2' | 'Komisi 3' | 'Komisi 4' | 'Komisi 5';
  tujuan?: string;
  fungsi?: string;
  bentukKegiatan?: string[];
  mekanisme?: string[];
  manfaat?: string[];
  pj?: string;
  catatan?: string;
  indikatorKunci?: string;
  outputKonkret?: string[];
}

export interface VisiMisiOfficial {
  visi: {
    teks: string;
    artinya: string;
  };
  misi: {
    nomor: number;
    poin: string;
    artinya: string;
  }[];
}

export interface ProkerSiklusItem {
  id: string;
  judul: string;
  frekuensi: 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan';
  icon: string;
  artinya: string;
  pelaksana: string;
  slug: string;
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
  tagline?: string;
  ketua?: string;
  anggota?: string[];
}

export interface AspirastiForm {
  nama: string;
  kelas: string;
  kategori: string;
  judul: string;
  isi: string;
  jenis?: string;
  isAnonim?: boolean;
}

export interface AspirasiRecord {
  id: string;
  kodeLacak: string;
  jenis: 'Saran' | 'Keluhan' | 'Ide' | 'Kritik' | 'Pertanyaan' | 'Pujian';
  kategori: string;
  judul: string;
  isi: string;
  isAnonim: boolean;
  namaPengirim?: string;
  kelasPengirim?: string;
  tanggal: string;
  status: 'Diterima' | 'Ditinjau' | 'Didiskusikan' | 'Tindak Lanjut' | 'Selesai' | 'Dialihkan';
  tanggapanResmi?: string;
  penindaklanjut?: string;
  riwayatStatus?: {
    status: string;
    waktu: string;
    keterangan: string;
  }[];
}

export interface PengurusInti {
  ketuaUmum: string;
  sekretarisUmum: string;
  pembina: string;
  kepalaMadrasah: string;
}
