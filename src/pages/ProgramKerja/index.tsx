import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge, EmptyState } from '../../components/ui';
import { programKerjaData, komisiData } from '../../data';

export default function ProgramKerjaPage() {
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = programKerjaData.filter((pk) => {
    const komisiMatch = filter === 'all' || pk.komisi === filter;
    const statusMatch = statusFilter === 'all' || pk.status === statusFilter;
    return komisiMatch && statusMatch;
  });

  return (
    <div>
      <PageHeader
        title="Program Kerja VISTARA"
        subtitle="Seluruh program kerja 5 Komisi OPDIM VISTARA 2026–2027 — dari perencanaan hingga pelaksanaan."
        badge="2026–2027"
        breadcrumbs={[{ label: 'Program Kerja' }]}
      />

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              { value: programKerjaData.length.toString(), label: 'Total Program', color: 'var(--deep-violet)' },
              { value: programKerjaData.filter(p => p.status === 'ongoing').length.toString(), label: 'Sedang Berjalan', color: '#2E7D32' },
              { value: programKerjaData.filter(p => p.status === 'planned').length.toString(), label: 'Direncanakan', color: 'var(--amethyst)' },
              { value: programKerjaData.filter(p => p.status === 'completed').length.toString(), label: 'Selesai', color: 'var(--gold-accent)' },
            ].map((stat) => (
              <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem', padding: '1rem 1.25rem', background: 'var(--ghost-purple)', borderRadius: '12px', border: '1px solid var(--pale-lilac)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
              <Filter size={14} style={{ color: 'var(--mid-grey)' }} />
              <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--mid-grey)', fontWeight: 600 }}>Filter:</span>
            </div>

            {/* Komisi filter */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[{ label: 'Semua Komisi', value: 'all' }, ...komisiData.map(k => ({ label: k.name, value: k.name }))].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className="badge"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: filter === opt.value ? 'var(--vistara-purple)' : 'var(--lavender-mist)',
                    color: filter === opt.value ? 'white' : 'var(--royal-purple)',
                    transition: 'all var(--transition-fast)',
                    fontFamily: 'var(--font-header)',
                  }}
                  aria-pressed={filter === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ width: '1px', height: '20px', background: 'var(--pale-lilac)', margin: '0 0.25rem' }} />

            {/* Status filter */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Semua Status', value: 'all' },
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
                    background: statusFilter === opt.value ? 'var(--deep-violet)' : 'white',
                    color: statusFilter === opt.value ? 'white' : 'var(--mid-grey)',
                    transition: 'all var(--transition-fast)',
                    fontFamily: 'var(--font-header)',
                    border: `1px solid ${statusFilter === opt.value ? 'transparent' : 'var(--pale-lilac)'}`,
                  }}
                  aria-pressed={statusFilter === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--mid-grey)', marginBottom: '1.5rem' }}>
            Menampilkan <strong style={{ color: 'var(--deep-violet)' }}>{filtered.length}</strong> program kerja
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada program kerja yang cocok"
              description="Coba ubah filter komisi atau status."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((proker) => (
                <article key={proker.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <span
                      className="badge"
                      style={{ background: `${proker.komisiColor}18`, color: proker.komisiColor, border: `1px solid ${proker.komisiColor}35`, fontSize: '0.65rem', flexShrink: 0 }}
                    >
                      {proker.komisi}
                    </span>
                    <StatusBadge status={proker.status} />
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--deep-violet)', marginBottom: '0.625rem', lineHeight: 1.3 }}>
                    {proker.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.6, marginBottom: '1rem', flex: 1 }}>
                    {proker.description}
                  </p>

                  <div style={{ background: 'var(--ghost-purple)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: '0.2rem' }}>Timeline</div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.78rem', color: 'var(--deep-violet)', fontWeight: 600 }}>{proker.timeline}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: '0.2rem' }}>Target</div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.78rem', color: 'var(--deep-violet)', fontWeight: 600 }}>{proker.targetOutput}</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/beranda/program-kerja/${proker.slug}`}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Lihat Detail <ArrowRight size={13} />
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
