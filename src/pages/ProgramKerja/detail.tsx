import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Clock, Target, Users, CheckCircle2, ShieldCheck,
  FileText, ArrowRight, Lightbulb, AlertTriangle, Sparkles
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/ui';
import { programKerjaData } from '../../data';

export default function ProgramKerjaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const proker = programKerjaData.find((p) => p.slug === slug);

  if (!proker) {
    return (
      <div style={{ padding: '8rem 2rem', textAlign: 'center', background: 'var(--warm-white)', minHeight: '60vh' }}>
        <h1 style={{ color: 'var(--deep-violet)', marginBottom: '1rem' }}>Program Tidak Ditemukan</h1>
        <p style={{ color: 'var(--mid-grey)', marginBottom: '2rem' }}>Program kerja dengan pengenal "{slug}" tidak ditemukan dalam arsip resmi.</p>
        <Link to="/beranda/program-kerja" className="btn btn-primary">
          <ArrowLeft size={16} /> Kembali ke Program Kerja
        </Link>
      </div>
    );
  }

  // Related programs
  const relatedProkers = programKerjaData
    .filter((p) => p.slug !== proker.slug && (p.komisi === proker.komisi || p.kategoriProker === proker.kategoriProker))
    .slice(0, 3);

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
          <span className="badge" style={{ background: `${proker.komisiColor}25`, color: proker.komisiColor, border: `1px solid ${proker.komisiColor}40`, fontWeight: 700 }}>
            {proker.komisi}
          </span>
          {proker.frekuensi && (
            <span className="badge" style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}>
              📅 {proker.frekuensi}
            </span>
          )}
          <StatusBadge status={proker.status} />
        </div>
      </PageHeader>

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <Link to="/beranda/program-kerja" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
              <ArrowLeft size={14} /> Kembali ke Daftar Program Kerja
            </Link>

            {/* ── CARD RINGKASAN & DESKRIPSI ── */}
            <div className="card" style={{ marginBottom: '1.75rem', borderLeft: `5px solid ${proker.komisiColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <FileText size={18} style={{ color: proker.komisiColor }} />
                <h2 style={{ fontSize: '1.25rem', color: 'var(--deep-violet)', margin: 0 }}>Deskripsi & Gambaran Program</h2>
              </div>
              <p style={{ color: 'var(--charcoal)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                {proker.description}
              </p>
            </div>

            {/* ── TUJUAN & FUNGSI ── */}
            {(proker.tujuan || proker.fungsi) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                {proker.tujuan && (
                  <div className="card" style={{ background: 'var(--ghost-purple)', border: '1px solid var(--pale-lilac)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Target size={18} style={{ color: 'var(--vistara-purple)' }} />
                      <h3 style={{ fontSize: '1.05rem', color: 'var(--deep-violet)', margin: 0 }}>Tujuan Program</h3>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--charcoal)', lineHeight: 1.65, margin: 0 }}>
                      {proker.tujuan}
                    </p>
                  </div>
                )}

                {proker.fungsi && (
                  <div className="card" style={{ background: 'var(--warm-white)', border: '1px solid var(--pale-lilac)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <ShieldCheck size={18} style={{ color: 'var(--royal-purple)' }} />
                      <h3 style={{ fontSize: '1.05rem', color: 'var(--deep-violet)', margin: 0 }}>Fungsi Pokok</h3>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--charcoal)', lineHeight: 1.65, margin: 0 }}>
                      {proker.fungsi}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── BENTUK PELAKSANAAN / KEGIATAN ── */}
            {proker.bentukKegiatan && proker.bentukKegiatan.length > 0 && (
              <div className="card" style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--vistara-purple)' }} />
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--deep-violet)', margin: 0 }}>Bentuk Pelaksanaan Kegiatan</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {proker.bentukKegiatan.map((bk, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={18} style={{ color: '#2E7D32', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.9rem', color: 'var(--charcoal)', lineHeight: 1.6 }}>{bk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── MEKANISME PELAKSANAAN (Jika Ada, misal Kotak Aspirasi) ── */}
            {proker.mekanisme && proker.mekanisme.length > 0 && (
              <div className="card" style={{ marginBottom: '1.75rem', background: 'var(--ghost-purple)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Lightbulb size={18} style={{ color: 'var(--vistara-purple)' }} />
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--deep-violet)', margin: 0 }}>Alur & Mekanisme Pelaksanaan</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {proker.mekanisme.map((mek, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', background: 'white', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--pale-lilac)' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--lavender-mist)', color: 'var(--deep-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0, marginTop: '1px' }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--charcoal)', lineHeight: 1.6 }}>{mek}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── OUTPUT KONKRET & MANFAAT ── */}
            {((proker.outputKonkret && proker.outputKonkret.length > 0) || (proker.manfaat && proker.manfaat.length > 0)) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                {proker.outputKonkret && proker.outputKonkret.length > 0 && (
                  <div className="card" style={{ borderTop: '3px solid var(--vistara-purple)' }}>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--deep-violet)', marginBottom: '0.75rem' }}>Output Konkret</h3>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--charcoal)' }}>
                      {proker.outputKonkret.map((out, idx) => (
                        <li key={idx}>{out}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {proker.manfaat && proker.manfaat.length > 0 && (
                  <div className="card" style={{ borderTop: '3px solid #2E7D32' }}>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--deep-violet)', marginBottom: '0.75rem' }}>Manfaat Utama</h3>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--charcoal)' }}>
                      {proker.manfaat.map((man, idx) => (
                        <li key={idx}>{man}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── CATATAN / SOP KHUSUS ── */}
            {proker.catatan && (
              <div style={{ background: 'rgba(201, 168, 76, 0.12)', border: '1px solid var(--gold-accent)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={20} style={{ color: '#8A6812', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, color: '#8A6812', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Catatan Protokol / Persyaratan
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', margin: '0.25rem 0 0', lineHeight: 1.6 }}>
                    {proker.catatan}
                  </p>
                </div>
              </div>
            )}

            {/* ── GRID METADATA: TIMELINE, TARGET, PELAKSANA, PJ ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0 }}>
                <Clock size={20} style={{ color: 'var(--vistara-purple)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Timeline</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--deep-violet)', wordBreak: 'break-word', lineHeight: 1.35 }}>{proker.timeline}</div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0 }}>
                <Target size={20} style={{ color: 'var(--vistara-purple)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Target Output</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--deep-violet)', wordBreak: 'break-word', lineHeight: 1.35 }}>{proker.targetOutput}</div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0 }}>
                <Users size={20} style={{ color: 'var(--vistara-purple)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Pelaksana / Komisi</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: proker.komisiColor, wordBreak: 'break-word', lineHeight: 1.35 }}>{proker.komisi}</div>
                </div>
              </div>

              {proker.pj && (
                <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0 }}>
                  <ShieldCheck size={20} style={{ color: 'var(--gold-accent)', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid-grey)', marginBottom: '0.25rem' }}>Penanggung Jawab (PJ)</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--deep-violet)', wordBreak: 'break-word', lineHeight: 1.35 }}>{proker.pj}</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── PROGRAM TERKAIT ── */}
            {relatedProkers.length > 0 && (
              <div style={{ borderTop: '1px solid var(--pale-lilac)', paddingTop: '2.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--deep-violet)', marginBottom: '1.25rem' }}>
                  Program Kerja Terkait Lainnya
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {relatedProkers.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/beranda/program-kerja/${rel.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="card" style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <span className="badge" style={{ background: `${rel.komisiColor}18`, color: rel.komisiColor, fontSize: '0.62rem', alignSelf: 'flex-start', marginBottom: '0.4rem' }}>
                          {rel.komisi}
                        </span>
                        <h4 style={{ fontSize: '0.92rem', color: 'var(--deep-violet)', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                          {rel.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--vistara-purple)', fontSize: '0.78rem', fontWeight: 700, marginTop: 'auto' }}>
                          Lihat Program <ArrowRight size={13} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}
