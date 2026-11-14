import { Link } from 'react-router-dom';
import { Mail, MapPin, Heart, ArrowUp } from 'lucide-react';
import { motion } from 'motion/react';
import { InstagramIcon } from '../ui/Icons';
import { navItems } from '../../data';
import { useMotionSystem } from '../motion/MotionProvider';
import { ScrollReveal, MagneticWrapper } from '../motion/MotionPrimitives';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const { scrollToTop } = useMotionSystem();

  return (
    <footer
      role="contentinfo"
      className="site-footer"
      style={{
        background: 'linear-gradient(180deg, #0F0A1E 0%, #130B24 100%)',
        borderTop: '1px solid rgba(185,154,225,0.14)',
        paddingTop: '4rem',
        paddingBottom: '1.5rem',
        color: 'rgba(255,255,255,0.7)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top ambient shimmer line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background:
            'linear-gradient(90deg, transparent, rgba(185,154,225,0.45), rgba(230,200,117,0.45), transparent)',
        }}
      />

      <div className="container">
        {/* Main footer grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand Column */}
          <ScrollReveal preset="fadeUp" delay={0}>
            <div style={{ maxWidth: '300px' }}>
              <Link to="/beranda" style={{ display: 'inline-block', marginBottom: '1rem' }}>
                <motion.img
                  whileHover={{ scale: 1.04 }}
                  src="/logo-vistara-full.webp"
                  alt="VISTARA Hub"
                  width={180}
                  height={52}
                  loading="lazy"
                  decoding="async"
                  style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <p
                style={{
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  color: 'rgba(185,154,225,0.8)',
                  marginBottom: '1.25rem',
                }}
              >
                Platform digital resmi OPDIM VISTARA 2026–2027. Satu Pilihan, Seribu Perubahan.
              </p>
              {/* Social Links */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link
                  to="/beranda/kontak"
                  aria-label="Instagram & Sekretariat OPDIM VISTARA"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(185,154,225,0.1)',
                    border: '1px solid rgba(185,154,225,0.18)',
                    color: 'var(--soft-lilac)',
                    textDecoration: 'none',
                  }}
                >
                  <InstagramIcon size={16} />
                </Link>
                <Link
                  to="/beranda/kontak"
                  aria-label="Kontak Resmi OPDIM VISTARA"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(185,154,225,0.1)',
                    border: '1px solid rgba(185,154,225,0.18)',
                    color: 'var(--soft-lilac)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }} aria-hidden="true">💬</span>
                </Link>
                <motion.a
                  href="mailto:opdimmamunggulankotagorontalo@gmail.com"
                  aria-label="Email OPDIM"
                  whileHover={{ y: -3, scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(185,154,225,0.1)',
                    border: '1px solid rgba(185,154,225,0.18)',
                    color: 'var(--soft-lilac)',
                    textDecoration: 'none',
                  }}
                >
                  <Mail size={16} />
                </motion.a>
              </div>
            </div>
          </ScrollReveal>

          {/* Navigation Links */}
          <ScrollReveal preset="fadeUp" delay={0.08}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-header)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--soft-lilac)',
                  marginBottom: '1rem',
                }}
              >
                Navigasi
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.slice(0, 6).map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      style={{
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.65)',
                        textDecoration: 'none',
                        display: 'inline-block',
                        transition: 'color 150ms ease, transform 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--soft-lilac)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* More Links */}
          <ScrollReveal preset="fadeUp" delay={0.14}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-header)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--soft-lilac)',
                  marginBottom: '1rem',
                }}
              >
                Lainnya
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.slice(6).map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      style={{
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.65)',
                        textDecoration: 'none',
                        display: 'inline-block',
                        transition: 'color 150ms ease, transform 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--soft-lilac)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Contact Info */}
          <ScrollReveal preset="fadeUp" delay={0.2}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-header)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--soft-lilac)',
                  marginBottom: '1rem',
                }}
              >
                Kontak
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                  <MapPin size={14} style={{ color: 'var(--soft-lilac)', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    Jl. K. H. Ahmad Dahlan No.1, Limba U I,<br />
                    Kota Gorontalo, Gorontalo 96135
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Mail size={14} style={{ color: 'var(--soft-lilac)', flexShrink: 0 }} />
                  <a
                    href="mailto:opdimmamunggulankotagorontalo@gmail.com"
                    style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', wordBreak: 'break-all' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--soft-lilac)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                    }}
                  >
                    opdimmamunggulankotagorontalo@gmail.com
                  </a>
                </div>
              </div>

              {/* Slogan box */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '0.875rem 1rem',
                  background: 'rgba(107,63,160,0.18)',
                  border: '1px solid rgba(185,154,225,0.2)',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(185,154,225,0.65)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Slogan Resmi
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'white',
                    lineHeight: 1.3,
                  }}
                >
                  &ldquo;Satu Pilihan<br />Seribu Perubahan&rdquo;
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(185,154,225,0.1)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            © {CURRENT_YEAR} OPDIM VISTARA 2026–2027 · MAM Unggulan Kota Gorontalo
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              <span>Dibangun dengan</span>
              <Heart size={12} style={{ color: 'var(--soft-lilac)', fill: 'var(--soft-lilac)' }} />
              <span>oleh Komisi 5 Humas</span>
            </div>

            <MagneticWrapper strength={0.3}>
              <button
                type="button"
                aria-label="Kembali ke atas halaman"
                onClick={() => scrollToTop(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(185,154,225,0.22)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--soft-lilac)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowUp size={13} />
                <span>Ke Atas</span>
              </button>
            </MagneticWrapper>
          </div>
        </div>
      </div>
    </footer>
  );
}
