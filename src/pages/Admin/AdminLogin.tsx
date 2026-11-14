import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, User, Eye, EyeOff, Cloud, AlertTriangle, WifiOff } from 'lucide-react';
import type { AdminSession } from '../../types';
import {
  checkAdminBackendDiagnostics,
  loginAdminAccount,
  type AdminAuthDiagnostics,
} from '../../services/dataClient';
import { normalizeUsername } from '../../utils/adminAuth';

interface AdminLoginProps {
  onSuccess: (session: AdminSession) => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState<AdminAuthDiagnostics | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  useEffect(() => {
    let active = true;
    checkAdminBackendDiagnostics()
      .then((res) => {
        if (active) setDiagnostics(res);
      })
      .finally(() => {
        if (active) setCheckingConnection(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = normalizeUsername(username);
    if (!cleanUser || !password) {
      setError('Masukkan username dan password akun pengurus terlebih dahulu.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const session = await loginAdminAccount(cleanUser, password);
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Username atau password tidak sesuai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const diagPalette =
    diagnostics?.mode === 'supabase-ready'
      ? { bg: '#EFFAF1', border: '#BDE5C8', color: '#1E6B34', Icon: Cloud }
      : diagnostics?.mode === 'supabase-unreachable'
        ? { bg: '#FFF5F5', border: '#FFCDD2', color: '#C62828', Icon: WifiOff }
        : { bg: '#FFF8E6', border: '#F5DCA4', color: '#8A5300', Icon: AlertTriangle };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8FF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'white',
          border: '1px solid #E5DDF5',
          borderRadius: '16px',
          padding: 'clamp(1.25rem, 4vw, 2rem)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img src="/logo-vistara.svg" alt="VISTARA" width={32} height={32} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--deep-violet)', lineHeight: 1.1 }}>
                VISTARA Admin
              </div>
              <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--mid-grey)' }}>
                Portal Pengurus OPDIM 2026–2027
              </div>
            </div>
          </div>

          <Link
            to="/beranda"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-header)',
              fontWeight: 600,
              color: 'var(--vistara-purple)',
              minHeight: '36px',
              padding: '0 0.5rem',
            }}
          >
            <ArrowLeft size={14} /> Beranda
          </Link>
        </div>

        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-violet)', marginBottom: '0.35rem' }}>
          Masuk Dashboard Admin
        </h1>
        <p style={{ fontSize: '0.84rem', color: 'var(--mid-grey)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Masuk menggunakan akun pengurus OPDIM yang tersinkron di Supabase Cloud.
        </p>

        {/* Authentication Backend Diagnostics */}
        {checkingConnection ? (
          <div
            style={{
              padding: '0.7rem 0.9rem',
              borderRadius: '10px',
              background: '#FAF8FF',
              border: '1px solid #E5DDF5',
              color: 'var(--mid-grey)',
              fontSize: '0.79rem',
              marginBottom: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Cloud size={15} style={{ color: 'var(--vistara-purple)', flexShrink: 0 }} />
            <span>Memeriksa koneksi database autentikasi...</span>
          </div>
        ) : diagnostics ? (
          <div
            data-auth-mode={diagnostics.mode}
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: '10px',
              background: diagPalette.bg,
              border: `1px solid ${diagPalette.border}`,
              color: diagPalette.color,
              fontSize: '0.79rem',
              marginBottom: '1.1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              lineHeight: 1.45,
            }}
          >
            <diagPalette.Icon size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.8rem' }}>
                {diagnostics.title}
              </div>
              <div style={{ opacity: 0.92, marginTop: '0.15rem' }}>{diagnostics.detail}</div>
            </div>
          </div>
        ) : null}

        {error && (
          <div
            role="alert"
            style={{
              padding: '0.75rem 0.95rem',
              borderRadius: '10px',
              background: '#FFEBEE',
              border: '1px solid #FFCDD2',
              color: '#C62828',
              fontSize: '0.82rem',
              marginBottom: '1.15rem',
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
          <div>
            <label
              htmlFor="admin-username-input"
              style={{
                display: 'block',
                fontFamily: 'var(--font-header)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--deep-violet)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.45rem',
              }}
            >
              Username Akun
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--mid-grey)',
                }}
              />
              <input
                id="admin-username-input"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '46px',
                  padding: '0.65rem 0.9rem 0.65rem 2.55rem',
                  borderRadius: '10px',
                  border: '1px solid #D4BFEF',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.94rem',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password-input"
              style={{
                display: 'block',
                fontFamily: 'var(--font-header)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--deep-violet)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.45rem',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--mid-grey)',
                }}
              />
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukkan password akun..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '46px',
                  padding: '0.65rem 2.75rem 0.65rem 2.55rem',
                  borderRadius: '10px',
                  border: '1px solid #D4BFEF',
                  fontSize: '0.96rem',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '0.35rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '38px',
                  height: '38px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--mid-grey)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: '46px',
              justifyContent: 'center',
              marginTop: '0.25rem',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Memverifikasi Akun...' : 'Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
