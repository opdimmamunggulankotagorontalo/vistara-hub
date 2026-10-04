import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { galeriData } from '../../data';

export default function GaleriDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const album = galeriData.find(g => g.slug === slug);

  if (!album) {
    return (
      <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--deep-violet)', marginBottom: '1rem' }}>Album Tidak Ditemukan</h1>
        <Link to="/beranda/galeri" className="btn btn-primary"><ArrowLeft size={16} /> Kembali ke Galeri</Link>
      </div>
    );
  }

  // Generate placeholder grid
  const placeholderPhotos = Array.from({ length: album.imageCount > 12 ? 12 : album.imageCount }, (_, i) => i);

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
              {album.imageCount} foto dalam album ini
            </span>
          </div>

          {/* Photo grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {placeholderPhotos.map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: i === 0 || i === 4 ? '16/9' : '1/1',
                  gridColumn: i === 0 || i === 4 ? 'span 2' : 'span 1',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, hsl(${260 + i * 8}, ${50 + (i % 3) * 5}%, ${18 + i * 3}%), hsl(${280 + i * 6}, 60%, ${28 + i * 2}%))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'transform var(--transition-fast)',
                  position: 'relative',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <ImageIcon size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>

          {album.imageCount > 12 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1rem', background: 'var(--ghost-purple)', borderRadius: '10px', border: '1px dashed var(--pale-lilac)' }}>
              <p style={{ fontFamily: 'var(--font-header)', fontSize: '0.875rem', color: 'var(--mid-grey)', margin: '0 0 0.5rem' }}>
                Menampilkan 12 dari {album.imageCount} foto
              </p>
              <button className="btn btn-outline btn-sm">Muat Lebih Banyak (Demo)</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
