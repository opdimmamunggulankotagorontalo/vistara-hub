import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge } from '../../components/ui';
import { galeriData } from '../../data';

const categories = ['Semua', ...Array.from(new Set(galeriData.map(g => g.category)))];

export default function GaleriPage() {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const filtered = galeriData.filter(g => activeCategory === 'Semua' || g.category === activeCategory);

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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="badge"
                aria-pressed={activeCategory === cat}
                style={{ cursor: 'pointer', border: 'none', background: activeCategory === cat ? 'var(--vistara-purple)' : 'var(--lavender-mist)', color: activeCategory === cat ? 'white' : 'var(--royal-purple)', fontFamily: 'var(--font-header)', padding: '0.4rem 1rem' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Albums grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {filtered.map((album, i) => (
              <article key={album.id}>
                <Link to={`/beranda/galeri/${album.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    style={{
                      aspectRatio: '4/3',
                      borderRadius: '14px',
                      background: `linear-gradient(135deg, hsl(${260 + i * 15}, 55%, ${18 + i * 6}%), hsl(${280 + i * 15}, 65%, ${28 + i * 4}%))`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
                      marginBottom: '0.875rem',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(45,27,105,0.35)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Badge variant="ghost" size="sm">{album.category}</Badge>
                      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-header)', fontSize: '0.7rem' }}>
                        <ImageIcon size={11} />{album.imageCount} foto
                      </div>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                      <ImageIcon size={64} color="white" />
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)', margin: '-1rem', padding: '1.5rem 1rem 1rem' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'white', lineHeight: 1.3 }}>{album.title}</div>
                      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
                        {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(album.date))}
                      </div>
                    </div>
                  </div>
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
