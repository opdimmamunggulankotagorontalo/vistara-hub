import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge } from '../../components/ui';
import { beritaData } from '../../data';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
}

const categories = ['Semua', ...Array.from(new Set(beritaData.map(b => b.category)))];

export default function BeritaPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  const filtered = beritaData.filter(b => {
    const matchCat = activeCategory === 'Semua' || b.category === activeCategory;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.excerpt.toLowerCase().includes(search.toLowerCase());
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
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', border: '1.5px solid var(--pale-lilac)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--charcoal)', outline: 'none' }}
                aria-label="Cari berita"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="badge"
                  aria-pressed={activeCategory === cat}
                  style={{ cursor: 'pointer', border: 'none', background: activeCategory === cat ? 'var(--vistara-purple)' : 'var(--lavender-mist)', color: activeCategory === cat ? 'white' : 'var(--royal-purple)', fontFamily: 'var(--font-header)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <p style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--mid-grey)', marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--deep-violet)' }}>{filtered.length}</strong> berita ditemukan
          </p>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filtered.map((berita) => (
              <article key={berita.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Placeholder thumbnail */}
                <div style={{
                  height: '160px',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  background: `linear-gradient(135deg, var(--deep-violet) 0%, var(--vistara-purple) 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <img src="/logo-vistara.svg" alt="" style={{ height: '48px', opacity: 0.25, filter: 'brightness(0) invert(1)' }} />
                </div>

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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--pale-lilac)' }}>
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
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
