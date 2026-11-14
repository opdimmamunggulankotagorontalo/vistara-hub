import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, EmptyState } from '../../components/ui';
import { beritaData } from '../../data';
import type { BeritaItem } from '../../types';
import { ScrollReveal, TiltSpotlightCard } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';
import { fetchBerita, subscribeToTableChanges } from '../../services/dataClient';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
}

export default function BeritaPage() {
  const { reducedMotion } = useMotionSystem();
  const [articles, setArticles] = useState<BeritaItem[]>(beritaData);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    let active = true;
    fetchBerita().then((items) => {
      if (active) setArticles(items);
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

  const categories = ['Semua', ...Array.from(new Set(articles.map((b) => b.category)))];

  const filtered = articles.filter((b) => {
    const matchCat = activeCategory === 'Semua' || b.category === activeCategory;
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <PageHeader
        title="Berita VISTARA"
        subtitle="Kabar terkini dari OPDIM VISTARA — kegiatan, pencapaian, dan informasi resmi."
        breadcrumbs={[{ label: 'Berita' }]}
      />

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          {/* Search + Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }} />
              <input
                id="berita-search"
                type="search"
                placeholder="Cari berita..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', border: '1.5px solid var(--pale-lilac)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--charcoal)', outline: 'none', background: 'white' }}
                aria-label="Cari berita"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                      padding: '0.45rem 0.95rem',
                    }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="berita-category-pill"
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
          </div>

          {/* Count */}
          <p style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--mid-grey)', marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--deep-violet)' }}>{filtered.length}</strong> berita ditemukan
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <EmptyState
              title="Berita tidak ditemukan"
              description="Coba ubah kata kunci pencarian atau pilih kategori berita lain."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((berita, idx) => (
                <ScrollReveal key={berita.id} preset="clipUp" delay={Math.min(idx * 0.06, 0.24)}>
                  <TiltSpotlightCard cursorLabel="Baca" style={{ height: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {/* Cover preview */}
                      <motion.div
                        whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          height: '160px',
                          borderRadius: '10px',
                          marginBottom: '1rem',
                          background: 'linear-gradient(135deg, var(--deep-violet) 0%, var(--vistara-purple) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <img src="/logo-vistara.svg" alt="" style={{ height: '48px', opacity: 0.28, filter: 'brightness(0) invert(1)' }} />
                      </motion.div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                        <Badge variant="ghost">{berita.category}</Badge>
                        <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'var(--light-grey)' }}>
                          {formatDate(berita.date)}
                        </span>
                      </div>

                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--deep-violet)', lineHeight: 1.4, marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {berita.title}
                      </h2>

                      <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.6, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                        {berita.excerpt}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--pale-lilac)', marginTop: 'auto' }}>
                        <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--mid-grey)' }}>
                          ✍️ {berita.author}
                        </span>
                        <Link
                          to={`/beranda/berita/${berita.slug}`}
                          style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--vistara-purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                          aria-label={`Baca selengkapnya: ${berita.title}`}
                        >
                          Baca <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </TiltSpotlightCard>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
