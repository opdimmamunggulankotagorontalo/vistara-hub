import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MessageSquare,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState, LoadingState } from '../../components/ui';
import ShareButtons from '../../components/ui/ShareButtons';
import type { AspirasiRecord } from '../../types';
import { subscribeToTableChanges, trackAspirasi } from '../../services/dataClient';

const STATUS_STEPS = [
  { key: 'Diterima', shortLabel: 'Diterima', label: 'Diterima', desc: 'Aspirasi masuk ke antrean resmi Komisi 4.' },
  { key: 'Ditinjau', shortLabel: 'Ditinjau', label: 'Ditinjau', desc: 'Diverifikasi kelayakan dan tingkat urgensinya.' },
  { key: 'Didiskusikan', shortLabel: 'Diskusi', label: 'Didiskusikan', desc: 'Dibahas dalam musyawarah pengurus OPDIM.' },
  { key: 'Tindak Lanjut', shortLabel: 'Tindak Lanjut', label: 'Tindak Lanjut', desc: 'Diteruskan dan dikoordinasikan dengan madrasah.' },
  { key: 'Selesai', shortLabel: 'Selesai', label: 'Selesai', desc: 'Solusi diterapkan atau telah ditanggapi resmi.' },
];

const STEP_INDEX_MAP: Record<string, number> = {
  Diterima: 0,
  Ditinjau: 1,
  Didiskusikan: 2,
  'Tindak Lanjut': 3,
  Selesai: 4,
};

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

export default function AspirasiTrackDetailPage() {
  const { kodeLacak } = useParams<{ kodeLacak: string }>();
  const decodedCode = decodeURIComponent(kodeLacak || '').trim().toUpperCase();

  const [loadedState, setLoadedState] = useState<{
    code: string;
    record: AspirasiRecord | null;
  }>({ code: '', record: null });
  const [copied, setCopied] = useState(false);

  const isLoading = loadedState.code !== decodedCode;
  const record = isLoading ? null : loadedState.record;

  useEffect(() => {
    let active = true;

    const loadRecord = async () => {
      if (!decodedCode) {
        if (active) {
          setLoadedState({ code: decodedCode, record: null });
        }
        return;
      }
      const found = await trackAspirasi(decodedCode);
      if (active) {
        setLoadedState({ code: decodedCode, record: found });
      }
    };

    void loadRecord();

    const unsub = subscribeToTableChanges('aspirasi', () => {
      if (active) void loadRecord();
    });

    return () => {
      active = false;
      unsub();
    };
  }, [decodedCode]);

  const handleCopyCode = () => {
    if (!record) return;
    navigator.clipboard?.writeText(record.kodeLacak);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '6rem 1.5rem' }}>
        <LoadingState />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="aspirasi-detail-page">
        <PageHeader
          title="Detail Lacak Aspirasi"
          subtitle="Pantau perkembangan resmi aspirasi siswa berdasarkan kode lacak unik."
          breadcrumbs={[
            { label: 'Aspirasi', href: '/beranda/aspirasi?tab=lacak' },
            { label: decodedCode || 'Tidak Ditemukan' },
          ]}
        />
        <section className="section" style={{ background: 'var(--warm-white)', padding: '2.5rem 0 4rem' }}>
          <div className="container" style={{ maxWidth: '720px' }}>
            <EmptyState
              title="Aspirasi tidak ditemukan"
              description={`Tidak ada aspirasi tercatat dengan kode "${decodedCode || '-'}". Periksa kembali kode lacak Anda atau cari dari daftar aspirasi.`}
            />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
              <Link
                to="/beranda/aspirasi?tab=lacak"
                className="btn btn-primary"
                style={{ minHeight: '44px' }}
              >
                <ArrowLeft size={15} /> Kembali ke Lacak Status
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const currentIdx = STEP_INDEX_MAP[record.status] ?? 0;
  const activeStep = STATUS_STEPS[currentIdx] ?? STATUS_STEPS[0];
  const badgeStyle = getStatusBadgeStyle(record.status);
  const progressPct = Math.round((currentIdx / (STATUS_STEPS.length - 1)) * 100);
  const historyList = [...(record.riwayatStatus || [])].reverse();

  return (
    <div className="aspirasi-detail-page">
      <PageHeader
        title={`Lacak ${record.kodeLacak}`}
        subtitle="Status penanganan dan tindak lanjut resmi Komisi 4 OPDIM VISTARA."
        breadcrumbs={[
          { label: 'Aspirasi', href: '/beranda/aspirasi?tab=lacak' },
          { label: record.kodeLacak },
        ]}
      />

      <section
        className="section aspirasi-detail-section"
        style={{ background: 'var(--warm-white)', paddingTop: '1.75rem', paddingBottom: '4rem' }}
      >
        <div className="container" style={{ maxWidth: '760px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            <Link
              to="/beranda/aspirasi?tab=lacak"
              className="btn btn-outline btn-sm"
              style={{ minHeight: '42px', display: 'inline-flex', alignItems: 'center' }}
            >
              <ArrowLeft size={14} /> Kembali ke Daftar Lacak
            </Link>

            <button
              type="button"
              onClick={handleCopyCode}
              className="btn btn-sm"
              style={{
                minHeight: '42px',
                background: copied ? '#E8F5E9' : 'white',
                color: copied ? '#2E7D32' : 'var(--deep-violet)',
                border: '1px solid var(--pale-lilac)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Kode Tersalin' : record.kodeLacak}</span>
            </button>
          </div>

          {/* Main Compact Summary Card */}
          <article
            className="card aspirasi-detail-card"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--pale-lilac)',
              borderRadius: '16px',
              padding: '1.35rem',
              boxShadow: '0 6px 24px rgba(45, 27, 105, 0.05)',
            }}
          >
            {/* Header Row: Code + Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem',
                flexWrap: 'wrap',
                marginBottom: '0.65rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: 'var(--vistara-purple)',
                }}
              >
                {record.kodeLacak}
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: badgeStyle.bg,
                  color: badgeStyle.color,
                  border: `1px solid ${badgeStyle.border}`,
                  borderRadius: '8px',
                  padding: '0.28rem 0.65rem',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {record.status === 'Selesai' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                <span>{record.status}</span>
              </span>
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: 'clamp(1.12rem, 3vw, 1.38rem)',
                color: 'var(--deep-violet)',
                lineHeight: 1.28,
                margin: '0 0 0.45rem',
              }}
            >
              {record.judul}
            </h2>

            {/* Clean unboxed metadata */}
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--mid-grey)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.35rem',
                alignItems: 'center',
                marginBottom: '0.95rem',
              }}
            >
              <span>{record.kategori}</span>
              <span aria-hidden="true">·</span>
              <span>{record.jenis}</span>
              <span aria-hidden="true">·</span>
              <span>{record.tanggal}</span>
              <span aria-hidden="true">·</span>
              <span>
                {record.isAnonim
                  ? 'Pengirim Anonim'
                  : `${record.namaPengirim || 'Siswa MAM'}${record.kelasPengirim ? ` (${record.kelasPengirim})` : ''}`}
              </span>
            </div>

            {/* Aspirasi Isi */}
            <div
              style={{
                background: 'var(--warm-white)',
                border: '1px solid #EAE2F8',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                fontSize: '0.88rem',
                color: 'var(--charcoal)',
                lineHeight: 1.6,
                marginBottom: '1.25rem',
              }}
            >
              {record.isi}
            </div>

            {/* Compact 5-Stage Progress Rail */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--deep-violet)',
                  }}
                >
                  Progres Penanganan ({currentIdx + 1}/{STATUS_STEPS.length})
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--vistara-purple)',
                  }}
                >
                  {progressPct}%
                </span>
              </div>

              <div className="aspirasi-compact-rail" style={{ position: 'relative' }}>
                {/* Track Line */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '13px',
                    left: '10%',
                    right: '10%',
                    height: '3px',
                    background: '#EAE2F8',
                    borderRadius: '999px',
                    zIndex: 0,
                  }}
                >
                  <div
                    style={{
                      width: `${progressPct}%`,
                      height: '100%',
                      background: 'var(--vistara-purple)',
                      borderRadius: '999px',
                      transition: 'width 260ms ease',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                    gap: '0.2rem',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <div
                        key={step.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isDone ? 'var(--vistara-purple)' : '#FFFFFF',
                            border: `2px solid ${isDone ? 'var(--vistara-purple)' : '#D4BFEF'}`,
                            color: isDone ? '#FFFFFF' : 'var(--mid-grey)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            boxShadow: isCurrent ? '0 0 0 4px rgba(107, 63, 160, 0.16)' : 'none',
                          }}
                        >
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <span
                          style={{
                            marginTop: '0.35rem',
                            fontFamily: 'var(--font-header)',
                            fontSize: '0.68rem',
                            fontWeight: isCurrent ? 800 : isDone ? 700 : 500,
                            color: isCurrent
                              ? 'var(--deep-violet)'
                              : isDone
                                ? 'var(--charcoal)'
                                : 'var(--mid-grey)',
                            lineHeight: 1.2,
                          }}
                        >
                          {step.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Single Focused Active Stage Summary */}
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: 'var(--ghost-purple)',
                  border: '1px solid var(--pale-lilac)',
                  fontSize: '0.8rem',
                  color: 'var(--charcoal)',
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: 'var(--deep-violet)' }}>Tahap Saat Ini — {activeStep.label}:</strong>{' '}
                {activeStep.desc}
              </div>
            </div>

            {/* Official Response */}
            {record.tanggapanResmi && (
              <div
                style={{
                  background: 'rgba(46, 125, 50, 0.05)',
                  border: '1px solid rgba(46, 125, 50, 0.24)',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                  marginBottom: historyList.length > 0 ? '1.15rem' : 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    marginBottom: '0.3rem',
                  }}
                >
                  <ShieldCheck size={16} style={{ color: '#2E7D32', flexShrink: 0 }} />
                  <h3 style={{ margin: 0, fontSize: '0.88rem', color: '#2E7D32' }}>
                    Tanggapan & Tindak Lanjut Resmi
                  </h3>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.84rem',
                    color: 'var(--charcoal)',
                    lineHeight: 1.55,
                  }}
                >
                  {record.tanggapanResmi}
                </p>
                {record.penindaklanjut && (
                  <div style={{ fontSize: '0.73rem', color: 'var(--mid-grey)', marginTop: '0.4rem' }}>
                    Ditindaklanjuti oleh: <strong style={{ color: 'var(--charcoal)' }}>{record.penindaklanjut}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Timeline */}
            {historyList.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--deep-violet)',
                    marginBottom: '0.55rem',
                  }}
                >
                  Riwayat Tindak Lanjut ({historyList.length})
                </div>
                <div
                  style={{
                    border: '1px solid #EAE2F8',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                  }}
                >
                  {historyList.map((log, index) => (
                    <div
                      key={`${log.status}-${log.waktu}-${index}`}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderTop: index === 0 ? 'none' : '1px solid #F0EAFA',
                        fontSize: '0.8rem',
                        lineHeight: 1.45,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.15rem',
                        }}
                      >
                        <strong style={{ color: 'var(--deep-violet)', fontSize: '0.78rem' }}>
                          {log.status}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--mid-grey)' }}>{log.waktu}</span>
                      </div>
                      <div style={{ color: 'var(--charcoal)' }}>{log.keterangan}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share & Quick Actions */}
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid #EAE2F8',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <ShareButtons
                title={`Lacak Aspirasi ${record.kodeLacak}: ${record.judul}`}
                summary={`Status saat ini: ${record.status}. Pantau progres resmi di OPDIM VISTARA.`}
                path={`/beranda/aspirasi/lacak/${record.kodeLacak}`}
                tag="Kotak Aspirasi OPDIM VISTARA"
                compact
              />

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link
                  to="/beranda/aspirasi?tab=lacak"
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '44px', flex: 1, justifyContent: 'center' }}
                >
                  <Search size={14} /> Lacak Aspirasi Lain
                </Link>
                <Link
                  to="/beranda/aspirasi?tab=kirim"
                  className="btn btn-primary btn-sm"
                  style={{ minHeight: '44px', flex: 1, justifyContent: 'center' }}
                >
                  <MessageSquare size={14} /> Kirim Aspirasi Baru
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      <style>{`
        @media (max-width: 767px) {
          .aspirasi-detail-page .page-hero {
            padding: 1.15rem 0 1rem !important;
          }
          .aspirasi-detail-page .page-hero h1 {
            font-size: 1.38rem !important;
            margin-bottom: 0.25rem !important;
          }
          .aspirasi-detail-page .page-hero p {
            font-size: 0.8rem !important;
            line-height: 1.4 !important;
          }
          .aspirasi-detail-section {
            padding-top: 1rem !important;
            padding-bottom: 5rem !important;
          }
          .aspirasi-detail-card {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
