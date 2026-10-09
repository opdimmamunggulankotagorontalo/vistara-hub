import { useState, useEffect } from 'react';
import {
  Send, Search, CheckCircle2,
  Shield, ArrowRight, Copy, Check, MessageSquarePlus,
  Info
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, EmptyState } from '../../components/ui';
import { initialAspirasiData } from '../../data';
import type { AspirasiRecord } from '../../types';

const STORAGE_KEY = 'vistara_aspirasi_records_v1';

const KATEGORI_OPTIONS = [
  'Fasilitas Madrasah',
  'Kegiatan & Program Siswa',
  'Kebersihan & Lingkungan',
  'Akademik & Pembelajaran',
  'Layanan Organisasi & Madrasah',
];

const JENIS_OPTIONS: { id: AspirasiRecord['jenis']; label: string; icon: string }[] = [
  { id: 'Saran', label: 'Saran', icon: '💡' },
  { id: 'Ide', label: 'Ide Baru', icon: '✨' },
  { id: 'Keluhan', label: 'Keluhan', icon: '⚠️' },
  { id: 'Kritik', label: 'Kritik', icon: '💬' },
  { id: 'Pertanyaan', label: 'Pertanyaan', icon: '❓' },
  { id: 'Pujian', label: 'Apresiasi', icon: '❤️' },
];

const STATUS_STEPS = [
  { key: 'Diterima', label: 'Diterima', desc: 'Aspirasi masuk ke sistem Komisi 4' },
  { key: 'Ditinjau', label: 'Ditinjau', desc: 'Diverifikasi kelayakan & urgensi' },
  { key: 'Didiskusikan', label: 'Didiskusikan', desc: 'Dibahas dalam musyawarah pengurus' },
  { key: 'Tindak Lanjut', label: 'Tindak Lanjut', desc: 'Disampaikan ke pihak madrasah' },
  { key: 'Selesai', label: 'Selesai', desc: 'Solusi diterapkan / ditanggapi resmi' },
];

function getStatusBadgeStyle(status: AspirasiRecord['status']) {
  switch (status) {
    case 'Selesai':
      return { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' };
    case 'Tindak Lanjut':
      return { bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' };
    case 'Didiskusikan':
      return { bg: '#EDE6F8', color: '#4A2C8A', border: '#B99AE1' };
    case 'Ditinjau':
      return { bg: '#FFF8E1', color: '#B78103', border: '#FFE082' };
    default:
      return { bg: '#F5F0FC', color: '#6B3FA0', border: '#D4BFEF' };
  }
}

export default function AspirasiPage() {
  const [activeTab, setActiveTab] = useState<'kirim' | 'lacak' | 'konsep'>('kirim');
  const [aspirasiList, setAspirasiList] = useState<AspirasiRecord[]>([]);

  // Form State
  const [jenis, setJenis] = useState<AspirasiRecord['jenis']>('Saran');
  const [kategori, setKategori] = useState<string>('Fasilitas Madrasah');
  const [judul, setJudul] = useState<string>('');
  const [isi, setIsi] = useState<string>('');
  const [isAnonim, setIsAnonim] = useState<boolean>(true);
  const [nama, setNama] = useState<string>('');
  const [kelas, setKelas] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Submit Result State
  const [submittedRecord, setSubmittedRecord] = useState<AspirasiRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Tracking Lookup State
  const [trackQuery, setTrackQuery] = useState<string>('');
  const [selectedTrackRecord, setSelectedTrackRecord] = useState<AspirasiRecord | null>(null);

  // Load from LocalStorage or default data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAspirasiList(parsed);
          setSelectedTrackRecord(parsed[0]);
          return;
        }
      }
    } catch {
      // fallback
    }
    setAspirasiList(initialAspirasiData);
    setSelectedTrackRecord(initialAspirasiData[0]);
  }, []);

  // Save to LocalStorage helper
  const saveRecords = (records: AspirasiRecord[]) => {
    setAspirasiList(records);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  };

  // Form Submit Handler
  const handleKirimAspirasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !isi.trim() || !kategori) {
      setFormError('Harap lengkapi judul, kategori, dan isi aspirasi.');
      return;
    }
    setFormError('');

    // Generate random realistic tracking code
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCode = `ASP-2026-${randomNum}`;
    const todayStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

    const newRecord: AspirasiRecord = {
      id: `asp-${Date.now()}`,
      kodeLacak: newCode,
      jenis,
      kategori,
      judul: judul.trim(),
      isi: isi.trim(),
      isAnonim,
      namaPengirim: isAnonim ? undefined : (nama.trim() || 'Siswa MAM'),
      kelasPengirim: isAnonim ? undefined : (kelas.trim() || '-'),
      tanggal: todayStr,
      status: 'Diterima',
      tanggapanResmi: 'Aspirasi telah masuk ke sistem dan akan diverifikasi oleh Komisi 4 Aspirasi Siswa.',
      penindaklanjut: 'Komisi 4 OPDIM',
      riwayatStatus: [
        { status: 'Diterima', waktu: todayStr, keterangan: 'Aspirasi berhasil dikirim melalui portal digital VISTARA Hub.' },
      ],
    };

    const updated = [newRecord, ...aspirasiList];
    saveRecords(updated);
    setSubmittedRecord(newRecord);
    setSelectedTrackRecord(newRecord);
    setTrackQuery(newCode);

    // Reset Form fields
    setJudul('');
    setIsi('');
    setNama('');
    setKelas('');
  };

  // Copy Tracking Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Lookup Tracking by Query
  const handleSearchTrack = (codeToFind?: string) => {
    const q = (codeToFind !== undefined ? codeToFind : trackQuery).trim().toUpperCase();
    if (!q) return;
    const found = aspirasiList.find(
      (a) => a.kodeLacak.toUpperCase() === q || a.kodeLacak.toUpperCase().includes(q)
    );
    if (found) {
      setSelectedTrackRecord(found);
    } else {
      setSelectedTrackRecord(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Kotak Aspirasi Siswa"
        subtitle="Suarakan ide, saran, keluhan, dan kritikmu secara mudah, aman, dan transparan. Dikelola resmi oleh Komisi 4 OPDIM VISTARA."
        badge="Komisi 4 — Aspirasi Siswa"
        breadcrumbs={[{ label: 'Aspirasi' }]}
      />

      <section className="section" style={{ background: 'var(--warm-white)', minHeight: '75vh', paddingBottom: '5rem' }}>
        <div className="container">

          {/* ── SIMPLE TOP TABS SWITCHER ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--lavender-mist)',
                padding: '0.35rem',
                borderRadius: '14px',
                border: '1px solid var(--pale-lilac)',
                gap: '0.3rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {[
                { id: 'kirim' as const, label: 'Kirim Aspirasi', icon: <MessageSquarePlus size={16} /> },
                { id: 'lacak' as const, label: 'Lacak Status Aspirasi', icon: <Search size={16} /> },
                { id: 'konsep' as const, label: 'Alur & Teknis SOP', icon: <Info size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'kirim') setSubmittedRecord(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-header)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: activeTab === tab.id ? 'var(--deep-violet)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--deep-violet)',
                    boxShadow: activeTab === tab.id ? '0 2px 10px rgba(45, 27, 105, 0.25)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: FORM KIRIM ASPIRASI (SIMPEL & ELEGAN)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'kirim' && (
            <div style={{ maxWidth: '680px', margin: '0 auto', animation: 'fadeIn 0.2s ease' }}>
              {submittedRecord ? (
                /* SUCCESS TICKET SCREEN */
                <div
                  className="card"
                  style={{
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    border: '1.5px solid var(--soft-lilac)',
                    background: 'white',
                    boxShadow: '0 16px 40px rgba(107, 63, 160, 0.1)',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(46, 125, 50, 0.12)',
                      color: '#2E7D32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>

                  <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>
                    Aspirasi Berhasil Terkirim
                  </span>

                  <h2 style={{ fontSize: '1.4rem', color: 'var(--deep-violet)', marginBottom: '0.5rem' }}>
                    Terima Kasih Atas Suaramu!
                  </h2>

                  <p style={{ fontSize: '0.88rem', color: 'var(--mid-grey)', maxWidth: '480px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                    Aspirasi kamu telah diterima secara resmi dan tercatat di antrean peninjauan Komisi 4 Aspirasi Siswa.
                  </p>

                  {/* KODE LACAK BOX */}
                  <div
                    style={{
                      background: 'var(--ghost-purple)',
                      border: '1.5px dashed var(--vistara-purple)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      maxWidth: '420px',
                      margin: '0 auto 1.75rem',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--mid-grey)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                      Kode Lacak Aspirasi Kamu
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '1.6rem',
                        color: 'var(--deep-violet)',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {submittedRecord.kodeLacak}
                    </div>

                    <button
                      onClick={() => handleCopyCode(submittedRecord.kodeLacak)}
                      className="btn btn-outline btn-sm"
                      style={{ margin: '0 auto', fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                    >
                      {copiedCode ? (
                        <>
                          <Check size={14} style={{ color: '#2E7D32' }} /> Kode Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Salin Kode Lacak
                        </>
                      )}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        setActiveTab('lacak');
                        setTrackQuery(submittedRecord.kodeLacak);
                        setSelectedTrackRecord(submittedRecord);
                      }}
                      className="btn btn-primary"
                    >
                      Lihat Progres & Status Lacak <ArrowRight size={15} />
                    </button>
                    <button
                      onClick={() => setSubmittedRecord(null)}
                      className="btn btn-ghost"
                    >
                      Tulis Aspirasi Lainnya
                    </button>
                  </div>
                </div>
              ) : (
                /* CLEAN FORM */
                <div
                  className="card"
                  style={{
                    padding: '2rem',
                    border: '1px solid var(--pale-lilac)',
                    background: 'white',
                    boxShadow: '0 8px 30px rgba(45, 27, 105, 0.04)',
                  }}
                >
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.35rem', color: 'var(--deep-violet)', marginBottom: '0.25rem' }}>
                      Sampaikan Pendapatmu
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', margin: 0 }}>
                      Suara dan ide kamu akan diproses dan disampaikan langsung ke pihak madrasah.
                    </p>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#FFEBEE',
                        border: '1px solid #FFCDD2',
                        borderRadius: '10px',
                        color: '#C62828',
                        fontSize: '0.85rem',
                        marginBottom: '1.25rem',
                      }}
                    >
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleKirimAspirasi} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* 1. Jenis Aspirasi (Pilihan Chips) */}
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-header)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Jenis Aspirasi
                      </label>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {JENIS_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setJenis(opt.id)}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '9px',
                              border: `1.5px solid ${jenis === opt.id ? 'var(--vistara-purple)' : 'var(--pale-lilac)'}`,
                              background: jenis === opt.id ? 'var(--ghost-purple)' : 'white',
                              color: jenis === opt.id ? 'var(--deep-violet)' : 'var(--charcoal)',
                              fontFamily: 'var(--font-header)',
                              fontSize: '0.8rem',
                              fontWeight: jenis === opt.id ? 700 : 500,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Kategori Aspirasi */}
                    <div>
                      <label htmlFor="asp-kategori" style={{ display: 'block', fontFamily: 'var(--font-header)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        Kategori Bidang <span style={{ color: 'var(--vistara-purple)' }}>*</span>
                      </label>
                      <select
                        id="asp-kategori"
                        value={kategori}
                        onChange={(e) => setKategori(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid var(--pale-lilac)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.9rem',
                          color: 'var(--charcoal)',
                          background: 'white',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {KATEGORI_OPTIONS.map((kat) => (
                          <option key={kat} value={kat}>
                            {kat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Judul Singkat */}
                    <div>
                      <label htmlFor="asp-judul" style={{ display: 'block', fontFamily: 'var(--font-header)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        Judul Aspirasi <span style={{ color: 'var(--vistara-purple)' }}>*</span>
                      </label>
                      <input
                        id="asp-judul"
                        type="text"
                        required
                        placeholder="Contoh: Pengadaan wadah sampah terpilah di depan gazebo"
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid var(--pale-lilac)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.9rem',
                          color: 'var(--ink)',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* 4. Isi Pesan */}
                    <div>
                      <label htmlFor="asp-isi" style={{ display: 'block', fontFamily: 'var(--font-header)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        Pesan & Detail Aspirasi <span style={{ color: 'var(--vistara-purple)' }}>*</span>
                      </label>
                      <textarea
                        id="asp-isi"
                        required
                        rows={4}
                        placeholder="Tuliskan ide, kritik, saran, atau keluhan kamu secara santun dan jelas..."
                        value={isi}
                        onChange={(e) => setIsi(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid var(--pale-lilac)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.9rem',
                          color: 'var(--ink)',
                          outline: 'none',
                          lineHeight: 1.6,
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    {/* 5. Privasi & Identitas */}
                    <div style={{ background: 'var(--ghost-purple)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--pale-lilac)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isAnonim ? 0 : '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Shield size={16} style={{ color: 'var(--vistara-purple)' }} />
                          <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--deep-violet)' }}>
                            Kirim Sebagai Anonim
                          </span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.4rem', fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={isAnonim}
                            onChange={(e) => setIsAnonim(e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--vistara-purple)' }}
                          />
                          <span style={{ color: 'var(--charcoal)', fontWeight: 600 }}>{isAnonim ? 'Ya (Rahasia)' : 'Tidak'}</span>
                        </label>
                      </div>

                      {!isAnonim && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--pale-lilac)' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>
                              Nama Lengkap (Opsional)
                            </label>
                            <input
                              type="text"
                              placeholder="Nama kamu"
                              value={nama}
                              onChange={(e) => setNama(e.target.value)}
                              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--pale-lilac)', fontSize: '0.82rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>
                              Kelas (Opsional)
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: XI IPA 2"
                              value={kelas}
                              onChange={(e) => setKelas(e.target.value)}
                              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--pale-lilac)', fontSize: '0.82rem' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tombol Kirim */}
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                    >
                      <Send size={16} /> Kirim Aspirasi Sekarang
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: LACAK STATUS ASPIRASI (REAL-TIME TRACKING)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'lacak' && (
            <div style={{ animation: 'fadeIn 0.2s ease', maxWidth: '840px', margin: '0 auto' }}>

              {/* SEARCH BOX KODE LACAK */}
              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  marginBottom: '1.75rem',
                  background: 'white',
                  border: '1px solid var(--pale-lilac)',
                  boxShadow: '0 4px 20px rgba(45, 27, 105, 0.04)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  Lacak Progres Aspirasi dengan Kode Unik
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }} />
                    <input
                      type="text"
                      placeholder="Masukkan kode lacak (contoh: ASP-2026-1001)..."
                      value={trackQuery}
                      onChange={(e) => setTrackQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchTrack()}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        borderRadius: '10px',
                        border: '1.5px solid var(--pale-lilac)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        textTransform: 'uppercase',
                      }}
                    />
                  </div>

                  <button
                    onClick={() => handleSearchTrack()}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.25rem' }}
                  >
                    <Search size={16} /> Cari Status
                  </button>
                </div>

                {/* QUICK CHIP EXAMPLES */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
                    Coba kode demo:
                  </span>
                  {aspirasiList.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTrackQuery(item.kodeLacak);
                        handleSearchTrack(item.kodeLacak);
                      }}
                      style={{
                        background: 'var(--ghost-purple)',
                        border: '1px solid var(--pale-lilac)',
                        borderRadius: '6px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--vistara-purple)',
                        cursor: 'pointer',
                      }}
                    >
                      {item.kodeLacak}
                    </button>
                  ))}
                </div>
              </div>

              {/* HASIL LACAK DETAIL */}
              {selectedTrackRecord ? (
                <div
                  className="card"
                  style={{
                    padding: '2rem',
                    marginBottom: '2.5rem',
                    border: '1.5px solid var(--pale-lilac)',
                    background: 'white',
                    boxShadow: '0 8px 30px rgba(45, 27, 105, 0.05)',
                  }}
                >
                  {/* Top info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            color: 'var(--vistara-purple)',
                            background: 'var(--lavender-mist)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                          }}
                        >
                          {selectedTrackRecord.kodeLacak}
                        </span>
                        <Badge variant="ghost">{selectedTrackRecord.kategori}</Badge>
                        <span className="badge" style={{ background: 'var(--ghost-purple)', color: 'var(--deep-violet)' }}>
                          {selectedTrackRecord.jenis}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--deep-violet)', margin: '0.35rem 0' }}>
                        {selectedTrackRecord.judul}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--mid-grey)' }}>
                        Tanggal Pengiriman: <strong>{selectedTrackRecord.tanggal}</strong> • Pengirim:{' '}
                        <strong>{selectedTrackRecord.isAnonim ? 'Anonim (Dirahasiakan)' : `${selectedTrackRecord.namaPengirim} (${selectedTrackRecord.kelasPengirim})`}</strong>
                      </div>
                    </div>

                    <div>
                      {(() => {
                        const b = getStatusBadgeStyle(selectedTrackRecord.status);
                        return (
                          <span
                            className="badge"
                            style={{
                              background: b.bg,
                              color: b.color,
                              border: `1px solid ${b.border}`,
                              fontSize: '0.8rem',
                              padding: '0.4rem 0.9rem',
                              fontWeight: 700,
                            }}
                          >
                            Status: {selectedTrackRecord.status}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Isi aspirasi quote */}
                  <div style={{ background: 'var(--warm-white)', padding: '1rem', borderRadius: '10px', borderLeft: '3px solid var(--soft-lilac)', marginBottom: '1.75rem', fontSize: '0.88rem', color: 'var(--charcoal)', lineHeight: 1.6 }}>
                    "{selectedTrackRecord.isi}"
                  </div>

                  {/* 5-STAGE PROGRESS STEPPER */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mid-grey)', marginBottom: '1rem' }}>
                      Alur Status Penanganan Resmi
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                      {STATUS_STEPS.map((step, idx) => {
                        const stepIndexMap: Record<string, number> = {
                          'Diterima': 0,
                          'Ditinjau': 1,
                          'Didiskusikan': 2,
                          'Tindak Lanjut': 3,
                          'Selesai': 4,
                        };
                        const currentIdx = stepIndexMap[selectedTrackRecord.status] ?? 0;
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div
                            key={step.key}
                            style={{
                              background: isCurrent ? 'var(--ghost-purple)' : isDone ? 'white' : 'var(--warm-white)',
                              border: `1.5px solid ${isCurrent ? 'var(--vistara-purple)' : isDone ? 'var(--pale-lilac)' : '#E0E0E0'}`,
                              borderRadius: '10px',
                              padding: '0.75rem',
                              position: 'relative',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                              <span
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: isDone ? 'var(--vistara-purple)' : '#D0D0D0',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                }}
                              >
                                {isDone ? '✓' : idx + 1}
                              </span>
                              <strong style={{ fontSize: '0.78rem', color: isDone ? 'var(--deep-violet)' : 'var(--mid-grey)' }}>
                                {step.label}
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--mid-grey)', lineHeight: 1.3 }}>
                              {step.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TANGGAPAN RESMI (JIKA ADA) */}
                  {selectedTrackRecord.tanggapanResmi && (
                    <div style={{ background: 'rgba(46, 125, 50, 0.05)', border: '1px solid rgba(46, 125, 50, 0.25)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <CheckCircle2 size={18} style={{ color: '#2E7D32' }} />
                        <h4 style={{ margin: 0, color: '#2E7D32', fontSize: '0.92rem' }}>
                          Tanggapan & Tindak Lanjut Resmi
                        </h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6 }}>
                        {selectedTrackRecord.tanggapanResmi}
                      </p>
                      {selectedTrackRecord.penindaklanjut && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--mid-grey)', marginTop: '0.5rem' }}>
                          Oleh: <strong>{selectedTrackRecord.penindaklanjut}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RIWAYAT LOG STATUS */}
                  {selectedTrackRecord.riwayatStatus && selectedTrackRecord.riwayatStatus.length > 0 && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mid-grey)', marginBottom: '0.75rem' }}>
                        Catatan Riwayat Tindak Lanjut
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedTrackRecord.riwayatStatus.map((log, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.8rem', background: 'var(--ghost-purple)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                            <span style={{ color: 'var(--vistara-purple)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              [{log.waktu}]
                            </span>
                            <span style={{ color: 'var(--deep-violet)', fontWeight: 600 }}>
                              {log.status}:
                            </span>
                            <span style={{ color: 'var(--charcoal)', flex: 1 }}>
                              {log.keterangan}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="Aspirasi tidak ditemukan"
                  description={`Tidak ditemukan data aspirasi dengan kode "${trackQuery}". Pastikan kode yang dimasukkan benar.`}
                />
              )}

              {/* DAFTAR ASPIRASI PUBLIK RINGKAS */}
              <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--deep-violet)', margin: 0 }}>
                      Daftar Aspirasi Publik Terbaru
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', margin: '0.2rem 0 0' }}>
                      Transparansi suara siswa yang telah diverifikasi dan sedang ditangani OPDIM.
                    </p>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)' }}>
                    Total <strong>{aspirasiList.length}</strong> aspirasi tercatat
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {aspirasiList.map((item) => {
                    const b = getStatusBadgeStyle(item.status);
                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          cursor: 'pointer',
                          border: selectedTrackRecord?.id === item.id ? '1.5px solid var(--vistara-purple)' : '1px solid var(--pale-lilac)',
                        }}
                        onClick={() => {
                          setSelectedTrackRecord(item);
                          setTrackQuery(item.kodeLacak);
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--vistara-purple)', fontWeight: 700 }}>
                              {item.kodeLacak}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--mid-grey)' }}>•</span>
                            <Badge variant="ghost" size="sm">{item.kategori}</Badge>
                          </div>
                          <h4 style={{ fontSize: '0.92rem', color: 'var(--deep-violet)', margin: 0 }}>
                            {item.judul}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span
                            className="badge"
                            style={{
                              background: b.bg,
                              color: b.color,
                              border: `1px solid ${b.border}`,
                              fontSize: '0.72rem',
                            }}
                          >
                            {item.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--vistara-purple)', fontWeight: 700 }}>
                            Pilih & Lacak →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: ALUR & TEKNIS SOP RESMI (KOMISI 4)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'konsep' && (
            <div style={{ animation: 'fadeIn 0.2s ease', maxWidth: '780px', margin: '0 auto' }}>
              <div
                className="card"
                style={{
                  padding: '2rem',
                  border: '1px solid var(--pale-lilac)',
                  background: 'white',
                  marginBottom: '1.5rem',
                }}
              >
                <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>
                  Bab 5 Dokumen Rekap Proker
                </span>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--deep-violet)', marginBottom: '0.75rem' }}>
                  Konsep & Mekanisme Kerja Kotak Aspirasi Siswa
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--charcoal)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  Program Kotak Aspirasi merupakan salah satu prioritas utama OPDIM VISTARA untuk memastikan setiap siswa memiliki ruang bersuara yang aman, mudah, dan terlacak.
                </p>

                {/* 5 Tahap Pelaksanaan */}
                <h4 style={{ color: 'var(--deep-violet)', marginBottom: '0.75rem', fontSize: '1rem' }}>
                  5 Langkah Alur Penanganan Resmi:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
                  {[
                    { no: '1', title: 'Penyampaian Aspirasi', desc: 'Siswa menyampaikan saran/keluhan melalui website VISTARA Hub atau kotak fisik di depan kelas, perpustakaan, dan ruang OSIS.' },
                    { no: '2', title: 'Rekapitulasi & Kurasi Mingguan', desc: 'Pengurus Komisi 4 mengumpulkan dan memilih aspirasi yang bersifat penting, solutif, dan membangun.' },
                    { no: '3', title: 'Musyawarah Pengurus', desc: 'Aspirasi dirumuskan dalam rapat koordinasi mingguan pengurus OPDIM.' },
                    { no: '4', title: 'Penyampaian Formal ke Sekolah', desc: 'Hasil seleksi aspirasi disampaikan secara santun kepada Kepala Madrasah dan dewan guru.' },
                    { no: '5', title: 'Pengumuman Tindak Lanjut', desc: 'Hasil tindak lanjut atau tanggapan resmi diumumkan kepada seluruh siswa melalui portal digital dan mading.' },
                  ].map((step) => (
                    <div key={step.no} style={{ display: 'flex', gap: '0.75rem', background: 'var(--ghost-purple)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--deep-violet)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                        {step.no}
                      </span>
                      <div>
                        <strong style={{ color: 'var(--deep-violet)', fontSize: '0.88rem', display: 'block' }}>{step.title}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Personil Penanggung Jawab */}
                <div style={{ background: 'var(--warm-white)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--pale-lilac)' }}>
                  <h4 style={{ color: 'var(--deep-violet)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                    Penanggung Jawab Resmi (Komisi 4):
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.7 }}>
                    <li><strong>Ketua Komisi 4:</strong> Nayla Syaqila Husain</li>
                    <li><strong>Anggota:</strong> Ain Tahir, Aisyah Karimah</li>
                    <li><strong>Pengawas & Pembina:</strong> Selvianingsih Salilama, S.Pd.</li>
                    <li><strong>Eskalasi Kasus Sensitif:</strong> Laporan perundungan atau privasi dialihkan langsung ke Pembina & Guru BK tanpa publikasi terbuka.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
