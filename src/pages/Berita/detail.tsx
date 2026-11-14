import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, LoadingState } from '../../components/ui';
import ShareButtons from '../../components/ui/ShareButtons';
import type { BeritaItem } from '../../types';
import { ScrollReveal, TiltSpotlightCard } from '../../components/motion/MotionPrimitives';
import { fetchBerita, subscribeToTableChanges } from '../../services/dataClient';

function formatDate(d: string) {
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

export default function BeritaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<BeritaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchBerita()
      .then((items) => {
        if (active) setArticles(items);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsubscribe = subscribeToTableChanges('berita', () => {
      fetchBerita().then((items) => {
        if (active) setArticles(items);
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const berita = articles.find((b) => b.slug === slug);
  const related = articles.filter((b) => b.slug !== slug).slice(0, 3);

  if (isLoading) {
    return (
      <div style={{ padding: '6rem 2rem' }}>
        <LoadingState />
      </div>
    );
  }

  if (!berita) {
    return (
      <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--deep-violet)', marginBottom: '1rem' }}>Berita Tidak Ditemukan</h1>
        <Link to="/beranda/berita" className="btn btn-primary"><ArrowLeft size={16} /> Kembali ke Berita</Link>
      </div>
    );
  }

  const bodyParagraphs = (berita.content || '')
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div>
      <PageHeader
        title={berita.title}
        breadcrumbs={[
          { label: 'Berita', href: '/beranda/berita' },
          { label: berita.title },
        ]}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'rgba(185,154,225,0.85)', fontSize: '0.8rem', fontFamily: 'var(--font-header)' }}>
            <Calendar size={13} />{formatDate(berita.date)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'rgba(185,154,225,0.85)', fontSize: '0.8rem', fontFamily: 'var(--font-header)' }}>
            <User size={13} />{berita.author}
          </div>
          <Badge variant="ghost">{berita.category}</Badge>
        </div>
      </PageHeader>

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div className="berita-detail-layout">
            <div style={{ minWidth: 0 }}>
              <Link to="/beranda/berita" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
                <ArrowLeft size={14} /> Semua Berita
              </Link>

              <ScrollReveal preset="scaleIn">
                <div style={{ height: 'clamp(220px, 38vw, 360px)', borderRadius: '16px', background: 'linear-gradient(135deg, var(--deep-violet), var(--vistara-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', overflow: 'hidden' }}>
                  {berita.thumbnail ? (
                    <img
                      src={berita.thumbnail}
                      alt={berita.title}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img src="/logo-vistara.svg" alt="" style={{ height: '72px', opacity: 0.25, filter: 'brightness(0) invert(1)' }} />
                  )}
                </div>
              </ScrollReveal>

              <ScrollReveal preset="fadeUp" delay={0.05}>
                <div className="card">
                  <p style={{ fontSize: '1.05rem', color: 'var(--charcoal)', lineHeight: 1.8, fontWeight: 500, marginBottom: bodyParagraphs.length > 0 ? '1.25rem' : 0, fontStyle: 'italic', borderLeft: '3px solid var(--soft-lilac)', paddingLeft: '1rem' }}>
                    {berita.excerpt}
                  </p>
                  {bodyParagraphs.map((para, index) => (
                    <p
                      key={index}
                      style={{
                        fontSize: '0.95rem',
                        color: 'var(--charcoal)',
                        lineHeight: 1.9,
                        marginBottom: index < bodyParagraphs.length - 1 ? '1rem' : 0,
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </ScrollReveal>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <Tag size={14} style={{ color: 'var(--mid-grey)' }} />
                <Badge variant="ghost">{berita.category}</Badge>
                <Badge variant="outline">OPDIM VISTARA</Badge>
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
                  Bagikan Kabar Ini
                </div>
                <ShareButtons
                  title={berita.title}
                  summary={berita.excerpt}
                  path={`/beranda/berita/${berita.slug}`}
                  tag="Berita OPDIM VISTARA"
                />
              </div>
            </div>

            {/* Sidebar: Related */}
            <div id="berita-sidebar">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--deep-violet)', marginBottom: '1rem' }}>
                Berita Lainnya
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {related.map((r, idx) => (
                  <ScrollReveal key={r.id} preset="slideRight" delay={idx * 0.06}>
                    <Link to={`/beranda/berita/${r.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <TiltSpotlightCard style={{ padding: '0.95rem' }}>
                        <Badge variant="ghost" size="sm">{r.category}</Badge>
                        <div
                          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--deep-violet)', lineHeight: 1.4, marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {r.title}
                        </div>
                      </TiltSpotlightCard>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .berita-detail-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .berita-detail-layout {
            grid-template-columns: minmax(0, 1fr) 280px;
            gap: 3rem;
          }
        }
      `}</style>
    </div>
  );
}
