import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  BarChart3,
  Newspaper,
  Image as ImageIcon,
  Calendar,
  FolderArchive,
  UserCog,
  Trophy,
  KeyRound,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  Users,
} from 'lucide-react';
import type { AdminModule, AdminSession } from '../../types';
import {
  ADMIN_MODULE_LABELS,
  ADMIN_ROLES_META,
  canAccessModule,
  getDefaultModuleForRole,
} from '../../utils/adminAuth';
import { verifyAdminSession } from '../../services/dataClient';
import AspirasiPanel from './panels/AspirasiPanel';
import PollingPanel from './panels/PollingPanel';
import BeritaPanel from './panels/BeritaPanel';
import GaleriPanel from './panels/GaleriPanel';
import EventsPanel from './panels/EventsPanel';
import ArsipPanel from './panels/ArsipPanel';
import AccountsPanel from './panels/AccountsPanel';
import PrestasiPanel from './panels/PrestasiPanel';
import AnggotaPanel from './panels/AnggotaPanel';
import ForcePasswordChange from './ForcePasswordChange';

interface AdminDashboardProps {
  session: AdminSession;
  onSessionUpdate: (session: AdminSession) => void;
  onLogout: () => void;
}

const MODULE_ICONS: Record<AdminModule, typeof MessageSquare> = {
  events: Calendar,
  arsip: FolderArchive,
  prestasi: Trophy,
  aspirasi: MessageSquare,
  polling: BarChart3,
  berita: Newspaper,
  galeri: ImageIcon,
  anggota: Users,
  accounts: UserCog,
};

const MODULE_DESCRIPTIONS: Record<AdminModule, string> = {
  events: 'Kelola agenda, tanggal, lokasi, dan poster kegiatan resmi OPDIM.',
  arsip: 'Kelola dokumen AD/ART, template proposal, dan LPJ di Pusat Arsip.',
  prestasi: 'Catat dan kelola Hall of Fame prestasi santri & pelajar MAM Unggulan.',
  aspirasi: 'Tinjau laporan aspirasi siswa, perbarui status, dan tulis tanggapan resmi.',
  polling: 'Buat topik jajak pendapat siswa, pantau hasil vote, atau tutup polling.',
  berita: 'Terbitkan dan sunting artikel berita serta dokumentasi humas.',
  galeri: 'Kelola album foto kegiatan dengan optimasi otomatis WebP 1080p.',
  anggota: 'Kelola struktur & foto profil Kepala Madrasah, Pembina, Pengurus Inti, dan 5 Komisi.',
  accounts: 'Buat & ubah username, password, peran, serta jabatan akun admin pengurus.',
};

export default function AdminDashboard({
  session,
  onSessionUpdate,
  onLogout,
}: AdminDashboardProps) {
  const roleMeta = ADMIN_ROLES_META[session.role];
  const allowedModules = roleMeta.allowedModules;

  const [selectedModule, setSelectedModule] = useState<AdminModule>(() =>
    getDefaultModuleForRole(session.role)
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const activeModule = canAccessModule(session.role, selectedModule)
    ? selectedModule
    : getDefaultModuleForRole(session.role);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleSelectModule = (mod: AdminModule) => {
    if (!canAccessModule(session.role, mod)) return;
    setSelectedModule(mod);
    setMobileMenuOpen(false);
  };

  const renderPanel = () => {
    if (!canAccessModule(session.role, activeModule)) {
      return null;
    }
    switch (activeModule) {
      case 'events':
        return <EventsPanel />;
      case 'arsip':
        return <ArsipPanel />;
      case 'prestasi':
        return <PrestasiPanel />;
      case 'aspirasi':
        return <AspirasiPanel />;
      case 'polling':
        return <PollingPanel />;
      case 'berita':
        return <BeritaPanel />;
      case 'galeri':
        return <GaleriPanel />;
      case 'anggota':
        return <AnggotaPanel />;
      case 'accounts':
        return (
          <AccountsPanel
            currentAccountId={session.accountId}
            currentUserRole={session.role}
            onSelfAccountUpdated={() => {
              void verifyAdminSession().then((refreshed) => {
                if (refreshed) onSessionUpdate(refreshed);
              });
            }}
          />
        );
      default:
        return null;
    }
  };

  const ActiveIcon = MODULE_ICONS[activeModule];

  return (
    <div className="admin-shell">
      <style>{`
        .admin-shell {
          min-height: 100vh;
          background: #FAF8FF;
          color: var(--ink);
          display: flex;
          flex-direction: column;
          overflow-x: clip;
        }
        .admin-shell *, .admin-shell *::before, .admin-shell *::after {
          box-sizing: border-box;
        }
        .admin-surface {
          background: #FFFFFF;
          border: 1px solid #E5DDF5;
          border-radius: 12px;
        }
        .admin-form-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .admin-form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .admin-sidebar {
          display: none;
        }
        .admin-mobile-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #E5DDF5;
        }
        .admin-mobile-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.5rem 0.85rem;
          min-height: 56px;
        }
        .admin-mobile-drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 70;
          background: rgba(18, 9, 34, 0.52);
          backdrop-filter: blur(4px);
          display: flex;
        }
        .admin-mobile-drawer-panel {
          width: min(84vw, 310px);
          height: 100%;
          background: #FFFFFF;
          border-right: 1px solid #E5DDF5;
          padding: 1rem 0.9rem 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.9rem;
          overflow-y: auto;
          box-shadow: 12px 0 36px rgba(15, 8, 34, 0.22);
        }
        .admin-main-column {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .admin-desktop-header {
          display: none;
        }
        .admin-workspace {
          width: 100%;
          max-width: 1040px;
          margin: 0 auto;
          padding: 1rem 0.9rem 2.5rem;
        }
        .admin-workspace-intro {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 639px) {
          .admin-form-grid-2,
          .admin-form-grid-3 {
            grid-template-columns: minmax(0, 1fr);
          }
          .admin-kpi-grid {
            gap: 0.5rem !important;
          }
          .admin-kpi-grid > div {
            padding: 0.75rem 0.7rem !important;
          }
        }
        @media (min-width: 1024px) {
          .admin-shell {
            flex-direction: row;
          }
          .admin-sidebar {
            display: flex;
            flex-direction: column;
            width: 268px;
            flex-shrink: 0;
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
            background: #FFFFFF;
            border-right: 1px solid #E5DDF5;
            padding: 1.15rem 1rem;
            justify-content: space-between;
            gap: 1rem;
          }
          .admin-mobile-topbar,
          .admin-mobile-drawer-backdrop {
            display: none;
          }
          .admin-desktop-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 1rem 2rem;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid #E5DDF5;
            position: sticky;
            top: 0;
            z-index: 30;
          }
          .admin-workspace {
            padding: 1.5rem 2rem 3rem;
          }
          .admin-workspace-intro {
            display: none;
          }
        }
      `}</style>

      {/* Desktop Left Sidebar */}
      <aside className="admin-sidebar" aria-label="Navigasi Admin Desktop">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0 0.35rem' }}>
            <img src="/logo-vistara.svg" alt="VISTARA" width={30} height={30} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--deep-violet)', lineHeight: 1.1 }}>
                VISTARA Admin
              </div>
              <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'var(--mid-grey)' }}>
                OPDIM 2026–2027
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: '10px',
              background: '#F5F0FC',
              border: '1px solid #E5DDF5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-header)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--vistara-purple)' }}>
              <Shield size={12} /> {roleMeta.shortLabel}
            </div>
            <div style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--deep-violet)', marginTop: '0.2rem', lineHeight: 1.25 }}>
              {session.fullName}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', marginTop: '0.15rem' }}>
              {session.jabatan} · <span style={{ fontFamily: 'var(--font-mono)' }}>@{session.username}</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {allowedModules.map((mod) => {
              const Icon = MODULE_ICONS[mod];
              const isActive = activeModule === mod;
              const isAccountsBottom = mod === 'accounts';
              return (
                <div
                  key={mod}
                  style={
                    isAccountsBottom
                      ? { marginTop: '0.45rem', paddingTop: '0.5rem', borderTop: '1px solid #EDE6F8' }
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSelectModule(mod)}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      width: '100%',
                      minHeight: '42px',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '10px',
                      border: isActive ? '1px solid #D4BFEF' : '1px solid transparent',
                      background: isActive ? '#F5F0FC' : 'transparent',
                      color: isActive ? 'var(--deep-violet)' : 'var(--charcoal)',
                      fontFamily: 'var(--font-header)',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={17} style={{ color: isActive ? 'var(--vistara-purple)' : 'var(--mid-grey)', flexShrink: 0 }} />
                    <span>{ADMIN_MODULE_LABELS[mod]}</span>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.9rem', borderTop: '1px solid #EDE6F8' }}>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            style={{
              minHeight: '40px',
              padding: '0.45rem 0.8rem',
              borderRadius: '10px',
              border: '1px solid #E5DDF5',
              background: 'white',
              color: 'var(--deep-violet)',
              fontFamily: 'var(--font-header)',
              fontWeight: 600,
              fontSize: '0.81rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span>Ganti Password</span>
            <KeyRound size={14} style={{ color: 'var(--vistara-purple)' }} />
          </button>

          <Link
            to="/beranda"
            style={{
              minHeight: '40px',
              padding: '0.45rem 0.8rem',
              borderRadius: '10px',
              border: '1px solid #E5DDF5',
              background: '#FAF8FF',
              color: 'var(--deep-violet)',
              fontFamily: 'var(--font-header)',
              fontWeight: 600,
              fontSize: '0.81rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
            }}
          >
            <span>Lihat Portal Publik</span>
            <ExternalLink size={14} />
          </Link>

          <button
            type="button"
            onClick={onLogout}
            style={{
              minHeight: '40px',
              padding: '0.45rem 0.8rem',
              borderRadius: '10px',
              border: '1px solid #FFCDD2',
              background: '#FFF5F5',
              color: '#C62828',
              fontFamily: 'var(--font-header)',
              fontWeight: 600,
              fontSize: '0.81rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} /> Keluar Sesi
          </button>
        </div>
      </aside>

      {/* Mobile Compact Header (Opens Slide-In Left Sidebar Drawer) */}
      <header className="admin-mobile-topbar">
        <div className="admin-mobile-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Tutup sidebar menu' : 'Buka sidebar menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                border: '1px solid #E5DDF5',
                background: '#FAF8FF',
                color: 'var(--deep-violet)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.96rem', color: 'var(--deep-violet)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ADMIN_MODULE_LABELS[activeModule]}
              </div>
              <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.71rem', fontWeight: 600, color: 'var(--vistara-purple)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {roleMeta.shortLabel} · @{session.username}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <Link
              to="/beranda"
              aria-label="Lihat Portal Publik"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid #E5DDF5',
                background: 'white',
                color: 'var(--deep-violet)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={16} />
            </Link>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Keluar Sesi Admin"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid #FFCDD2',
                background: '#FFF5F5',
                color: '#C62828',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Left Slide-In Sidebar Drawer */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar Menu Admin"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <aside className="admin-mobile-drawer-panel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <img src="/logo-vistara.svg" alt="VISTARA" width={28} height={28} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.96rem', color: 'var(--deep-violet)', lineHeight: 1.1 }}>
                      VISTARA Admin
                    </div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.68rem', color: 'var(--mid-grey)' }}>
                      OPDIM 2026–2027
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Tutup sidebar menu"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '9px',
                    border: '1px solid #E5DDF5',
                    background: '#FAF8FF',
                    color: 'var(--deep-violet)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: '10px',
                  background: '#F5F0FC',
                  border: '1px solid #E5DDF5',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-header)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--vistara-purple)' }}>
                  <Shield size={12} /> {roleMeta.shortLabel}
                </div>
                <div style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--deep-violet)', marginTop: '0.2rem' }}>
                  {session.fullName}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', marginTop: '0.1rem' }}>
                  {session.jabatan} · <span style={{ fontFamily: 'var(--font-mono)' }}>@{session.username}</span>
                </div>
              </div>

              <nav aria-label="Menu Sidebar Admin Mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {allowedModules.map((mod) => {
                  const Icon = MODULE_ICONS[mod];
                  const isActive = activeModule === mod;
                  const isAccountsBottom = mod === 'accounts';
                  return (
                    <div
                      key={mod}
                      style={
                        isAccountsBottom
                          ? { marginTop: '0.45rem', paddingTop: '0.5rem', borderTop: '1px solid #EDE6F8' }
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectModule(mod)}
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                          width: '100%',
                          minHeight: '44px',
                          padding: '0.5rem 0.8rem',
                          borderRadius: '10px',
                          border: isActive ? '1px solid #D4BFEF' : '1px solid transparent',
                          background: isActive ? '#F5F0FC' : 'transparent',
                          color: isActive ? 'var(--deep-violet)' : 'var(--charcoal)',
                          fontFamily: 'var(--font-header)',
                          fontWeight: isActive ? 700 : 600,
                          fontSize: '0.86rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Icon size={17} style={{ color: isActive ? 'var(--vistara-purple)' : 'var(--mid-grey)', flexShrink: 0 }} />
                        <span>{ADMIN_MODULE_LABELS[mod]}</span>
                      </button>
                    </div>
                  );
                })}
              </nav>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.85rem', borderTop: '1px solid #EDE6F8' }}>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowPasswordModal(true);
                }}
                style={{
                  minHeight: '44px',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid #E5DDF5',
                  background: 'white',
                  color: 'var(--deep-violet)',
                  fontFamily: 'var(--font-header)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>Ganti Password</span>
                <KeyRound size={15} style={{ color: 'var(--vistara-purple)' }} />
              </button>

              <Link
                to="/beranda"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  minHeight: '44px',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid #E5DDF5',
                  background: '#FAF8FF',
                  color: 'var(--deep-violet)',
                  fontFamily: 'var(--font-header)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                }}
              >
                <span>Lihat Portal Publik</span>
                <ExternalLink size={15} />
              </Link>

              <button
                type="button"
                onClick={onLogout}
                style={{
                  minHeight: '44px',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid #FFCDD2',
                  background: '#FFF5F5',
                  color: '#C62828',
                  fontFamily: 'var(--font-header)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={15} /> Keluar Sesi
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="admin-main-column">
        <div className="admin-desktop-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#F5F0FC',
                color: 'var(--vistara-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActiveIcon size={19} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-violet)', margin: 0, lineHeight: 1.2 }}>
                {ADMIN_MODULE_LABELS[activeModule]}
              </h1>
              <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', marginTop: '0.15rem' }}>
                {MODULE_DESCRIPTIONS[activeModule]}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              background: '#F5F0FC',
              border: '1px solid #E5DDF5',
              fontFamily: 'var(--font-header)',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--deep-violet)',
              whiteSpace: 'nowrap',
            }}
          >
            {session.jabatan} · {roleMeta.shortLabel}
          </div>
        </div>

        <main className="admin-workspace">
          <div className="admin-workspace-intro">
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: '#F5F0FC',
                color: 'var(--vistara-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ActiveIcon size={17} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.12rem', fontWeight: 800, color: 'var(--deep-violet)', margin: 0, lineHeight: 1.2 }}>
                {ADMIN_MODULE_LABELS[activeModule]}
              </h1>
            </div>
          </div>

          {renderPanel()}
        </main>
      </div>

      {/* Optional Change Own Password Modal */}
      {showPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ganti Password Akun"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 95,
            background: 'rgba(15, 10, 30, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPasswordModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'white',
              borderRadius: '14px',
              border: '1px solid #E5DDF5',
              padding: '1.25rem',
            }}
          >
            <ForcePasswordChange
              session={session}
              mode="optional"
              onSuccess={(updated) => {
                onSessionUpdate(updated);
                setShowPasswordModal(false);
              }}
              onCancel={() => setShowPasswordModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
