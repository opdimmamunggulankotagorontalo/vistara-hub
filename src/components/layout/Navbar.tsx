import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { navItems } from '../../data';
import GlobalSearch from './GlobalSearch';

const primaryNav = navItems.slice(0, 5);
const secondaryNav = navItems.slice(5);

interface NavbarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export default function Navbar({
  mobileOpen: controlledMobileOpen,
  onMobileOpenChange,
}: NavbarProps) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileOpen = controlledMobileOpen ?? internalMobileOpen;
  const setMobileOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(mobileOpen) : next;
    if (onMobileOpenChange) {
      onMobileOpenChange(resolved);
    } else {
      setInternalMobileOpen(resolved);
    }
  };

  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [moreOpen]);

  const isSecondaryActive = secondaryNav.some((item) => location.pathname.startsWith(item.href));

  return (
    <>
      <motion.header
        role="banner"
        className="navbar-root"
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 'var(--nav-height)',
          transition: 'background 260ms ease, box-shadow 260ms ease, border-color 260ms ease',
          background: scrolled
            ? 'rgba(30, 15, 62, 0.94)'
            : 'linear-gradient(180deg, rgba(45, 27, 105, 0.95) 0%, rgba(36, 18, 66, 0.85) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(185,154,225,0.22)'
            : '1px solid rgba(185,154,225,0.08)',
          boxShadow: scrolled ? '0 8px 30px rgba(15, 8, 34, 0.42)' : 'none',
        }}
      >
        <div
          className="container"
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Zone 1: Logo + Brand */}
          <Link
            to="/beranda"
            aria-label="VISTARA Hub — Beranda"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <motion.img
              src="/logo-vistara.svg"
              alt="Logo VISTARA OPDIM"
              width={34}
              height={34}
              decoding="async"
              whileHover={{ rotate: [0, -6, 4, 0], scale: 1.06 }}
              transition={{ duration: 0.45 }}
              style={{
                height: '32px',
                width: 'auto',
                filter: 'drop-shadow(0 0 8px rgba(185,154,225,0.4))',
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'white',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                }}
              >
                VISTARA Hub
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.58rem',
                  color: 'rgba(185,154,225,0.82)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
                OPDIM · 2026–2027
              </div>
            </div>
          </Link>

          {/* Zone 2: Desktop Navigation */}
          <nav
            aria-label="Navigasi utama"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              flex: 1,
              justifyContent: 'center',
              minWidth: 0,
            }}
            className="desktop-nav"
          >
            {primaryNav.map((item) => {
              const isEnd = item.href === '/beranda';
              const active = isEnd
                ? location.pathname === '/beranda'
                : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={isEnd}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  style={{ position: 'relative' }}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active-underline"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      style={{
                        position: 'absolute',
                        left: '0.65rem',
                        right: '0.65rem',
                        bottom: '2px',
                        height: '2px',
                        borderRadius: '2px',
                        background:
                          'linear-gradient(90deg, var(--soft-lilac), var(--gold-soft))',
                      }}
                    />
                  )}
                </NavLink>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                id="nav-more-btn"
                aria-haspopup="true"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((prev) => !prev)}
                className={`nav-link${isSecondaryActive ? ' active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: isSecondaryActive ? 'rgba(185, 154, 225, 0.16)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Lainnya
                <ChevronDown
                  size={14}
                  style={{
                    transition: 'transform 180ms ease',
                    transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    role="menu"
                    aria-labelledby="nav-more-btn"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.55rem)',
                      left: '50%',
                      x: '-50%',
                      background: 'rgba(19, 11, 36, 0.97)',
                      border: '1px solid rgba(185,154,225,0.24)',
                      borderRadius: '14px',
                      padding: '0.5rem',
                      minWidth: '176px',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 20px 44px rgba(0,0,0,0.55)',
                      zIndex: 100,
                    }}
                  >
                    {secondaryNav.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        style={{ display: 'block', padding: '0.5rem 0.75rem', width: '100%' }}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Zone 3: Global Search + Primary CTA + Mobile Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <div className="desktop-search-slot" style={{ display: 'none' }}>
              <GlobalSearch mode="desktop" />
            </div>

            <Link
              to="/beranda/aspirasi"
              className="btn btn-primary btn-sm"
              style={{ display: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
              id="nav-aspirasi-cta"
            >
              Sampaikan Aspirasi
            </Link>

            {/* Mobile search trigger */}
            <div className="mobile-search-slot">
              <GlobalSearch mode="mobile-button" />
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              id="mobile-menu-btn"
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu navigasi'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="mobile-menu-btn"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(185,154,225,0.22)',
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
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mobile-menu-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

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
          width: '290px',
          maxWidth: '86vw',
          zIndex: 60,
          background: 'linear-gradient(180deg, #2D1B69 0%, #1A0E33 100%)',
          borderLeft: '1px solid rgba(185,154,225,0.18)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          pointerEvents: mobileOpen ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.25rem',
            borderBottom: '1px solid rgba(185,154,225,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'white' }}>
              VISTARA Hub
            </div>
            <div
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '0.6rem',
                color: 'rgba(185,154,225,0.7)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              OPDIM · 2026–2027
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              minWidth: '44px',
              minHeight: '44px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Search Bar */}
        <div style={{ padding: '0.9rem 1rem 0.25rem' }}>
          <GlobalSearch mode="drawer" onNavigate={() => setMobileOpen(false)} />
        </div>

        {/* Nav Links */}
        <div style={{ padding: '0.75rem', flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              color: 'rgba(185,154,225,0.5)',
              textTransform: 'uppercase',
              padding: '0 0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            Navigasi
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/beranda'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={{
                display: 'block',
                padding: '0.625rem 0.75rem',
                marginBottom: '0.25rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(185,154,225,0.12)' }}>
          <Link
            to="/beranda/aspirasi"
            onClick={() => setMobileOpen(false)}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <ExternalLink size={16} />
            Sampaikan Aspirasi
          </Link>
        </div>
      </nav>

      {/* Responsive CSS for desktop nav & search */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .desktop-search-slot { display: block !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-search-slot { display: none !important; }
          #nav-aspirasi-cta { display: inline-flex !important; }
        }
        @media (max-width: 1200px) and (min-width: 1024px) {
          .desktop-nav .nav-link { padding: 0.4rem 0.5rem; font-size: 0.82rem; }
        }
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
          .desktop-search-slot { display: none !important; }
        }
      `}</style>
    </>
  );
}
