import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, LogOut, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import type { AdminSession } from '../../types';
import { changeOwnAdminPassword } from '../../services/dataClient';
import { validatePasswordStrength } from '../../utils/adminAuth';

interface ForcePasswordChangeProps {
  session: AdminSession;
  mode?: 'forced' | 'optional';
  onSuccess: (updatedSession: AdminSession) => void;
  onLogout?: () => void;
  onCancel?: () => void;
}

export default function ForcePasswordChange({
  session,
  mode = 'forced',
  onSuccess,
  onLogout,
  onCancel,
}: ForcePasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!currentPassword) {
      setError('Masukkan password Anda saat ini.');
      return;
    }

    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    if (newPassword === currentPassword) {
      setError('Password baru tidak boleh sama dengan password saat ini.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await changeOwnAdminPassword(currentPassword, newPassword);
      setSuccessMsg('Password berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {mode === 'forced' ? (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '11px',
            background: '#FFF8E1',
            border: '1px solid #FFE082',
            color: '#8D5B00',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
          }}
        >
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Pembaruan Password Wajib</strong> — Demi keamanan portal, akun{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              @{session.username}
            </span>{' '}
            wajib mengganti password awal sebelum dapat mengakses modul Dashboard Admin.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.76rem',
                color: 'var(--vistara-purple)',
                fontWeight: 700,
              }}
            >
              @{session.username} · {session.jabatan}
            </div>
            <h2 style={{ fontSize: '1.12rem', color: 'var(--deep-violet)', margin: 0 }}>
              Ganti Password Akun
            </h2>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Tutup modal ganti password"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '9px',
                border: '1px solid #E5DDF5',
                background: '#FAF8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '0.7rem 0.9rem',
            borderRadius: '9px',
            background: '#FFEBEE',
            border: '1px solid #FFCDD2',
            color: '#C62828',
            fontSize: '0.82rem',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '0.7rem 0.9rem',
            borderRadius: '9px',
            background: '#E8F5E9',
            border: '1px solid #A5D6A7',
            color: '#2E7D32',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div>
          <label
            htmlFor="pw-current-input"
            style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--deep-violet)',
              marginBottom: '0.35rem',
            }}
          >
            Password Saat Ini *
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--mid-grey)',
              }}
            />
            <input
              id="pw-current-input"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="Masukkan password saat ini..."
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0.55rem 2.6rem 0.55rem 2.4rem',
                borderRadius: '9px',
                border: '1px solid #D4BFEF',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              type="button"
              aria-label={showCurrent ? 'Sembunyikan password saat ini' : 'Tampilkan password saat ini'}
              onClick={() => setShowCurrent((v) => !v)}
              style={{
                position: 'absolute',
                right: '0.3rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                background: 'transparent',
                border: 'none',
                color: 'var(--mid-grey)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="pw-new-input"
            style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--deep-violet)',
              marginBottom: '0.35rem',
            }}
          >
            Password Baru *
          </label>
          <div style={{ position: 'relative' }}>
            <KeyRound
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--mid-grey)',
              }}
            />
            <input
              id="pw-new-input"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="Masukkan password baru..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0.55rem 2.6rem 0.55rem 2.4rem',
                borderRadius: '9px',
                border: '1px solid #D4BFEF',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              type="button"
              aria-label={showNew ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
              onClick={() => setShowNew((v) => !v)}
              style={{
                position: 'absolute',
                right: '0.3rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                background: 'transparent',
                border: 'none',
                color: 'var(--mid-grey)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="pw-confirm-input"
            style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--deep-violet)',
              marginBottom: '0.35rem',
            }}
          >
            Ulangi Password Baru *
          </label>
          <input
            id="pw-confirm-input"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            required
            placeholder="Ketik ulang password baru..."
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0.55rem 0.85rem',
              borderRadius: '9px',
              border: '1px solid #D4BFEF',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          {mode === 'optional' && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline btn-sm"
              style={{ minHeight: '44px', flex: '1 1 120px', justifyContent: 'center' }}
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              minHeight: '44px',
              flex: '2 1 180px',
              justifyContent: 'center',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Menyimpan Password...' : 'Simpan Password Baru'}
          </button>
        </div>
      </form>

      {mode === 'forced' && onLogout && (
        <button
          type="button"
          onClick={onLogout}
          style={{
            minHeight: '42px',
            padding: '0.5rem 0.85rem',
            borderRadius: '9px',
            border: '1px solid #FFCDD2',
            background: '#FFF5F5',
            color: '#C62828',
            fontFamily: 'var(--font-header)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
          }}
        >
          <LogOut size={15} /> Keluar & Kembali ke Login
        </button>
      )}
    </div>
  );

  if (mode === 'optional') {
    return formContent;
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <img src="/logo-vistara.svg" alt="VISTARA" width={32} height={32} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--deep-violet)', lineHeight: 1.1 }}>
              VISTARA Admin
            </div>
            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.74rem', color: 'var(--mid-grey)' }}>
              {session.fullName} · {session.jabatan}
            </div>
          </div>
        </div>

        {formContent}
      </div>
    </div>
  );
}
