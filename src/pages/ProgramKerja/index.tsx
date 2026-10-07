import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge, EmptyState } from '../../components/ui';
import { programKerjaData, komisiData } from '../../data';

export default function ProgramKerjaPage() {
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [freqFilter, setFreqFilter] = useState<string>('all');

  const filtered = programKerjaData.filter((pk) => {
    const komisiMatch = filter === 'all' || pk.komisi === filter;
    const statusMatch = statusFilter === 'all' || pk.status === statusFilter;
    const freqMatch = freqFilter === 'all' || pk.frekuensi === freqFilter;
    return komisiMatch && statusMatch && freqMatch;
  });

  return (
    <div>
      <PageHeader
        title="Program Kerja VISTARA"
        subtitle="Seluruh program kerja resmi 5 Komisi OPDIM VISTARA 2026–2027 — dari agenda harian, mingguan, bulanan, hingga rencana strategis."
        badge="2026–2027"
        breadcrumbs={[{ label: 'Program Kerja' }]}
      />

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              { value: programKerjaData.length.toString(), label: 'Total Program', color: 'var(--deep-violet)' },
              { value: programKerjaData.filter(p => p.komisi === 'Komisi 3').length.toString(), label: 'Proker Komisi 3', color: '#845CBC' },
              { value: programKerjaData.filter(p => p.status === 'ongoing').length.toString(), label: 'Sedang Berjalan', color: '#2E7D32' },
              { value: programKerjaData.filter(p => p.frekuensi === 'Harian' || p.frekuensi === 'Mingguan').length.toString(), label: 'Rutin Harian & Mingguan', color: 'var(--gold-accent)' },
            ].map((stat) => (
              <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', padding: '1.25rem', background: 'var(--ghost-purple)', borderRadius: '12px', border: '1px solid var(--pale-lilac)' }}>
            {/* Row 1: Komisi Filter */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '70px' }}>
                <Filter size={14} style={{ color: 'var(--mid-grey)' }} />
                <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', fontWeight: 600 }}>Komisi:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[{ label: 'Semua Komisi', value: 'all' }, ...komisiData.map(k => ({ label: k.name, value: k.name }))].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      background: filter === opt.value ? 'var(--vistara-purple)' : 'white',
                      color: filter === opt.value ? 'white' : 'var(--royal-purple)',
                      transition: 'all var(--transition-fast)',
                      fontFamily: 'var(--font-header)',
                      boxShadow: filter === opt.value ? '0 2px 8px rgba(107,63,160,0.25)' : 'none',
                    }}
                    aria-pressed={filter === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Frekuensi Filter & Status Filter */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(185,154,225,0.2)' }}>
              {/* Frekuensi */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', fontWeight: 600, minWidth: '70px' }}>Frekuensi:</span>
                {[
                  { label: 'Semua', value: 'all' },
                  { label: '☀️ Harian', value: 'Harian' },
                  { label: '📅 Mingguan', value: 'Mingguan' },
                  { label: '📆 Bulanan', value: 'Bulanan' },
                  { label: '🎯 Tahunan', value: 'Tahunan' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFreqFilter(opt.value)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      background: freqFilter === opt.value ? 'var(--deep-violet)' : 'rgba(255,255,255,0.7)',
                      color: freqFilter === opt.value ? 'white' : 'var(--mid-grey)',
                      border: `1px solid ${freqFilter === opt.value ? 'transparent' : 'var(--pale-lilac)'}`,
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.7rem',
                    }}
                    aria-pressed={freqFilter === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', fontWeight: 600 }}>Status:</span>
                {[
                  { label: 'Semua', value: 'all' },
                  { label: 'Berlangsung', value: 'ongoing' },
                  { label: 'Direncanakan', value: 'planned' },
                  { label: 'Selesai', value: 'completed' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      background: statusFilter === opt.value ? 'var(--deep-violet)' : 'rgba(255,255,255,0.7)',
                      color: statusFilter === opt.value ? 'white' : 'var(--mid-grey)',
                      border: `1px solid ${statusFilter === opt.value ? 'transparent' : 'var(--pale-lilac)'}`,
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.7rem',
                    }}
                    aria-pressed={statusFilter === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results count */}
          <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--mid-grey)', marginBottom: '1.5rem' }}>
            Menampilkan <strong style={{ color: 'var(--deep-violet)' }}>{filtered.length}</strong> program kerja resmi
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada program kerja yang cocok"
              description="Coba ubah filter komisi, frekuensi, atau status."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((proker) => (
                <article key={proker.id} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {/* Card Header Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span
                        className="badge"
                        style={{ background: `${proker.komisiColor}18`, color: proker.komisiColor, border: `1px solid ${proker.komisiColor}35`, fontSize: '0.65rem' }}
                      >
                        {proker.komisi}
                      </span>
                      {proker.frekuensi && (
                        <span
                          className="badge"
                          style={{ background: 'var(--lavender-mist)', color: 'var(--royal-purple)', border: '1px solid var(--pale-lilac)', fontSize: '0.62rem' }}
                        >
                          {proker.frekuensi}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={proker.status} />
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--deep-violet)', marginBottom: '0.625rem', lineHeight: 1.3 }}>
                    {proker.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    {proker.description}
                  </p>

                  {/* Tujuan Resmi Box */}
                  {proker.tujuan && (
                    <div style={{ background: 'rgba(132, 92, 188, 0.06)', borderLeft: '3px solid var(--vistara-purple)', borderRadius: '4px', padding: '0.6rem 0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--vistara-purple)', marginBottom: '0.2rem' }}>
                        Tujuan Resmi:
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.45 }}>
                        "{proker.tujuan}"
                      </div>
                    </div>
                  )}

                  {/* Misi Mingguan Preview if present */}
                  {proker.misiMingguan && (
                    <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.6rem', background: 'white', borderRadius: '6px', border: '1px dashed var(--pale-lilac)' }}>
                      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', color: 'var(--mid-grey)', marginBottom: '0.35rem', fontWeight: 600 }}>
                        5 Rotasi Tema Misi:
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {proker.misiMingguan.map((m, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--ghost-purple)',
                              color: 'var(--deep-violet)',
                              border: '1px solid var(--pale-lilac)',
                              fontFamily: 'var(--font-header)',
                            }}
                          >
                            Mg {idx + 1}: {m.tema}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div style={{ background: 'var(--ghost-purple)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', marginTop: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: '0.2rem' }}>Timeline</div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.76rem', color: 'var(--deep-violet)', fontWeight: 600 }}>{proker.timeline}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: '0.2rem' }}>Target Output</div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.76rem', color: 'var(--deep-violet)', fontWeight: 600 }}>{proker.targetOutput}</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/beranda/program-kerja/${proker.slug}`}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Lihat Detail Lengkap <ArrowRight size={13} />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
