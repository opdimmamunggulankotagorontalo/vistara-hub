import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Target, Users, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
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
        <p style={{ color: 'var(--mid-grey)', marginBottom: '2rem' }}>Program kerja dengan slug ini tidak ditemukan dalam arsip resmi.</p>
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
          {proker.frekuensi && (
            <span className="badge" style={{ background: 'var(--lavender-mist)', color: 'var(--royal-purple)', border: '1px solid var(--pale-lilac)' }}>
              Frekuensi: {proker.frekuensi}
            </span>
          )}
          <StatusBadge status={proker.status} />
        </div>
      </PageHeader>

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <Link to="/beranda/program-kerja" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
              <ArrowLeft size={14} /> Kembali ke Program Kerja
            </Link>

            {/* Tujuan Resmi Box */}
            {proker.tujuan && (
              <div
                className="card"
                style={{
                  marginBottom: '1.75rem',
                  borderLeft: '4px solid var(--vistara-purple)',
                  background: 'linear-gradient(135deg, rgba(132, 92, 188, 0.05) 0%, rgba(185, 154, 225, 0.08) 100%)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--lavender-mist)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={20} style={{ color: 'var(--vistara-purple)' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--vistara-purple)', fontWeight: 700 }}>
                      Tujuan Resmi Program
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-violet)', margin: 0 }}>
                      Landasan & Target Keberhasilan
                    </h3>
                  </div>
                </div>
                <blockquote style={{ color: 'var(--charcoal)', fontSize: '1rem', lineHeight: 1.8, fontStyle: 'italic', margin: 0, paddingLeft: '0.5rem', borderLeft: '2px solid rgba(132, 92, 188, 0.3)' }}>
                  "{proker.tujuan}"
                </blockquote>
              </div>
            )}

            {/* Ringkasan Deskripsi */}
            <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', color: 'var(--deep-violet)' }}>Deskripsi Pelaksanaan</h2>
              <p style={{ color: 'var(--charcoal)', lineHeight: 1.8, fontSize: '0.95rem' }}>{proker.description}</p>
            </div>

            {/* Misi Mingguan Siswa Visual Cards (If present) */}
            {proker.misiMingguan && proker.misiMingguan.length > 0 && (
              <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--lavender-mist)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={20} style={{ color: 'var(--vistara-purple)' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--vistara-purple)', fontWeight: 700 }}>
                      Siklus Misi Berkelanjutan
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-violet)', margin: 0 }}>
                      5 Rotasi Tema Misi Mingguan
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {proker.misiMingguan.map((m, idx) => {
                    const icons = ['🧹', '🏃', '🎨', '📚', '🤝'];
                    const icon = icons[idx] || '⭐';
                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--ghost-purple)',
                          border: '1px solid var(--pale-lilac)',
                          borderRadius: '10px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--vistara-purple)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            {m.minggu}
                          </span>
                          <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--deep-violet)' }}>
                          {m.tema}
                        </div>
                        {m.deskripsi && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', lineHeight: 1.5, margin: 0 }}>
                            {m.deskripsi}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mekanisme Pelaksanaan Steps (If present) */}
            {proker.mekanisme && proker.mekanisme.length > 0 && (
              <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--lavender-mist)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={20} style={{ color: 'var(--vistara-purple)' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--vistara-purple)', fontWeight: 700 }}>
                      SOP & Prosedur
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-violet)', margin: 0 }}>
                      Alur Pelaksanaan Program
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {proker.mekanisme.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, var(--deep-violet), var(--vistara-purple))',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-header)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <p style={{ fontSize: '0.9rem', color: 'var(--charcoal)', lineHeight: 1.6, margin: 0 }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
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
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Komisi Pelaksana</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: proker.komisiColor }}>{proker.komisi}</div>
                </div>
              </div>

              {proker.pic && (
                <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--vistara-purple)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Penanggung Jawab (PIC)</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--deep-violet)' }}>{proker.pic}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
