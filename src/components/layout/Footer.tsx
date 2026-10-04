import { Link } from 'react-router-dom';
import { Mail, MapPin, Heart } from 'lucide-react';
import { InstagramIcon, YoutubeIcon } from '../ui/Icons';
import { navItems } from '../../data';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {

  return (
    <footer
      role="contentinfo"
      style={{
        background: 'linear-gradient(180deg, #0F0A1E 0%, #130B24 100%)',
        borderTop: '1px solid rgba(185,154,225,0.1)',
        paddingTop: '4rem',
        paddingBottom: '1.5rem',
        color: 'rgba(255,255,255,0.7)',
      }}
    >
      <div className="container">
        {/* Main footer grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem',
        }}>
          {/* Brand Column */}
          <div style={{ maxWidth: '300px' }}>
            <Link to="/beranda" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <img src="/logo-vistara-full.png" alt="VISTARA Hub" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
            </Link>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'rgba(185,154,225,0.8)', marginBottom: '1.25rem' }}>
              Platform digital resmi OPDIM VISTARA 2026–2027. Satu Pilihan, Seribu Perubahan.
            </p>
            {/* Social Links */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { icon: <InstagramIcon size={16} />, label: 'Instagram OPDIM VISTARA', href: '#' },
                { icon: <YoutubeIcon size={16} />, label: 'YouTube OPDIM VISTARA', href: '#' },
                { icon: <Mail size={16} />, label: 'Email OPDIM', href: 'mailto:opdim.vistara@mamunggulan.sch.id' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(185,154,225,0.1)',
                    border: '1px solid rgba(185,154,225,0.15)',
                    color: 'var(--soft-lilac)',
                    transition: 'all var(--transition-fast)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(107,63,160,0.4)';
                    (e.currentTarget as HTMLElement).style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(185,154,225,0.1)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--soft-lilac)';
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--soft-lilac)', marginBottom: '1rem' }}>
              Navigasi
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navItems.slice(0, 6).map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color var(--transition-fast)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--soft-lilac)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Links */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--soft-lilac)', marginBottom: '1rem' }}>
              Lainnya
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navItems.slice(6).map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color var(--transition-fast)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--soft-lilac)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--soft-lilac)', marginBottom: '1rem' }}>
              Kontak
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                <MapPin size={14} style={{ color: 'var(--soft-lilac)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  Madrasah Aliyah Muhammadiyah Unggulan,<br />
                  Kota Gorontalo, Gorontalo
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Mail size={14} style={{ color: 'var(--soft-lilac)', flexShrink: 0 }} />
                <a
                  href="mailto:opdim.vistara@mamunggulan.sch.id"
                  style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--soft-lilac)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
                >
                  opdim.vistara@mamunggulan.sch.id
                </a>
              </div>
            </div>

            {/* Slogan box */}
            <div style={{
              marginTop: '1.5rem',
              padding: '0.875rem 1rem',
              background: 'rgba(107,63,160,0.15)',
              border: '1px solid rgba(185,154,225,0.15)',
              borderRadius: '10px',
            }}>
              <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(185,154,225,0.6)', marginBottom: '0.25rem' }}>
                Slogan Resmi
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'white', lineHeight: 1.3 }}>
                "Satu Pilihan<br />Seribu Perubahan"
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(185,154,225,0.08)',
          paddingTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            © {CURRENT_YEAR} OPDIM VISTARA 2026–2027 · MAM Unggulan Kota Gorontalo · VISTARA Hub v1.0
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
            <span>Dibangun dengan</span>
            <Heart size={12} style={{ color: 'var(--soft-lilac)', fill: 'var(--soft-lilac)' }} />
            <span>oleh Komisi 5 Humas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
