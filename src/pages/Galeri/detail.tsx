import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PageHeader } from '../../components/shared/PageHeader';
import { galeriData } from '../../data';
import type { GaleriItem } from '../../types';
import { ScrollReveal } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';
import { fetchGaleri, subscribeToTableChanges } from '../../services/dataClient';

export default function GaleriDetailPage() {
  const { reducedMotion } = useMotionSystem();
  const { slug } = useParams<{ slug: string }>();
  const [albums, setAlbums] = useState<GaleriItem[]>(galeriData);

  useEffect(() => {
    let active = true;
    fetchGaleri().then((items) => {
      if (active) setAlbums(items);
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

  const album = albums.find((g) => g.slug === slug);

  const [showAll, setShowAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const totalCount = album?.imageCount ?? 0;
  const visibleCount = showAll ? totalCount : Math.min(totalCount, 12);
  const photos = Array.from({ length: visibleCount }, (_, i) => i);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % totalCount));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + totalCount) % totalCount));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, totalCount]);

  if (!album) {
    return (
      <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--deep-violet)', marginBottom: '1rem' }}>Album Tidak Ditemukan</h1>
        <Link to="/beranda/galeri" className="btn btn-primary"><ArrowLeft size={16} /> Kembali ke Galeri</Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={album.title}
        subtitle={album.description}
        badge={album.category}
        breadcrumbs={[
          { label: 'Galeri', href: '/beranda/galeri' },
          { label: album.title },
        ]}
      />
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <Link to="/beranda/galeri" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Kembali ke Galeri
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: 'var(--ghost-purple)', borderRadius: '10px', border: '1px solid var(--pale-lilac)' }}>
            <ImageIcon size={16} style={{ color: 'var(--amethyst)' }} />
            <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.875rem', color: 'var(--charcoal)', fontWeight: 600 }}>
              {album.imageCount} foto dalam album ini · Klik foto untuk pratinjau layar penuh
            </span>
          </div>

          {/* Photo grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {photos.map((i) => (
              <ScrollReveal key={i} preset="scaleIn" delay={Math.min((i % 12) * 0.03, 0.2)}>
                <motion.button
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  whileHover={reducedMotion ? undefined : { scale: 1.025 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                  aria-label={`Buka foto ${i + 1} dari ${album.title}`}
                  data-cursor="view"
                  data-cursor-label="Lihat"
                  style={{
                    width: '100%',
                    aspectRatio: i === 0 || i === 4 ? '16/9' : '1/1',
                    gridColumn: i === 0 || i === 4 ? 'span 2' : 'span 1',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, hsl(${260 + (i % 12) * 8}, ${50 + (i % 3) * 5}%, ${18 + (i % 8) * 3}%), hsl(${280 + (i % 12) * 6}, 60%, ${28 + (i % 6) * 2}%))`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    border: 'none',
                  }}
                >
                  <ImageIcon size={28} style={{ color: 'rgba(255,255,255,0.22)' }} />
                  <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', background: 'rgba(15,10,30,0.35)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </motion.button>
              </ScrollReveal>
            ))}
          </div>

          {album.imageCount > 12 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1rem', background: 'var(--ghost-purple)', borderRadius: '10px', border: '1px dashed var(--pale-lilac)' }}>
              <p style={{ fontFamily: 'var(--font-header)', fontSize: '0.875rem', color: 'var(--mid-grey)', margin: '0 0 0.5rem' }}>
                Menampilkan {visibleCount} dari {album.imageCount} foto
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll ? 'Tampilkan Lebih Sedikit' : 'Muat Semua Foto'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Pratinjau foto ${lightboxIndex + 1} dari ${album.imageCount}`}
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 80,
              background: 'rgba(15, 10, 30, 0.88)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <motion.div
              initial={reducedMotion ? false : { scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reducedMotion ? undefined : { scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '760px',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '1px solid rgba(185, 154, 225, 0.28)',
                background: '#1E1138',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
              }}
            >
              <div
                style={{
                  aspectRatio: '16/10',
                  background: `linear-gradient(135deg, hsl(${260 + (lightboxIndex % 12) * 8}, 55%, 22%), hsl(${285 + (lightboxIndex % 12) * 6}, 65%, 34%))`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '2rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label="Tutup pratinjau"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(15, 10, 30, 0.55)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>

                <ImageIcon size={64} style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '0.75rem' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: 'white', textAlign: 'center' }}>
                  {album.title} — Dokumentasi #{String(lightboxIndex + 1).padStart(2, '0')}
                </div>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'rgba(237, 230, 248, 0.75)', marginTop: '0.25rem' }}>
                  {album.category} · Arsip Foto Resmi OPDIM VISTARA
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderTop: '1px solid rgba(185, 154, 225, 0.16)' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + album.imageCount) % album.imageCount)}
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'rgba(237, 230, 248, 0.85)' }}>
                  Foto {lightboxIndex + 1} dari {album.imageCount}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % album.imageCount)}
                >
                  Berikutnya <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
