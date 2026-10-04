import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Target, Users } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/ui';
import { programKerjaData } from '../../data';

export default function ProgramKerjaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const proker = programKerjaData.find((p) => p.slug === slug);

  if (!proker) {
    return (
      <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--deep-violet)', marginBottom: '1rem' }}>Program Tidak Ditemukan</h1>
        <p style={{ color: 'var(--mid-grey)', marginBottom: '2rem' }}>Program kerja dengan ID ini tidak tersedia.</p>
        <Link to="/beranda/program-kerja" className="btn btn-primary">
          <ArrowLeft size={16} /> Kembali ke Program Kerja
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={proker.title}
        subtitle={proker.description}
        breadcrumbs={[
          { label: 'Program Kerja', href: '/beranda/program-kerja' },
          { label: proker.title },
        ]}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge" style={{ background: `${proker.komisiColor}25`, color: proker.komisiColor, border: `1px solid ${proker.komisiColor}40` }}>
            {proker.komisi}
          </span>
          <StatusBadge status={proker.status} />
        </div>
      </PageHeader>

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ maxWidth: '800px' }}>
            <Link to="/beranda/program-kerja" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
              <ArrowLeft size={14} /> Kembali
            </Link>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Ringkasan Program</h2>
              <p style={{ color: 'var(--charcoal)', lineHeight: 1.8 }}>{proker.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <Clock size={18} style={{ color: 'var(--vistara-purple)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Timeline</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--deep-violet)' }}>{proker.timeline}</div>
                </div>
              </div>
              <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <Target size={18} style={{ color: 'var(--vistara-purple)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Target Output</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--deep-violet)' }}>{proker.targetOutput}</div>
                </div>
              </div>
              <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <Users size={18} style={{ color: 'var(--vistara-purple)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Pelaksana</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: proker.komisiColor }}>{proker.komisi}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
