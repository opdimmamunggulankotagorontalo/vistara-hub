import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ExternalLink } from 'lucide-react';
import { navItems } from '../../data';

// Nav items split: primary in header, secondary in dropdown
const primaryNav = navItems.slice(0, 5);
const secondaryNav = navItems.slice(5);

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        role="banner"
        className="navbar-root"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 'var(--nav-height)',
          transition: 'background var(--transition-base), box-shadow var(--transition-base)',
          background: scrolled
            ? 'rgba(19, 11, 36, 0.96)'
            : 'linear-gradient(180deg, rgba(19, 11, 36, 0.9) 0%, rgba(19, 11, 36, 0.6) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(185,154,225,0.12)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          {/* Logo + Brand */}
          <Link
            to="/beranda"
            aria-label="VISTARA Hub — Beranda"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', flexShrink: 0 }}
          >
            <img
              src="/logo-vistara.svg"
              alt="Logo VISTARA OPDIM"
              style={{ height: '36px', width: 'auto', filter: 'drop-shadow(0 0 8px rgba(185,154,225,0.4))' }}
            />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'white', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                VISTARA Hub
              </div>
              <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.6rem', color: 'rgba(185,154,225,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}>
                OPDIM · 2026–2027
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Navigasi utama"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}
            className="desktop-nav"
          >
            {primaryNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/beranda'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}

            {/* More dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                id="nav-more-btn"
                aria-haspopup="true"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen(!moreOpen)}
                onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                className="nav-link"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Lainnya
                <ChevronDown size={14} style={{ transition: 'transform var(--transition-fast)', transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {moreOpen && (
                <div
                  role="menu"
                  aria-labelledby="nav-more-btn"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(19, 11, 36, 0.97)',
                    border: '1px solid rgba(185,154,225,0.2)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    minWidth: '160px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    animation: 'fadeInUp 0.15s ease',
                    zIndex: 100,
                  }}
                >
                  {secondaryNav.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      role="menuitem"
                      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                      style={{ display: 'block', padding: '0.5rem 0.75rem', width: '100%' }}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* CTA + Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <Link
              to="/beranda/aspirasi"
              className="btn btn-primary btn-sm"
              style={{ display: 'none' }}
              id="nav-aspirasi-cta"
            >
              Sampaikan Aspirasi
            </Link>

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-btn"
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu navigasi'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-menu-btn"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(185,154,225,0.2)',
                borderRadius: '8px',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <nav
        id="mobile-menu"
        aria-label="Navigasi mobile"
        aria-hidden={!mobileOpen}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          zIndex: 60,
          background: 'linear-gradient(180deg, #130B24 0%, #20113B 100%)',
          borderLeft: '1px solid rgba(185,154,225,0.15)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(185,154,225,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'white' }}>VISTARA Hub</div>
            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.6rem', color: 'rgba(185,154,225,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>OPDIM · 2026–2027</div>
          </div>
          <button
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', minWidth: '44px', minHeight: '44px', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <div style={{ padding: '1rem 0.75rem', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(185,154,225,0.5)', textTransform: 'uppercase', padding: '0 0.75rem', marginBottom: '0.5rem' }}>
            Navigasi
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/beranda'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={{ display: 'block', padding: '0.625rem 0.75rem', marginBottom: '0.25rem', borderRadius: '8px', fontSize: '0.9rem' }}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(185,154,225,0.12)' }}>
          <Link
            to="/beranda/aspirasi"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <ExternalLink size={16} />
            Sampaikan Aspirasi
          </Link>
        </div>
      </nav>

      {/* Responsive CSS for desktop nav */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          #nav-aspirasi-cta { display: inline-flex !important; }
        }
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  );
}
