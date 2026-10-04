import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge } from '../../components/ui';
import { beritaData } from '../../data';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
}

export default function BeritaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const berita = beritaData.find(b => b.slug === slug);
  const related = beritaData.filter(b => b.slug !== slug).slice(0, 3);

  if (!berita) {
    return (
      <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--deep-violet)', marginBottom: '1rem' }}>Berita Tidak Ditemukan</h1>
        <Link to="/beranda/berita" className="btn btn-primary"><ArrowLeft size={16} /> Kembali ke Berita</Link>
      </div>
    );
  }

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'rgba(185,154,225,0.8)', fontSize: '0.8rem', fontFamily: 'var(--font-header)' }}>
            <Calendar size={13} />{formatDate(berita.date)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'rgba(185,154,225,0.8)', fontSize: '0.8rem', fontFamily: 'var(--font-header)' }}>
            <User size={13} />{berita.author}
          </div>
          <Badge variant="ghost">{berita.category}</Badge>
        </div>
      </PageHeader>

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3rem', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '720px' }}>
              <Link to="/beranda/berita" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
                <ArrowLeft size={14} /> Semua Berita
              </Link>

              {/* Thumbnail */}
              <div style={{ height: '280px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--deep-violet), var(--vistara-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', overflow: 'hidden' }}>
                <img src="/logo-vistara.svg" alt="" style={{ height: '72px', opacity: 0.2, filter: 'brightness(0) invert(1)' }} />
              </div>

              {/* Content */}
              <div className="card">
                <p style={{ fontSize: '1.05rem', color: 'var(--charcoal)', lineHeight: 1.8, fontWeight: 500, marginBottom: '1.25rem', fontStyle: 'italic', borderLeft: '3px solid var(--soft-lilac)', paddingLeft: '1rem' }}>
                  {berita.excerpt}
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--charcoal)', lineHeight: 1.9, marginBottom: '1rem' }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--charcoal)', lineHeight: 1.9, marginBottom: '1rem' }}>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--charcoal)', lineHeight: 1.9 }}>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                </p>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <Tag size={14} style={{ color: 'var(--mid-grey)' }} />
                <Badge variant="ghost">{berita.category}</Badge>
                <Badge variant="outline">OPDIM VISTARA</Badge>
                <Badge variant="outline">2026</Badge>
              </div>
            </div>

            {/* Sidebar: Related */}
            <div style={{ width: '260px', flexShrink: 0, display: 'none' }} id="berita-sidebar">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--deep-violet)', marginBottom: '1rem' }}>
                Berita Lainnya
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {related.map(r => (
                  <div key={r.id} className="card" style={{ padding: '0.875rem' }}>
                    <Badge variant="ghost" size="sm">{r.category}</Badge>
                    <Link
                      to={`/beranda/berita/${r.slug}`}
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--deep-violet)', lineHeight: 1.4, marginTop: '0.5rem', textDecoration: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {r.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 1024px) {
          #berita-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  );
}
