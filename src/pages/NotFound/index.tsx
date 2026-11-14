import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { MagneticWrapper, SplitText } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';

export default function NotFound() {
  const { reducedMotion } = useMotionSystem();

  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '580px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Mascot / Visual Graphic */}
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}
        >
          <img
            src="/maskot-tara.webp"
            alt="Maskot TARA"
            width={140}
            height={140}
            decoding="async"
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
        </motion.div>

        <SplitText
          text="Halaman Tidak Ditemukan"
          as="h1"
          immediate
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            color: 'var(--deep-violet)',
            fontWeight: 800,
            marginBottom: '0.75rem',
          }}
        />

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
          <MagneticWrapper>
            <Link
              to="/beranda"
              className="btn btn-primary"
            >
              <Home size={18} />
              <span>Kembali ke Beranda</span>
            </Link>
          </MagneticWrapper>

          <MagneticWrapper>
            <Link
              to="/beranda/program-kerja"
              className="btn btn-outline"
            >
              <Compass size={18} />
              <span>Jelajahi Program Kerja</span>
            </Link>
          </MagneticWrapper>
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
