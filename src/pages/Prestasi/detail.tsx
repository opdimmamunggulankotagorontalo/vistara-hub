import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Building2, User, Trophy } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, LoadingState } from '../../components/ui';
import ShareButtons from '../../components/ui/ShareButtons';
import RichTextRenderer from '../../components/ui/RichTextRenderer';
import type { PrestasiItem } from '../../types';
import { fetchPrestasiBySlug, subscribeToTableChanges } from '../../services/dataClient';
import { ScrollReveal } from '../../components/motion/MotionPrimitives';

export default function PrestasiDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<PrestasiItem | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }
      void fetchPrestasiBySlug(slug)
        .then((found) => {
          if (active) setItem(found);
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
  }, [slug]);

  if (isLoading) {
    return (
      <div className="section-padding">
        <div className="container">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="section-padding" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Trophy size={48} style={{ color: 'var(--mid-grey)', marginBottom: '1rem' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--deep-violet)', marginBottom: '0.5rem' }}>
          Prestasi Tidak Ditemukan
        </h2>
        <p style={{ color: 'var(--mid-grey)', marginBottom: '1.5rem' }}>
          Data prestasi yang Anda cari tidak tersedia atau URL salah.
        </p>
        <Link
          to="/beranda/prestasi"
          className="btn btn-primary"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Prestasi</span>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={item.title}
        subtitle={`Dianugerahkan kepada ${item.peraih} pada tahun ${item.tahun}.`}
        badge={`Tingkat ${item.tingkat}`}
        breadcrumbs={[
          { label: 'Beranda', href: '/beranda' },
          { label: 'Prestasi', href: '/beranda/prestasi' },
          { label: item.title },
        ]}
      />

      <div className="section-padding">
        <div className="container" style={{ maxWidth: '900px' }}>
          <Link
            to="/beranda/prestasi"
            className="btn btn-outline btn-sm"
            style={{ marginBottom: '2rem', display: 'inline-flex' }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Prestasi</span>
          </Link>

          <ScrollReveal preset="blurIn">
            <div
              className="card"
              style={{
                borderRadius: '20px',
                padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                boxShadow: '0 8px 32px rgba(45, 27, 105, 0.06)',
                marginBottom: '2rem',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Badge variant="gold">Tingkat {item.tingkat.toUpperCase()}</Badge>
                <Badge variant="purple">{item.kategori}</Badge>
                <Badge variant="outline">Tahun {item.tahun}</Badge>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  color: 'var(--deep-violet)',
                  marginBottom: '2rem',
                  lineHeight: 1.3,
                }}
              >
                {item.title}
              </h1>

              {item.thumbnail && (
                <div
                  style={{
                    height: 'clamp(200px, 34vw, 320px)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    marginBottom: '1.75rem',
                    border: '1px solid var(--pale-lilac)',
                    background: 'var(--ghost-purple)',
                  }}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Info Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.5rem',
                  padding: '1.5rem',
                  background: 'var(--ghost-purple)',
                  borderRadius: '16px',
                  border: '1px solid var(--pale-lilac)',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--royal-purple)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mid-grey)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peraih Penghargaan</div>
                    <div style={{ fontWeight: 700, color: 'var(--deep-violet)' }}>{item.peraih}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vistara-purple)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mid-grey)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Penyelenggara</div>
                    <div style={{ fontWeight: 700, color: 'var(--deep-violet)' }}>{item.penyelenggara}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mid-grey)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tahun Prestasi</div>
                    <div style={{ fontWeight: 700, color: 'var(--deep-violet)' }}>{item.tahun}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                {item.description && item.description.trim() ? (
                  <RichTextRenderer content={item.description} />
                ) : (
                  <div style={{ color: 'var(--charcoal)', lineHeight: 1.8, fontSize: '1rem' }}>
                    <p style={{ marginBottom: '1rem' }}>
                      Pencapaian ini merupakan bukti dedikasi, kerja keras, serta bimbingan intensif civitas akademika Madrasah Aliyah Muhammadiyah Unggulan Kota Gorontalo. Melalui pembinaan komprehensif OPDIM VISTARA, siswa didorong untuk mengasah potensi hingga tingkat tertinggi.
                    </p>
                    <p>
                      Semoga prestasi membanggakan ini menjadi inspirasi dan pemantik semangat bagi seluruh kader pelajar MAM Unggulan untuk terus berkarya, berkompetisi, dan mengharumkan nama almamater di kancah daerah maupun nasional.
                    </p>
                  </div>
                )}
              </div>

              <div
                style={{
                  border: '1px solid rgba(201, 168, 76, 0.35)',
                  padding: '1.15rem 1.35rem',
                  background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.08), rgba(107, 63, 160, 0.04))',
                  borderRadius: '12px',
                  fontStyle: 'italic',
                  color: 'var(--deep-violet)',
                  fontWeight: 500,
                }}
              >
                &ldquo;Satu Pilihan, Seribu Perubahan — Prestasi diraih dari satu tekad kuat untuk terus belajar dan melampaui batas.&rdquo;
              </div>

              <div
                style={{
                  marginTop: '1.75rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--pale-lilac)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--mid-grey)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Bagikan Kabar Prestasi Ini
                </div>
                <ShareButtons
                  title={item.title}
                  summary={`Diraih oleh ${item.peraih} (${item.penyelenggara}, ${item.tahun})`}
                  path={`/beranda/prestasi/${item.slug}`}
                  tag={`Prestasi ${item.tingkat}`}
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
