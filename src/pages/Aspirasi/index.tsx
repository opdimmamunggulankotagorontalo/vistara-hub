import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send, Search, CheckCircle2,
  Shield, ArrowRight, Copy, Check, MessageSquarePlus,
  Info, BarChart3, ChevronRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, EmptyState, LoadingState } from '../../components/ui';
import type { AspirasiRecord, PollingTopic } from '../../types';
import { MagneticWrapper } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';
import {
  fetchAspirasi,
  fetchPolls,
  getVotedPollMap,
  submitAspirasi,
  subscribeToTableChanges,
  trackAspirasi,
  voteOnPoll,
} from '../../services/dataClient';

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

type AspirasiTab = 'kirim' | 'lacak' | 'polling' | 'konsep';

function normalizeAspirasiTab(raw: string | null): AspirasiTab {
  if (raw === 'lacak' || raw === 'polling' || raw === 'konsep') return raw;
  return 'kirim';
}

export default function AspirasiPage() {
  const { reducedMotion } = useMotionSystem();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = normalizeAspirasiTab(searchParams.get('tab'));
  const [aspirasiList, setAspirasiList] = useState<AspirasiRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [polls, setPolls] = useState<PollingTopic[]>([]);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>(() => getVotedPollMap());
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  // Form State
  const [jenis, setJenis] = useState<AspirasiRecord['jenis']>('Saran');
  const [kategori, setKategori] = useState<string>('Fasilitas Madrasah');
  const [judul, setJudul] = useState<string>('');
  const [isi, setIsi] = useState<string>('');
  const [isAnonim, setIsAnonim] = useState<boolean>(true);
  const [nama, setNama] = useState<string>('');
  const [kelas, setKelas] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Submit Result State
  const [submittedRecord, setSubmittedRecord] = useState<AspirasiRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Tracking Lookup State
  const [trackQuery, setTrackQuery] = useState<string>('');
  const [trackNotFound, setTrackNotFound] = useState<string>('');
  const [trackFilter, setTrackFilter] = useState<'all' | 'diproses' | 'selesai'>('all');
  const [isSearchingTrack, setIsSearchingTrack] = useState<boolean>(false);

  const selectTab = (tab: AspirasiTab) => {
    if (tab === 'kirim') setSubmittedRecord(null);
    setTrackNotFound('');
    setSearchParams(tab === 'kirim' ? {} : { tab }, { replace: true });
  };

  const refreshAspirasi = useCallback(async () => {
    const records = await fetchAspirasi();
    setAspirasiList(records);
  }, []);

  const refreshPolls = useCallback(async () => {
    const latest = await fetchPolls();
    setPolls(latest);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchAspirasi(), fetchPolls()])
      .then(([records, latestPolls]) => {
        if (!active) return;
        setAspirasiList(records);
        setPolls(latestPolls);
      })
      .finally(() => {
        if (active) setIsLoadingList(false);
      });

    const unsubAspirasi = subscribeToTableChanges('aspirasi', () => {
      if (active) void refreshAspirasi();
    });
    const unsubPolling = subscribeToTableChanges(['polling_topics', 'polling_options'], () => {
      if (active) void refreshPolls();
    });

    return () => {
      active = false;
      unsubAspirasi();
      unsubPolling();
    };
  }, [refreshAspirasi, refreshPolls]);

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (votedPolls[pollId] || votingPollId === pollId) return;
    setVotingPollId(pollId);
    setVotedPolls((prev) => ({ ...prev, [pollId]: optionId }));
    setPolls((prev) =>
      prev.map((poll) =>
        poll.id !== pollId
          ? poll
          : {
              ...poll,
              options: poll.options.map((o) =>
                o.id === optionId ? { ...o, votes: o.votes + 1 } : o
              ),
            }
      )
    );
    try {
      const updated = await voteOnPoll(pollId, optionId);
      setPolls(updated);
    } finally {
      setVotingPollId(null);
    }
  };

  const handleKirimAspirasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !isi.trim() || !kategori) {
      setFormError('Harap lengkapi judul, kategori, dan isi aspirasi.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      const created = await submitAspirasi({
        jenis,
        kategori,
        judul: judul.trim(),
        isi: isi.trim(),
        isAnonim,
        namaPengirim: isAnonim ? undefined : (nama.trim() || 'Siswa MAM'),
        kelasPengirim: isAnonim ? undefined : (kelas.trim() || '-'),
      });

      setAspirasiList((prev) => [
        created,
        ...prev.filter((item) => item.id !== created.id),
      ]);
      setSubmittedRecord(created);
      setTrackQuery(created.kodeLacak);

      setJudul('');
      setIsi('');
      setNama('');
      setKelas('');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal mengirim aspirasi. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSearchTrack = async (codeToFind?: string) => {
    const q = (codeToFind !== undefined ? codeToFind : trackQuery).trim().toUpperCase();
    if (!q) {
      setTrackNotFound('Masukkan kode lacak terlebih dahulu (contoh: ASP-2026-1001).');
      return;
    }
    setTrackNotFound('');
    setIsSearchingTrack(true);
    try {
      const found = await trackAspirasi(q);
      if (found) {
        navigate(`/beranda/aspirasi/lacak/${encodeURIComponent(found.kodeLacak)}`);
      } else {
        setTrackNotFound(`Kode "${q}" tidak ditemukan. Periksa kembali kode lacak Anda atau pilih dari daftar di bawah.`);
      }
    } finally {
      setIsSearchingTrack(false);
    }
  };

  const totalCount = aspirasiList.length;
  const selesaiCount = aspirasiList.filter((item) => item.status === 'Selesai').length;
  const diprosesCount = totalCount - selesaiCount;
  const filteredTrackList = aspirasiList.filter((item) => {
    if (trackFilter === 'selesai') return item.status === 'Selesai';
    if (trackFilter === 'diproses') return item.status !== 'Selesai';
    return true;
  });

  return (
    <div className="aspirasi-page">
      <PageHeader
        title="Kotak Aspirasi Siswa"
        subtitle="Suarakan ide, saran, keluhan, dan kritikmu secara mudah, aman, dan transparan. Dikelola resmi oleh Komisi 4 OPDIM VISTARA."
        badge="Komisi 4 — Aspirasi Siswa"
        breadcrumbs={[{ label: 'Aspirasi' }]}
      />

      <section
        className="section aspirasi-section"
        style={{ background: 'var(--warm-white)', minHeight: '75vh', paddingBottom: '5rem' }}
      >
        <div className="container">
          {/* ── COMPACT TRANSPARENCY SUMMARY STRIP ── */}
          <div
            className="aspirasi-summary"
            style={{
              maxWidth: '680px',
              margin: '0 auto 1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: '14px',
              background: 'white',
              border: '1px solid var(--pale-lilac)',
              textAlign: 'center',
            }}
          >
            <div>
              <div className="tabular-nums aspirasi-summary-val" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--deep-violet)', lineHeight: 1.1 }}>
                {totalCount}
              </div>
              <div className="aspirasi-summary-label" style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'var(--mid-grey)', marginTop: '0.2rem' }}>
                Total Aspirasi
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--lavender-mist)', borderRight: '1px solid var(--lavender-mist)' }}>
              <div className="tabular-nums aspirasi-summary-val" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--vistara-purple)', lineHeight: 1.1 }}>
                {diprosesCount}
              </div>
              <div className="aspirasi-summary-label" style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'var(--mid-grey)', marginTop: '0.2rem' }}>
                Diproses
              </div>
            </div>
            <div>
              <div className="tabular-nums aspirasi-summary-val" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem', color: '#2E7D32', lineHeight: 1.1 }}>
                {selesaiCount}
              </div>
              <div className="aspirasi-summary-label" style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'var(--mid-grey)', marginTop: '0.2rem' }}>
                Tuntas
              </div>
            </div>
          </div>

          {/* ── TOP TABS SWITCHER ── */}
          <div className="aspirasi-tabs-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div
              className="aspirasi-tabs"
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
                { id: 'kirim' as const, label: 'Kirim Aspirasi', icon: <MessageSquarePlus size={15} /> },
                { id: 'lacak' as const, label: 'Lacak Status', icon: <Search size={15} /> },
                { id: 'polling' as const, label: 'Polling Siswa', icon: <BarChart3 size={15} /> },
                { id: 'konsep' as const, label: 'Alur & SOP', icon: <Info size={15} /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="aspirasi-tab-btn"
                    onClick={() => selectTab(tab.id)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1.15rem',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-header)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: 'transparent',
                      color: isActive ? 'white' : 'var(--deep-violet)',
                      transition: 'color var(--transition-fast)',
                    }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="aspirasi-tab-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '10px',
                          background: 'var(--deep-violet)',
                          boxShadow: '0 2px 10px rgba(45, 27, 105, 0.25)',
                          zIndex: 0,
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {tab.icon}
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ── TAB 1: FORM KIRIM ASPIRASI ── */}
            {activeTab === 'kirim' && (
              <motion.div
                key="tab-kirim"
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                style={{ maxWidth: '680px', margin: '0 auto' }}
              >
                <AnimatePresence mode="wait">
                  {submittedRecord ? (
                    <motion.div
                      key="submitted-ticket"
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.14 }}
                      className="card aspirasi-card"
                      style={{
                        padding: '2rem',
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
                          type="button"
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
                          type="button"
                          onClick={() =>
                            navigate(`/beranda/aspirasi/lacak/${encodeURIComponent(submittedRecord.kodeLacak)}`)
                          }
                          className="btn btn-primary"
                        >
                          Buka Halaman Lacak Progres <ArrowRight size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmittedRecord(null)}
                          className="btn btn-ghost"
                          style={{ color: 'var(--deep-violet)', borderColor: 'var(--pale-lilac)' }}
                        >
                          Tulis Aspirasi Lainnya
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="aspirasi-form"
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="card aspirasi-card"
                      style={{
                        padding: '2rem',
                        border: '1px solid var(--pale-lilac)',
                        background: 'white',
                        boxShadow: '0 8px 30px rgba(45, 27, 105, 0.04)',
                      }}
                    >
                      <div className="aspirasi-card-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
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

                      <form onSubmit={handleKirimAspirasi} className="aspirasi-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                          <label style={{ display: 'block', fontFamily: 'var(--font-header)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            Jenis Aspirasi
                          </label>
                          <div className="aspirasi-jenis-grid" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {JENIS_OPTIONS.map((opt) => (
                              <motion.button
                                key={opt.id}
                                type="button"
                                className="aspirasi-jenis-btn"
                                whileTap={reducedMotion ? undefined : { scale: 0.94 }}
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
                              </motion.button>
                            ))}
                          </div>
                        </div>

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

                        <div className="aspirasi-anon-box" style={{ background: 'var(--ghost-purple)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--pale-lilac)' }}>
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

                          <AnimatePresence>
                            {!isAnonim && (
                              <motion.div
                                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                                className="aspirasi-anon-fields"
                                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--pale-lilac)', overflow: 'hidden' }}
                              >
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>
                                    Nama Lengkap (Opsional)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Nama kamu"
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--pale-lilac)', fontSize: '0.82rem', background: 'white' }}
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
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--pale-lilac)', fontSize: '0.82rem', background: 'white' }}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <MagneticWrapper style={{ width: '100%' }}>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
                          >
                            <Send size={16} /> {isSubmitting ? 'Menyimpan Aspirasi...' : 'Kirim Aspirasi Sekarang'}
                          </button>
                        </MagneticWrapper>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── TAB 2: LACAK STATUS ASPIRASI (RINGKAS & NAVIGASI KE HALAMAN DETAIL) ── */}
            {activeTab === 'lacak' && (
              <motion.div
                key="tab-lacak"
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                style={{ maxWidth: '760px', margin: '0 auto' }}
              >
                <div
                  className="card aspirasi-track-search"
                  style={{
                    padding: '1.25rem',
                    marginBottom: '1.25rem',
                    background: 'white',
                    border: '1px solid var(--pale-lilac)',
                    boxShadow: '0 4px 18px rgba(45, 27, 105, 0.04)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--deep-violet)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Lacak Progres Aspirasi dengan Kode Unik
                  </div>

                  <div className="aspirasi-track-search-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div className="aspirasi-track-input-wrap" style={{ position: 'relative', flex: 1, minWidth: '210px' }}>
                      <Search
                        size={17}
                        style={{
                          position: 'absolute',
                          left: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--mid-grey)',
                        }}
                      />
                      <input
                        type="text"
                        aria-label="Masukkan kode lacak aspirasi"
                        placeholder="Masukkan kode lacak (mis. ASP-2026-1001)..."
                        value={trackQuery}
                        onChange={(e) => {
                          setTrackQuery(e.target.value);
                          if (trackNotFound) setTrackNotFound('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void handleSearchTrack();
                          }
                        }}
                        style={{
                          width: '100%',
                          minHeight: '44px',
                          padding: '0.65rem 0.9rem 0.65rem 2.5rem',
                          borderRadius: '10px',
                          border: '1.5px solid var(--pale-lilac)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          textTransform: 'uppercase',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSearchingTrack}
                      onClick={() => void handleSearchTrack()}
                      className="btn btn-primary aspirasi-track-btn"
                      style={{ minHeight: '44px', padding: '0 1.15rem', opacity: isSearchingTrack ? 0.7 : 1 }}
                    >
                      <Search size={15} /> {isSearchingTrack ? 'Membuka...' : 'Buka Lacak'}
                    </button>
                  </div>

                  {trackNotFound && (
                    <div
                      role="alert"
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '9px',
                        background: '#FFF5F5',
                        border: '1px solid #FFCDD2',
                        color: '#C62828',
                        fontSize: '0.8rem',
                        lineHeight: 1.45,
                      }}
                    >
                      {trackNotFound}
                    </div>
                  )}

                  {aspirasiList.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
                        Pintasan kode:
                      </span>
                      {aspirasiList.slice(0, 4).map((item) => (
                        <Link
                          key={item.id}
                          to={`/beranda/aspirasi/lacak/${encodeURIComponent(item.kodeLacak)}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            minHeight: '32px',
                            background: 'var(--ghost-purple)',
                            border: '1px solid var(--pale-lilac)',
                            borderRadius: '7px',
                            padding: '0.2rem 0.55rem',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: 'var(--vistara-purple)',
                            textDecoration: 'none',
                          }}
                        >
                          {item.kodeLacak}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {isLoadingList ? (
                  <LoadingState />
                ) : aspirasiList.length === 0 ? (
                  <EmptyState
                    title="Belum ada aspirasi tercatat"
                    description="Sampaikan aspirasi pertamamu di tab Kirim Aspirasi, lalu lacak tindak lanjutnya di halaman khusus."
                  />
                ) : (
                  <div className="aspirasi-public-list-wrap">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.6rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: '1.08rem', color: 'var(--deep-violet)', margin: 0 }}>
                          Daftar Lacak Aspirasi ({filteredTrackList.length})
                        </h3>
                        <p style={{ fontSize: '0.76rem', color: 'var(--mid-grey)', margin: '0.15rem 0 0' }}>
                          Pilih salah satu aspirasi untuk membuka halaman detail tindak lanjut resmi.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {[
                          { id: 'all' as const, label: 'Semua' },
                          { id: 'diproses' as const, label: 'Diproses' },
                          { id: 'selesai' as const, label: 'Selesai' },
                        ].map((f) => {
                          const active = trackFilter === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setTrackFilter(f.id)}
                              style={{
                                minHeight: '34px',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '8px',
                                border: `1px solid ${active ? 'var(--vistara-purple)' : 'var(--pale-lilac)'}`,
                                background: active ? 'var(--deep-violet)' : '#FFFFFF',
                                color: active ? '#FFFFFF' : 'var(--deep-violet)',
                                fontFamily: 'var(--font-header)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--pale-lilac)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(45, 27, 105, 0.03)',
                      }}
                    >
                      {filteredTrackList.length === 0 ? (
                        <div style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--mid-grey)' }}>
                          Tidak ada aspirasi pada filter ini.
                        </div>
                      ) : (
                        filteredTrackList.map((item, idx) => {
                          const b = getStatusBadgeStyle(item.status);
                          return (
                            <Link
                              key={item.id}
                              to={`/beranda/aspirasi/lacak/${encodeURIComponent(item.kodeLacak)}`}
                              className="aspirasi-compact-row"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                minHeight: '60px',
                                padding: '0.75rem 1rem',
                                textDecoration: 'none',
                                borderTop: idx === 0 ? 'none' : '1px solid #EFE9FA',
                                transition: 'background-color 140ms ease',
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    flexWrap: 'wrap',
                                    fontSize: '0.72rem',
                                    color: 'var(--mid-grey)',
                                    marginBottom: '0.15rem',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: 700,
                                      color: 'var(--vistara-purple)',
                                    }}
                                  >
                                    {item.kodeLacak}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{item.kategori}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{item.tanggal}</span>
                                </div>
                                <div
                                  style={{
                                    fontFamily: 'var(--font-header)',
                                    fontSize: '0.88rem',
                                    fontWeight: 700,
                                    color: 'var(--deep-violet)',
                                    lineHeight: 1.3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {item.judul}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                                <span
                                  style={{
                                    background: b.bg,
                                    color: b.color,
                                    border: `1px solid ${b.border}`,
                                    borderRadius: '7px',
                                    padding: '0.2rem 0.5rem',
                                    fontFamily: 'var(--font-header)',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.status}
                                </span>
                                <ChevronRight size={16} style={{ color: 'var(--vistara-purple)' }} />
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB 3: POLLING SISWA REAL-TIME ── */}
            {activeTab === 'polling' && (
              <motion.div
                key="tab-polling"
                className="aspirasi-poll-list"
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {isLoadingList ? (
                  <LoadingState />
                ) : polls.length === 0 ? (
                  <EmptyState
                    title="Belum ada polling aktif"
                    description="Topik polling siswa yang dibuka oleh Komisi 4 akan tampil secara real-time di sini."
                  />
                ) : (
                  polls.map((poll) => {
                  const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
                  const chosenOptionId = votedPolls[poll.id];
                  const hasVoted = Boolean(chosenOptionId);
                  return (
                    <div
                      key={poll.id}
                      className="card aspirasi-poll-card"
                      style={{
                        padding: '1.75rem',
                        border: '1px solid var(--pale-lilac)',
                        background: 'white',
                      }}
                    >
                      <div className="aspirasi-poll-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                        <Badge variant="ghost">{poll.category}</Badge>
                        <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--mid-grey)' }}>
                          Ditutup: {poll.closesAt}
                        </span>
                      </div>

                      <h3 className="aspirasi-poll-question" style={{ fontSize: '1.15rem', color: 'var(--deep-violet)', marginBottom: '0.4rem' }}>
                        {poll.question}
                      </h3>
                      <p className="aspirasi-poll-desc" style={{ fontSize: '0.84rem', color: 'var(--mid-grey)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
                        {poll.description}
                      </p>

                      <div className="aspirasi-poll-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {poll.options.map((opt) => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          const isSelected = chosenOptionId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              className="aspirasi-poll-opt"
                              disabled={hasVoted || poll.status !== 'active' || votingPollId === poll.id}
                              onClick={() => handleVotePoll(poll.id, opt.id)}
                              aria-pressed={isSelected}
                              style={{
                                position: 'relative',
                                width: '100%',
                                textAlign: 'left',
                                padding: '0.85rem 1rem',
                                borderRadius: '10px',
                                border: isSelected
                                  ? '1.5px solid var(--vistara-purple)'
                                  : '1px solid var(--pale-lilac)',
                                background: 'var(--ghost-purple)',
                                overflow: 'hidden',
                                cursor: hasVoted ? 'default' : 'pointer',
                                transition: 'border-color 150ms ease',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: hasVoted ? `${pct}%` : '0%',
                                  background: isSelected
                                    ? 'rgba(107, 63, 160, 0.16)'
                                    : 'rgba(185, 154, 225, 0.16)',
                                  transition: reducedMotion ? 'none' : 'width 420ms cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                              />
                              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem' }}>
                                <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.86rem', fontWeight: isSelected ? 700 : 600, color: 'var(--deep-violet)', lineHeight: 1.35 }}>
                                  {opt.label}
                                  {isSelected && (
                                    <span style={{ marginLeft: '0.45rem', fontSize: '0.72rem', color: 'var(--vistara-purple)' }}>
                                      ✓ Pilihan kamu
                                    </span>
                                  )}
                                </span>
                                <span className="tabular-nums" style={{ fontFamily: 'var(--font-header)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--vistara-purple)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  {hasVoted ? `${pct}% (${opt.votes})` : 'Pilih'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="aspirasi-poll-footer" style={{ marginTop: '0.9rem', fontFamily: 'var(--font-header)', fontSize: '0.74rem', color: 'var(--mid-grey)' }}>
                        Total suara masuk: <strong className="tabular-nums" style={{ color: 'var(--deep-violet)' }}>{totalVotes}</strong> suara
                      </div>
                    </div>
                  );
                }))}
              </motion.div>
            )}

            {/* ── TAB 4: ALUR & TEKNIS SOP RESMI ── */}
            {activeTab === 'konsep' && (
              <motion.div
                key="tab-konsep"
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                style={{ maxWidth: '780px', margin: '0 auto' }}
              >
                <div
                  className="card aspirasi-sop-card"
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

                  <h4 style={{ color: 'var(--deep-violet)', marginBottom: '0.75rem', fontSize: '1rem' }}>
                    5 Langkah Alur Penanganan Resmi:
                  </h4>
                  <div className="aspirasi-sop-steps" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
                    {[
                      { no: '1', title: 'Penyampaian Aspirasi', desc: 'Siswa menyampaikan saran/keluhan melalui website VISTARA Hub atau kotak fisik di depan kelas, perpustakaan, dan ruang OSIS.' },
                      { no: '2', title: 'Rekapitulasi & Kurasi Mingguan', desc: 'Pengurus Komisi 4 mengumpulkan dan memilih aspirasi yang bersifat penting, solutif, dan membangun.' },
                      { no: '3', title: 'Musyawarah Pengurus', desc: 'Aspirasi dirumuskan dalam rapat koordinasi mingguan pengurus OPDIM.' },
                      { no: '4', title: 'Penyampaian Formal ke Sekolah', desc: 'Hasil seleksi aspirasi disampaikan secara santun kepada Kepala Madrasah dan dewan guru.' },
                      { no: '5', title: 'Pengumuman Tindak Lanjut', desc: 'Hasil tindak lanjut atau tanggapan resmi diumumkan kepada seluruh siswa melalui portal digital dan mading.' },
                    ].map((step) => (
                      <div key={step.no} className="aspirasi-sop-step" style={{ display: 'flex', gap: '0.75rem', background: 'var(--ghost-purple)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <style>{`
        .aspirasi-compact-row:hover {
          background: var(--ghost-purple);
        }
        @media (max-width: 767px) {
          .aspirasi-page .page-hero {
            padding: 1.25rem 0 1.1rem !important;
          }
          .aspirasi-page .page-hero h1 {
            font-size: 1.45rem !important;
            margin-bottom: 0.35rem !important;
          }
          .aspirasi-page .page-hero p {
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
          }
          .aspirasi-page .page-hero .container > div:first-child {
            margin-bottom: 0.5rem !important;
          }
          .aspirasi-page .page-hero .container > div:nth-child(2) {
            margin-bottom: 0.4rem !important;
          }
          .aspirasi-section {
            padding-top: 1.15rem !important;
            padding-bottom: 2.25rem !important;
            min-height: auto !important;
          }
          .aspirasi-summary {
            margin-bottom: 0.9rem !important;
            padding: 0.6rem 0.5rem !important;
            gap: 0.25rem !important;
            border-radius: 12px !important;
          }
          .aspirasi-summary-val {
            font-size: 1.12rem !important;
          }
          .aspirasi-summary-label {
            font-size: 0.65rem !important;
          }
          .aspirasi-tabs-wrap {
            margin-bottom: 1rem !important;
          }
          .aspirasi-tabs {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            width: 100% !important;
            padding: 0.3rem !important;
            gap: 0.25rem !important;
            border-radius: 12px !important;
          }
          .aspirasi-tab-btn {
            justify-content: center !important;
            padding: 0.5rem 0.45rem !important;
            font-size: 0.76rem !important;
            min-height: 40px !important;
            white-space: nowrap !important;
          }
          .aspirasi-card,
          .aspirasi-track-search,
          .aspirasi-poll-card,
          .aspirasi-sop-card {
            padding: 1rem !important;
            border-radius: 14px !important;
          }
          .aspirasi-card-header {
            margin-bottom: 0.9rem !important;
          }
          .aspirasi-card-header h2 {
            font-size: 1.12rem !important;
          }
          .aspirasi-card-header p {
            font-size: 0.78rem !important;
            line-height: 1.4 !important;
          }
          .aspirasi-form {
            gap: 0.85rem !important;
          }
          .aspirasi-jenis-grid {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 0.35rem !important;
          }
          .aspirasi-jenis-btn {
            justify-content: center !important;
            padding: 0.45rem 0.3rem !important;
            font-size: 0.74rem !important;
          }
          .aspirasi-form select,
          .aspirasi-form input[type='text'] {
            padding: 0.6rem 0.75rem !important;
            font-size: 0.85rem !important;
          }
          .aspirasi-form textarea {
            padding: 0.6rem 0.75rem !important;
            font-size: 0.85rem !important;
            min-height: 78px !important;
            height: 84px !important;
          }
          .aspirasi-anon-box {
            padding: 0.75rem 0.85rem !important;
          }
          .aspirasi-form button[type='submit'] {
            min-height: 44px !important;
            padding: 0.65rem 1rem !important;
            font-size: 0.88rem !important;
            margin-top: 0.1rem !important;
          }
          .aspirasi-track-search {
            margin-bottom: 0.9rem !important;
          }
          .aspirasi-track-input-wrap {
            min-width: 0 !important;
            width: 100% !important;
          }
          .aspirasi-track-btn {
            width: 100% !important;
            min-height: 44px !important;
            padding: 0.55rem 1rem !important;
          }
          .aspirasi-public-list-wrap {
            margin-top: 0.75rem !important;
          }
          .aspirasi-compact-row {
            padding: 0.7rem 0.85rem !important;
          }
          .aspirasi-poll-list {
            gap: 0.85rem !important;
          }
          .aspirasi-poll-meta {
            margin-bottom: 0.4rem !important;
          }
          .aspirasi-poll-question {
            font-size: 1rem !important;
            line-height: 1.3 !important;
            margin-bottom: 0.25rem !important;
          }
          .aspirasi-poll-desc {
            font-size: 0.78rem !important;
            line-height: 1.4 !important;
            margin-bottom: 0.75rem !important;
          }
          .aspirasi-poll-options {
            gap: 0.45rem !important;
          }
          .aspirasi-poll-opt {
            padding: 0.6rem 0.75rem !important;
            min-height: 44px !important;
          }
          .aspirasi-poll-opt span {
            font-size: 0.8rem !important;
          }
          .aspirasi-poll-footer {
            margin-top: 0.65rem !important;
            font-size: 0.72rem !important;
          }
          .aspirasi-sop-steps {
            gap: 0.45rem !important;
            margin-bottom: 1.15rem !important;
          }
          .aspirasi-sop-step {
            padding: 0.65rem 0.75rem !important;
            gap: 0.6rem !important;
          }
        }
        @media (max-width: 479px) {
          .aspirasi-anon-fields {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
