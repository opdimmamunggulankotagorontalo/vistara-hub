import { useState } from 'react';
import { FileText, Download, Search, CheckCircle2, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, EmptyState } from '../../components/ui';
import { arsipData } from '../../data';
import type { ArsipItem } from '../../types';
import { ScrollReveal, TiltSpotlightCard } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';

const JENIS_TABS = [
  { value: 'all', label: 'Semua Arsip' },
  { value: 'sk', label: 'SK Kepengurusan' },
  { value: 'notulen', label: 'Notulen Rapat' },
  { value: 'dokumen', label: 'Dokumen & Pedoman' },
  { value: 'laporan', label: 'Laporan Kegiatan' },
];

const IDENTITY_BOOK_URL = 'https://drive.google.com/file/d/13sMxyTngsF2MtmEjuDojQEMSIJ5MrzhB/view?usp=drive_link';

function getBadgeColor(jenis: ArsipItem['jenis']) {
  switch (jenis) {
    case 'sk':
      return { variant: 'gold' as const, label: 'Surat Keputusan' };
    case 'notulen':
      return { variant: 'purple' as const, label: 'Notulen Resmi' };
    case 'dokumen':
      return { variant: 'outline' as const, label: 'Dokumen Kerja' };
    case 'laporan':
      return { variant: 'green' as const, label: 'Laporan Kegiatan' };
    default:
      return { variant: 'outline' as const, label: 'Berkas' };
  }
}

export default function Arsip() {
  const { reducedMotion } = useMotionSystem();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const filtered = arsipData.filter((item) => {
    const matchType = activeTab === 'all' || item.jenis === activeTab;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleDownloadFeedback = (id: string) => {
    setDownloadedId(id);
    setTimeout(() => {
      setDownloadedId(null);
    }, 2500);
  };

  return (
    <div>
      <PageHeader
        title="Pusat Arsip & Dokumen Digital"
        subtitle="Transparansi tata kelola OPDIM VISTARA: Surat Keputusan, Notulen Rapat, Pedoman Kerja, dan Laporan Pertanggungjawaban."
        badge="Repositori Terbuka"
        breadcrumbs={[
          { label: 'Beranda', href: '/beranda' },
          { label: 'Arsip' },
        ]}
      />

      <div className="section-padding">
        <div className="container">
          {/* Information & Transparency Banner */}
          <ScrollReveal preset="blurIn">
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(74, 44, 138, 0.08), rgba(201, 168, 76, 0.08))',
                border: '1px solid var(--pale-lilac)',
                borderRadius: '16px',
                padding: '1.5rem 2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                marginBottom: '2.5rem',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--deep-violet)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={24} />
              </div>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.25rem' }}>
                  Keterbukaan Informasi & Akuntabilitas Publik
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--mid-grey)', lineHeight: 1.5, margin: 0 }}>
                  Seluruh dokumen resmi diterbitkan dengan verifikasi keabsahan Majelis Pembina OPDIM MAM Unggulan Kota Gorontalo untuk mendukung keterbukaan dan regenerasi organisasi.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Controls: Search & Filter Tabs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              background: 'white',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid var(--pale-lilac)',
              boxShadow: '0 4px 20px rgba(107, 63, 160, 0.04)',
            }}
          >
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--mid-grey)',
                }}
              />
              <input
                type="text"
                placeholder="Cari judul berkas atau keterangan arsip..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: '12px',
                  border: '1px solid var(--pale-lilac)',
                  background: 'var(--ghost-purple)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {JENIS_TABS.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    style={{
                      position: 'relative',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'transparent' : 'var(--ghost-purple)',
                      color: isActive ? 'white' : 'var(--slate)',
                    }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="arsip-jenis-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '20px',
                          background: 'var(--deep-violet)',
                          zIndex: 0,
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Archive Document List */}
          {filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada arsip yang cocok"
              description="Silakan periksa kembali kata kunci pencarian atau ganti kategori dokumen."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((item, idx) => {
                const badgeInfo = getBadgeColor(item.jenis);
                const isDownloaded = downloadedId === item.id;
                const isIdentityBook = item.id === 'ar-idbook';

                return (
                  <ScrollReveal key={item.id} preset="fadeUp" delay={Math.min(idx * 0.05, 0.2)}>
                    <TiltSpotlightCard
                      maxTilt={3}
                      style={{
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 16px rgba(45, 27, 105, 0.04)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flex: '1', minWidth: '240px' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              background: 'var(--ghost-purple)',
                              border: '1px solid var(--pale-lilac)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--royal-purple)',
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={22} />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                              <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                              <span style={{ fontSize: '0.78rem', color: 'var(--mid-grey)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={13} />
                                {item.tanggal}
                              </span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--mid-grey)' }}>
                                • {item.ukuran}
                              </span>
                            </div>

                            <h3
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                color: 'var(--deep-violet)',
                                marginBottom: '0.35rem',
                              }}
                            >
                              {item.title}
                            </h3>

                            <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.5, margin: 0 }}>
                              {item.deskripsi}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {isIdentityBook ? (
                            <motion.a
                              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                              href={IDENTITY_BOOK_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleDownloadFeedback(item.id)}
                              className="btn btn-outline btn-sm"
                            >
                              <Download size={16} />
                              <span>Unduh di Drive</span>
                              <ExternalLink size={13} />
                            </motion.a>
                          ) : (
                            <motion.button
                              type="button"
                              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                              onClick={() => handleDownloadFeedback(item.id)}
                              className="btn btn-outline btn-sm"
                              style={{
                                background: isDownloaded ? 'var(--ghost-purple)' : 'transparent',
                                color: isDownloaded ? '#2E7D32' : 'var(--royal-purple)',
                                borderColor: isDownloaded ? '#A5D6A7' : 'var(--pale-lilac)',
                              }}
                            >
                              {isDownloaded ? (
                                <>
                                  <CheckCircle2 size={16} style={{ color: '#2E7D32' }} />
                                  <span>Disiapkan untuk Unduh</span>
                                </>
                              ) : (
                                <>
                                  <Download size={16} />
                                  <span>Unduh Berkas</span>
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </TiltSpotlightCard>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
