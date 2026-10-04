import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Building2, User, Trophy } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge } from '../../components/ui';
import { prestasiData } from '../../data';

export default function PrestasiDetail() {
  const { slug } = useParams<{ slug: string }>();
  const item = prestasiData.find((p) => p.slug === slug);

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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            background: 'var(--deep-violet)',
            color: 'white',
            fontWeight: 600,
            textDecoration: 'none',
          }}
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
          {/* Back link */}
          <Link
            to="/beranda/prestasi"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--royal-purple)',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              marginBottom: '2rem',
            }}
          >
            <ArrowLeft size={18} />
            <span>Kembali ke Daftar Prestasi</span>
          </Link>

          {/* Main Card */}
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              border: '1px solid var(--pale-lilac)',
              padding: '2.5rem',
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
                fontSize: '2rem',
                color: 'var(--deep-violet)',
                marginBottom: '2rem',
                lineHeight: 1.3,
              }}
            >
              {item.title}
            </h1>

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

            {/* Narrative / Context */}
            <div style={{ color: 'var(--charcoal)', lineHeight: 1.8, fontSize: '1rem', marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                Pencapaian ini merupakan bukti dedikasi, kerja keras, serta bimbingan intensif civitas akademika Madrasah Aliyah Muhammadiyah Unggulan Kota Gorontalo. Melalui pembinaan komprehensif dari OPDIM VISTARA Komisi 3 (Akademik & Prestasi), siswa didorong untuk mengasah kemampuan hingga tingkat tertinggi.
              </p>
              <p>
                Semoga prestasi membanggakan ini menjadi inspirasi dan pemantik semangat bagi seluruh kader pelajar MAM Unggulan untuk terus berkarya, berkompetisi, dan mengharumkan nama almamater di kancah daerah maupun nasional.
              </p>
            </div>

            {/* Quote banner */}
            <div
              style={{
                borderLeft: '4px solid var(--gold-accent)',
                padding: '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.08), rgba(107, 63, 160, 0.05))',
                borderRadius: '0 12px 12px 0',
                fontStyle: 'italic',
                color: 'var(--deep-violet)',
                fontWeight: 500,
              }}
            >
              &ldquo;Satu Pilihan, Seribu Perubahan — Prestasi diraih dari satu tekad kuat untuk terus belajar dan melampaui batas.&rdquo;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
