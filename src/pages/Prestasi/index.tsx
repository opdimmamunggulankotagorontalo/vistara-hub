import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Search, Filter, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, EmptyState, LoadingState } from '../../components/ui';
import type { PrestasiItem } from '../../types';
import { fetchPrestasi, subscribeToTableChanges } from '../../services/dataClient';
import { AnimatedCounter, ScrollReveal, TiltSpotlightCard } from '../../components/motion/MotionPrimitives';

const TINGKAT_OPTIONS = [
  { value: 'all', label: 'Semua Tingkat' },
  { value: 'nasional', label: 'Nasional' },
  { value: 'provinsi', label: 'Provinsi' },
  { value: 'kabupaten', label: 'Kota / Kabupaten' },
];

function getMedalConfig(medali: PrestasiItem['medali']) {
  switch (medali) {
    case 'emas':
    case 'juara1':
      return {
        label: medali === 'emas' ? 'Medali Emas' : 'Juara 1',
        bg: 'linear-gradient(135deg, #F59E0B, #D97706)',
        color: '#FFFFFF',
        icon: '🥇',
      };
    case 'perak':
    case 'juara2':
      return {
        label: medali === 'perak' ? 'Medali Perak' : 'Juara 2',
        bg: 'linear-gradient(135deg, #94A3B8, #64748B)',
        color: '#FFFFFF',
        icon: '🥈',
      };
    case 'perunggu':
    case 'juara3':
      return {
        label: medali === 'perunggu' ? 'Medali Perunggu' : 'Juara 3',
        bg: 'linear-gradient(135deg, #D97706, #B45309)',
        color: '#FFFFFF',
        icon: '🥉',
      };
    default:
      return {
        label: 'Penghargaan',
        bg: 'linear-gradient(135deg, var(--vistara-purple), var(--royal-purple))',
        color: '#FFFFFF',
        icon: '🎖️',
      };
  }
}

export default function Prestasi() {
  const [items, setItems] = useState<PrestasiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTingkat, setSelectedTingkat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    const load = () => {
      void fetchPrestasi()
        .then((records) => {
          if (active) setItems(records);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    };
    load();
    const unsub = subscribeToTableChanges('prestasi', load);
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const filtered = items.filter((item) => {
    const normalizedTingkat = item.tingkat === ('kota' as PrestasiItem['tingkat']) ? 'kabupaten' : item.tingkat;
    const matchTingkat = selectedTingkat === 'all' || normalizedTingkat === selectedTingkat;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.title.toLowerCase().includes(q) ||
      item.peraih.toLowerCase().includes(q) ||
      item.kategori.toLowerCase().includes(q) ||
      item.penyelenggara.toLowerCase().includes(q);
    return matchTingkat && matchSearch;
  });

  const countNasional = items.filter((p) => p.tingkat === 'nasional').length;
  const countProvinsi = items.filter((p) => p.tingkat === 'provinsi').length;
  const countKota = items.filter(
    (p) => p.tingkat === 'kabupaten' || p.tingkat === ('kota' as PrestasiItem['tingkat'])
  ).length;

  return (
    <div>
      <PageHeader
        title="Prestasi & Kebanggaan"
        subtitle="Rekam jejak torehan prestasi gemilang santri dan pelajar MAM Unggulan Kota Gorontalo di berbagai panggung kompetisi."
        badge="Hall of Fame"
        breadcrumbs={[
          { label: 'Beranda', href: '/beranda' },
          { label: 'Prestasi' },
        ]}
      />

      <div className="section-padding">
        <div className="container">
          {/* Quick Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem',
            }}
          >
            {[
              { icon: '🏆', value: items.length, label: 'Total Prestasi Tercatat', color: 'var(--deep-violet)' },
              { icon: '🇮🇩', value: countNasional, label: 'Tingkat Nasional', color: 'var(--royal-purple)' },
              { icon: '🏛️', value: countProvinsi, label: 'Tingkat Provinsi', color: 'var(--vistara-purple)' },
              { icon: '📍', value: countKota, label: 'Tingkat Kota / Kabupaten', color: 'var(--gold-accent)' },
            ].map((stat, idx) => (
              <ScrollReveal key={stat.label} preset="scaleIn" delay={idx * 0.06}>
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: stat.color }}>
                    <AnimatedCounter target={stat.value} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', fontWeight: 500 }}>
                    {stat.label}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Search & Filter Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
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
                placeholder="Cari prestasi, nama peraih, atau penyelenggara..."
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

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--mid-grey)', marginRight: '0.25rem' }} />
              {TINGKAT_OPTIONS.map((opt) => {
                const isActive = selectedTingkat === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedTingkat(opt.value)}
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
                        layoutId="prestasi-tingkat-pill"
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
                    <span style={{ position: 'relative', zIndex: 1 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prestasi Cards Grid */}
          {isLoading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState
              title="Belum ada data prestasi"
              description="Data prestasi santri dan pelajar MAM Unggulan telah dibersihkan dan akan tampil di sini setelah diterbitkan melalui Dashboard Admin."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada prestasi yang sesuai kriteria"
              description="Coba ubah kata kunci pencarian atau pilih kategori tingkat yang lain."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {filtered.map((item, idx) => {
                const medal = getMedalConfig(item.medali);
                return (
                  <ScrollReveal key={item.id} preset="fadeUp" delay={Math.min(idx * 0.06, 0.24)}>
                    <TiltSpotlightCard
                      cursorLabel="Detail"
                      spotlightColor="rgba(201, 168, 76, 0.16)"
                      style={{
                        borderRadius: '18px',
                        padding: '1.75rem',
                        height: '100%',
                        boxShadow: '0 6px 24px rgba(45, 27, 105, 0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              marginBottom: '1rem',
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.85rem',
                                borderRadius: '100px',
                                background: medal.bg,
                                color: medal.color,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              }}
                            >
                              <span>{medal.icon}</span>
                              <span>{medal.label}</span>
                            </span>

                            <Badge variant="outline">
                              {item.tingkat.toUpperCase()}
                            </Badge>
                          </div>

                          <h3
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '1.15rem',
                              fontWeight: 700,
                              lineHeight: 1.35,
                              color: 'var(--deep-violet)',
                              marginBottom: '0.75rem',
                            }}
                          >
                            {item.title}
                          </h3>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.9rem',
                              color: 'var(--charcoal)',
                              fontWeight: 600,
                              marginBottom: '0.5rem',
                            }}
                          >
                            <Award size={16} style={{ color: 'var(--vistara-purple)', flexShrink: 0 }} />
                            <span>{item.peraih}</span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', lineHeight: 1.5 }}>
                            <div>Penyelenggara: {item.penyelenggara}</div>
                            <div>Bidang: <span style={{ color: 'var(--royal-purple)', fontWeight: 500 }}>{item.kategori}</span> ({item.tahun})</div>
                          </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--lavender-mist)' }}>
                          <Link
                            to={`/beranda/prestasi/${item.slug}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: 'var(--royal-purple)',
                              textDecoration: 'none',
                            }}
                          >
                            <span>Lihat Dokumentasi & Detail</span>
                            <ArrowRight size={15} />
                          </Link>
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
