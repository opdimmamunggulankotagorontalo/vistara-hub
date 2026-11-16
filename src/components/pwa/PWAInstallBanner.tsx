import { useEffect, useState } from 'react';
import { Bell, Download, Share, X, WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useOnlineStatus, usePWAInstall } from '../../hooks/usePWAInstall';
import {
  getNotificationPermissionState,
  isNotifBannerDismissed,
  requestTaraNotificationPermission,
  setNotifBannerDismissed,
  TARA_NOTIF_ICON,
} from '../../services/taraNotifications';

const PWA_BANNER_DISMISSED_KEY = 'vistara_pwa_banner_dismissed_at_v1';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

function isInstallBannerDismissed(): boolean {
  try {
    const raw = localStorage.getItem(PWA_BANNER_DISMISSED_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(var(--nav-height) + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 48,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.4rem 0.9rem',
        borderRadius: '10px',
        background: '#2D1B69',
        color: '#FAF8FF',
        border: '1px solid rgba(185, 154, 225, 0.35)',
        boxShadow: '0 8px 24px rgba(15, 10, 30, 0.25)',
        fontFamily: 'var(--font-header)',
        fontSize: '0.76rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <WifiOff size={14} style={{ color: '#E6C875' }} />
      <span>Mode Offline — Menampilkan data tersimpan</span>
    </div>
  );
}

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowPrompt(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  const [installDismissed, setInstallDismissed] = useState<boolean>(() => isInstallBannerDismissed());
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermissionState()
  );
  const [notifDismissed, setNotifDismissed] = useState<boolean>(() => isNotifBannerDismissed());
  const [isRequestingNotif, setIsRequestingNotif] = useState(false);

  const canShowInstall = !isInstalled && !installDismissed && (isInstallable || isIOS);
  const canShowNotifPrompt = !canShowInstall && notifPerm === 'default' && !notifDismissed;

  const handleDismissInstall = () => {
    setInstallDismissed(true);
    try {
      localStorage.setItem(PWA_BANNER_DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleEnableNotif = async () => {
    if (isRequestingNotif) return;
    setIsRequestingNotif(true);
    try {
      const next = await requestTaraNotificationPermission();
      setNotifPerm(next);
      if (next !== 'default') {
        setNotifDismissed(true);
      }
    } finally {
      setIsRequestingNotif(false);
    }
  };

  const handleDismissNotif = () => {
    setNotifDismissed(true);
    setNotifBannerDismissed();
  };

  return (
    <>
      <AnimatePresence>
        {showPrompt && (canShowInstall || canShowNotifPrompt) && (
          <motion.div
            initial={{ opacity: 0, y: 64, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            role="region"
            aria-label={canShowInstall ? 'Pasang Aplikasi OPDIM VISTARA' : 'Aktifkan Notifikasi TARA'}
            style={{
              position: 'fixed',
              bottom: 'max(12px, env(safe-area-inset-bottom))',
              left: '12px',
              right: '12px',
              width: 'min(480px, calc(100% - 24px))',
              marginInline: 'auto',
              zIndex: 45,
              background: 'rgba(26, 14, 56, 0.96)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              color: '#FFFFFF',
              border: '1px solid rgba(185, 154, 225, 0.32)',
              borderRadius: '14px',
              padding: '0.55rem 0.65rem',
              boxShadow: '0 12px 32px rgba(15, 10, 30, 0.34)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
            }}
          >
            {canShowInstall ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                  <img
                    src="/pwa-192x192.png"
                    alt="Logo OPDIM VISTARA"
                    width={36}
                    height={36}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      flexShrink: 0,
                      objectFit: 'cover',
                      background: '#FAF8FF',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        color: '#FFFFFF',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Pasang OPDIM VISTARA
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.7rem',
                        color: 'rgba(212, 191, 239, 0.9)',
                        lineHeight: 1.25,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Akses cepat & notifikasi dari TARA
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  {notifPerm === 'default' && !notifDismissed && (
                    <button
                      type="button"
                      onClick={handleEnableNotif}
                      disabled={isRequestingNotif}
                      aria-label="Aktifkan notifikasi TARA"
                      title="Aktifkan notifikasi TARA"
                      style={{
                        minWidth: '40px',
                        minHeight: '40px',
                        borderRadius: '10px',
                        border: '1px solid rgba(185, 154, 225, 0.32)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#E6C875',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Bell size={16} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleInstallClick}
                    style={{
                      minHeight: '40px',
                      padding: '0 0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #845CBC, #6B3FA0)',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-header)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Download size={14} />
                    <span>{isIOS ? 'Cara Pasang' : 'Pasang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDismissInstall}
                    aria-label="Tutup banner pasang aplikasi"
                    style={{
                      minWidth: '40px',
                      minHeight: '40px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'transparent',
                      color: 'rgba(212, 191, 239, 0.8)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                  <img
                    src={TARA_NOTIF_ICON}
                    alt="Maskot TARA"
                    width={36}
                    height={36}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      flexShrink: 0,
                      objectFit: 'cover',
                      background: '#F5F0FC',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        color: '#FFFFFF',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Aktifkan Notifikasi TARA
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.7rem',
                        color: 'rgba(212, 191, 239, 0.9)',
                        lineHeight: 1.25,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Penyemangat harian, info event & libur
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={handleEnableNotif}
                    disabled={isRequestingNotif}
                    style={{
                      minHeight: '40px',
                      padding: '0 0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #845CBC, #6B3FA0)',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-header)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Bell size={14} />
                    <span>{isRequestingNotif ? 'Memproses...' : 'Izinkan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDismissNotif}
                    aria-label="Tutup ajakan notifikasi"
                    style={{
                      minWidth: '40px',
                      minHeight: '40px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'transparent',
                      color: 'rgba(212, 191, 239, 0.8)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari Installation Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 80,
              background: 'rgba(15, 10, 30, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '360px',
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '1.35rem',
                border: '1px solid var(--pale-lilac)',
                boxShadow: '0 20px 50px rgba(15, 10, 30, 0.28)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <img
                  src="/pwa-192x192.png"
                  alt="OPDIM VISTARA"
                  width={44}
                  height={44}
                  style={{ borderRadius: '11px', background: '#FAF8FF' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--deep-violet)' }}>
                    Pasang di iPhone / iPad
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--mid-grey)' }}>
                    Aplikasi OPDIM VISTARA (Safari iOS)
                  </p>
                </div>
              </div>

              <ol
                style={{
                  margin: '0 0 1rem',
                  paddingLeft: '1.25rem',
                  fontSize: '0.84rem',
                  color: 'var(--charcoal)',
                  lineHeight: 1.6,
                }}
              >
                <li>
                  Ketuk tombol <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>Bagikan <Share size={13} /></strong> di bar bawah Safari.
                </li>
                <li>
                  Gulir ke bawah lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                </li>
                <li>
                  Ketuk <strong>Tambah</strong> untuk menampilkan ikon OPDIM VISTARA.
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '44px', justifyContent: 'center' }}
              >
                Mengerti
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
