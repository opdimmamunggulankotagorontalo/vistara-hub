import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        {/* Mascot / Visual Graphic */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
          <img
            src="/maskot-tara.png"
            alt="Maskot TARA"
            style={{
              height: '140px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 24px rgba(107, 63, 160, 0.25))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-15px',
              background: 'linear-gradient(135deg, var(--gold-accent), var(--royal-purple))',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            404
          </div>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
            color: 'var(--deep-violet)',
            fontWeight: 800,
            marginBottom: '0.75rem',
          }}
        >
          Halaman Tidak Ditemukan
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--mid-grey)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          Waduh! Sepertinya Anda sedang menjelajah rute yang belum dibuka atau tautan telah berpindah. Jangan khawatir, TARA siap memandu Anda kembali ke beranda.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <Link
            to="/beranda"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.8rem 1.6rem',
              borderRadius: '12px',
              background: 'var(--deep-violet)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(45, 27, 105, 0.2)',
            }}
          >
            <Home size={18} />
            <span>Kembali ke Beranda</span>
          </Link>

          <Link
            to="/beranda/program-kerja"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.8rem 1.6rem',
              borderRadius: '12px',
              background: 'white',
              border: '1px solid var(--pale-lilac)',
              color: 'var(--royal-purple)',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
            }}
          >
            <Compass size={18} />
            <span>Jelajahi Program Kerja</span>
          </Link>
        </div>

        {/* Quick Links List */}
        <div
          style={{
            background: 'var(--ghost-purple)',
            borderRadius: '16px',
            border: '1px solid var(--pale-lilac)',
            padding: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--mid-grey)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Rute Cepat Lainnya
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.88rem' }}>
            <Link to="/beranda/tentang" style={{ color: 'var(--royal-purple)', fontWeight: 600, textDecoration: 'none' }}>
              Tentang VISTARA
            </Link>
            <span style={{ color: 'var(--light-grey)' }}>•</span>
            <Link to="/beranda/aspirasi" style={{ color: 'var(--royal-purple)', fontWeight: 600, textDecoration: 'none' }}>
              Suara Aspirasi
            </Link>
            <span style={{ color: 'var(--light-grey)' }}>•</span>
            <Link to="/beranda/berita" style={{ color: 'var(--royal-purple)', fontWeight: 600, textDecoration: 'none' }}>
              Warta & Berita
            </Link>
            <span style={{ color: 'var(--light-grey)' }}>•</span>
            <Link to="/beranda/prestasi" style={{ color: 'var(--royal-purple)', fontWeight: 600, textDecoration: 'none' }}>
              Daftar Prestasi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
