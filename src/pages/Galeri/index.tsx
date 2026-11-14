import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, EmptyState, LoadingState } from '../../components/ui';
import type { GaleriItem } from '../../types';
import { ScrollReveal, TiltSpotlightCard } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';
import { fetchGaleri, subscribeToTableChanges } from '../../services/dataClient';

function formatDate(d: string) {
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

export default function GaleriPage() {
  const { reducedMotion } = useMotionSystem();
  const [albums, setAlbums] = useState<GaleriItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    let active = true;
    fetchGaleri()
      .then((items) => {
        if (active) setAlbums(items);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsubscribe = subscribeToTableChanges('gallery', () => {
      fetchGaleri().then((items) => {
        if (active) setAlbums(items);
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const categories = ['Semua', ...Array.from(new Set(albums.map((g) => g.category)))];
  const filtered = albums.filter((g) => activeCategory === 'Semua' || g.category === activeCategory);

  return (
    <div>
      <PageHeader
        title="Galeri VISTARA"
        subtitle="Dokumentasi foto dan video kegiatan OPDIM VISTARA 2026–2027."
        breadcrumbs={[{ label: 'Galeri' }]}
      />

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          {/* Category filter */}
          {albums.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className="badge"
                    aria-pressed={isActive}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: 'none',
                      background: isActive ? 'transparent' : 'var(--lavender-mist)',
                      color: isActive ? 'white' : 'var(--royal-purple)',
                      fontFamily: 'var(--font-header)',
                      padding: '0.45rem 1rem',
                    }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="galeri-category-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '100px',
                          background: 'var(--vistara-purple)',
                          zIndex: 0,
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>{cat}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Albums grid */}
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Belum ada album dokumentasi"
              description="Album foto kegiatan yang diunggah oleh Komisi 5 Media & Humas akan tampil di sini."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((album, i) => (
                <ScrollReveal key={album.id} preset="fadeUp" delay={Math.min(i * 0.06, 0.24)}>
                  <article>
                    <Link
                      to={`/beranda/galeri/${album.slug}`}
                      style={{ textDecoration: 'none', display: 'block' }}
                      data-cursor="view"
                      data-cursor-label="Buka"
                    >
                      <TiltSpotlightCard
                        dark
                        maxTilt={6}
                        style={{
                          aspectRatio: '4/3',
                          borderRadius: '14px',
                          background: `linear-gradient(135deg, hsl(${260 + i * 15}, 55%, ${18 + (i % 4) * 6}%), hsl(${280 + i * 15}, 65%, ${28 + (i % 4) * 4}%))`,
                          padding: '1rem',
                          position: 'relative',
                          overflow: 'hidden',
                          marginBottom: '0.875rem',
                          border: 'none',
                        }}
                      >
                        {album.coverImage && (
                          <img
                            src={album.coverImage}
                            alt={album.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Badge variant="ghost" size="sm">{album.category}</Badge>
                            <div style={{ background: 'rgba(0,0,0,0.48)', borderRadius: '6px', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.92)', fontFamily: 'var(--font-header)', fontSize: '0.7rem' }}>
                              <ImageIcon size={11} />{album.imageCount} foto
                            </div>
                          </div>

                          {!album.coverImage && (
                            <motion.div
                              whileHover={reducedMotion ? undefined : { scale: 1.08 }}
                              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.14, pointerEvents: 'none' }}
                            >
                              <ImageIcon size={64} color="white" />
                            </motion.div>
                          )}

                          <div style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(0deg, rgba(15,10,30,0.82) 0%, rgba(15,10,30,0.28) 70%, transparent 100%)', margin: '-1rem', padding: '2rem 1rem 1rem', marginTop: 'auto' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'white', lineHeight: 1.3 }}>{album.title}</div>
                            <div className="tabular-nums" style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.82)', marginTop: '0.25rem' }}>
                              {formatDate(album.date)}
                            </div>
                          </div>
                        </div>
                      </TiltSpotlightCard>
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {album.description}
                      </p>
                      <Link to={`/beranda/galeri/${album.slug}`} style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--vistara-purple)', fontWeight: 600, flexShrink: 0, marginLeft: '0.5rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        Buka <ArrowRight size={12} />
                      </Link>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
