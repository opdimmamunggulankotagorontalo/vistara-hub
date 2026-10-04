import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Search, Filter, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, EmptyState } from '../../components/ui';
import { prestasiData } from '../../data';
import type { PrestasiItem } from '../../types';

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
  const [selectedTingkat, setSelectedTingkat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = prestasiData.filter((item) => {
    const matchTingkat = selectedTingkat === 'all' || item.tingkat === selectedTingkat;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.peraih.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.penyelenggara.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTingkat && matchSearch;
  });

  const countNasional = prestasiData.filter((p) => p.tingkat === 'nasional').length;
  const countProvinsi = prestasiData.filter((p) => p.tingkat === 'provinsi').length;
  const countKota = prestasiData.filter((p) => p.tingkat === 'kabupaten').length;

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
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>🏆</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--deep-violet)' }}>
                {prestasiData.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', fontWeight: 500 }}>
                Total Prestasi Tercatat
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>🇮🇩</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--royal-purple)' }}>
                {countNasional}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', fontWeight: 500 }}>
                Tingkat Nasional
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>🏛️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--vistara-purple)' }}>
                {countProvinsi}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', fontWeight: 500 }}>
                Tingkat Provinsi
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>📍</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--gold-accent)' }}>
                {countKota}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', fontWeight: 500 }}>
                Tingkat Kota / Kabupaten
              </div>
            </div>
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
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
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

            {/* Tingkat Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--mid-grey)', marginRight: '0.25rem' }} />
              {TINGKAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedTingkat(opt.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    background: selectedTingkat === opt.value ? 'var(--deep-violet)' : 'var(--ghost-purple)',
                    color: selectedTingkat === opt.value ? 'white' : 'var(--slate)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prestasi Cards Grid */}
          {filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada prestasi yang sesuai kriteria"
              description="Coba ubah kata kunci pencarian atau pilih kategori tingkat yang lain."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {filtered.map((item) => {
                const medal = getMedalConfig(item.medali);
                return (
                  <div
                    key={item.id}
                    className="feature-card"
                    style={{
                      background: 'white',
                      borderRadius: '18px',
                      border: '1px solid var(--pale-lilac)',
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 6px 24px rgba(45, 27, 105, 0.05)',
                      transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
                    }}
                  >
                    {/* Top row: Medal Badge & Tingkat */}
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

                      {/* Title */}
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

                      {/* Recipient */}
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

                      {/* Organizer & Category */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', lineHeight: 1.5 }}>
                        <div>Penyelenggara: {item.penyelenggara}</div>
                        <div>Bidang: <span style={{ color: 'var(--royal-purple)', fontWeight: 500 }}>{item.kategori}</span> ({item.tahun})</div>
                      </div>
                    </div>

                    {/* Bottom CTA to Detail */}
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
                          transition: 'gap var(--transition-fast)',
                        }}
                      >
                        <span>Lihat Dokumentasi & Detail</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
