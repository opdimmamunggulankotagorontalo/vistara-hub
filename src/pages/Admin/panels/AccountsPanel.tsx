import { useEffect, useState } from 'react';
import {
  UserPlus,
  Users,
  Shield,
  KeyRound,
  Trash2,
  Power,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Pencil,
  Lock,
} from 'lucide-react';
import type { AdminAccount, AdminRole } from '../../../types';
import {
  createAdminAccount,
  deleteAdminAccount,
  fetchAdminAccounts,
  updateAdminAccount,
} from '../../../services/dataClient';
import {
  ADMIN_ROLES_META,
  normalizeUsername,
  validatePasswordStrength,
  validateUsernameFormat,
} from '../../../utils/adminAuth';
import { EmptyState, LoadingState } from '../../../components/ui';

interface AccountsPanelProps {
  currentAccountId: string;
  currentUserRole: AdminRole;
  onSelfAccountUpdated?: () => void;
}

const ROOT_ASSIGNABLE_ROLES: AdminRole[] = ['inti', 'komisi4', 'komisi5', 'root'];
const INTI_ASSIGNABLE_ROLES: AdminRole[] = ['inti', 'komisi4', 'komisi5'];

function formatTimestamp(ts: number | string | null | undefined): string {
  if (!ts) return 'Belum pernah masuk';
  const parsed = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export default function AccountsPanel({
  currentAccountId,
  currentUserRole,
  onSelfAccountUpdated,
}: AccountsPanelProps) {
  const isRootActor = currentUserRole === 'root';
  const assignableRoles = isRootActor ? ROOT_ASSIGNABLE_ROLES : INTI_ASSIGNABLE_ROLES;

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStructureRef, setShowStructureRef] = useState(false);

  // Create form state (strictly free-text, without password minimum length)
  const [fullName, setFullName] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [role, setRole] = useState<AdminRole>('inti');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Edit modal state (username, fullName, jabatan, role, optional password)
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('inti');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editForceChange, setEditForceChange] = useState(false);

  // Quick Reset Password modal
  const [resetTarget, setResetTarget] = useState<AdminAccount | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetForceChange, setResetForceChange] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [modalError, setModalError] = useState('');
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAdminAccounts()
      .then((list) => {
        if (active) setAccounts(list);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const showSuccess = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  const resetCreateForm = () => {
    setFullName('');
    setJabatan('');
    setRole('inti');
    setUsername('');
    setPassword('');
    setMustChangePassword(true);
    setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim() || !jabatan.trim()) {
      setFormError('Nama lengkap dan jabatan pengurus wajib diisi.');
      return;
    }

    const userErr = validateUsernameFormat(username);
    if (userErr) {
      setFormError(userErr);
      return;
    }

    const pwErr = validatePasswordStrength(password);
    if (pwErr) {
      setFormError(pwErr);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createAdminAccount({
        username: normalizeUsername(username),
        fullName: fullName.trim(),
        jabatan: jabatan.trim(),
        role,
        password,
        mustChangePassword,
      });
      setAccounts((prev) => [...prev, created]);
      setShowCreateForm(false);
      resetCreateForm();
      showSuccess(`Akun @${created.username} (${created.jabatan}) berhasil dibuat.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal membuat akun baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (acc: AdminAccount) => {
    if (acc.id === currentAccountId) return;
    if (!isRootActor && acc.role === 'root') return;
    try {
      const updated = await updateAdminAccount(acc.id, { isActive: !acc.isActive });
      setAccounts((prev) => prev.map((a) => (a.id === acc.id ? updated : a)));
      showSuccess(
        `Akun @${acc.username} ${updated.isActive ? 'diaktifkan kembali' : 'dinonaktifkan'}.`
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengubah status akun.');
    }
  };

  const openEditModal = (acc: AdminAccount) => {
    if (!isRootActor && acc.role === 'root') return;
    setEditingAccount(acc);
    setEditUsername(acc.username);
    setEditFullName(acc.fullName);
    setEditJabatan(acc.jabatan);
    setEditRole(acc.role);
    setEditNewPassword('');
    setShowEditPassword(false);
    setEditForceChange(acc.mustChangePassword);
    setModalError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const userErr = validateUsernameFormat(editUsername);
    if (userErr) {
      setModalError(userErr);
      return;
    }
    if (!editFullName.trim() || !editJabatan.trim()) {
      setModalError('Nama lengkap dan jabatan tidak boleh kosong.');
      return;
    }
    if (editNewPassword) {
      const pwErr = validatePasswordStrength(editNewPassword);
      if (pwErr) {
        setModalError(pwErr);
        return;
      }
    }

    setIsModalSaving(true);
    setModalError('');
    try {
      const updated = await updateAdminAccount(editingAccount.id, {
        username: normalizeUsername(editUsername),
        fullName: editFullName.trim(),
        jabatan: editJabatan.trim(),
        role: editRole,
        ...(editNewPassword ? { newPassword: editNewPassword } : {}),
        mustChangePassword: editForceChange,
      });
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (updated.id === currentAccountId) {
        onSelfAccountUpdated?.();
      }
      setEditingAccount(null);
      showSuccess(`Akun @${updated.username} berhasil diperbarui.`);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan akun.');
    } finally {
      setIsModalSaving(false);
    }
  };

  const openResetModal = (acc: AdminAccount) => {
    if (!isRootActor && acc.role === 'root') return;
    setResetTarget(acc);
    setResetPasswordVal('');
    setResetForceChange(true);
    setShowResetPassword(false);
    setModalError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    const pwErr = validatePasswordStrength(resetPasswordVal);
    if (pwErr) {
      setModalError(pwErr);
      return;
    }
    setIsModalSaving(true);
    setModalError('');
    try {
      const updated = await updateAdminAccount(resetTarget.id, {
        newPassword: resetPasswordVal,
        mustChangePassword: resetForceChange,
      });
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setResetTarget(null);
      showSuccess(`Password akun @${updated.username} berhasil diatur ulang.`);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Gagal mengatur ulang password.');
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleConfirmDelete = async (acc: AdminAccount) => {
    if (acc.id === currentAccountId) return;
    if (!isRootActor && acc.role === 'root') return;
    await deleteAdminAccount(acc.id);
    setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
    setConfirmDeleteId(null);
    showSuccess('Akun pengurus telah dihapus permanen.');
  };

  const activeCount = accounts.filter((a) => a.isActive).length;
  const pendingPwCount = accounts.filter((a) => a.mustChangePassword).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* KPI Strip */}
      <div
        className="admin-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div className="admin-surface" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
            Total Akun
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-violet)', marginTop: '0.15rem' }}>
            {accounts.length}
          </div>
        </div>
        <div className="admin-surface" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
            Akun Aktif
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2E7D32', marginTop: '0.15rem' }}>
            {activeCount}
          </div>
        </div>
        <div className="admin-surface" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
            Wajib Ganti PW
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--vistara-purple)', marginTop: '0.15rem' }}>
            {pendingPwCount}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          {isRootActor
            ? 'Buat & ubah akun login pengurus OPDIM (username, password bebas panjang karakter, peran, dan jabatan).'
            : 'Buat & ubah akun pengurus non-root OPDIM (username, password bebas panjang karakter, peran, dan jabatan).'}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowStructureRef((v) => !v)}
            className="btn btn-outline btn-sm"
            style={{ minHeight: '42px' }}
          >
            <Users size={15} />
            <span>Referensi Struktur</span>
            {showStructureRef ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (showCreateForm) {
                setShowCreateForm(false);
                resetCreateForm();
              } else {
                resetCreateForm();
                setShowCreateForm(true);
              }
            }}
            className="btn btn-primary btn-sm"
            style={{ minHeight: '42px' }}
          >
            {showCreateForm ? <><X size={15} /> Tutup Form</> : <><UserPlus size={15} /> Buat Akun Pengurus</>}
          </button>
        </div>
      </div>

      {/* Collapsible Official Structure Reference */}
      {showStructureRef && (
        <div
          className="admin-surface"
          style={{
            padding: '1rem 1.1rem',
            background: '#FAF8FF',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--deep-violet)' }}>
            Panduan Struktur Resmi OPDIM VISTARA 2026–2027
          </div>
          <div className="admin-form-grid-3" style={{ fontSize: '0.8rem', color: 'var(--charcoal)', lineHeight: 1.55 }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '9px', border: '1px solid #E5DDF5' }}>
              <div style={{ fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.25rem' }}>
                Pengurus Inti (Ketua & Sekretaris)
              </div>
              <div>• Ketua OPDIM: Muhamad Aryansyah Thaib</div>
              <div>• Wakil Ketua: Khansa Salsabila Azzahra</div>
              <div>• Sekretaris: Muhammad Yusuf Lauma</div>
              <div>• Bendahara: Alifia Salsabila Kasim</div>
              <div>• Korlap: Muhammad Akmal Karsimin</div>
            </div>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '9px', border: '1px solid #E5DDF5' }}>
              <div style={{ fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.25rem' }}>
                Komisi 4 — Aspirasi Siswa
              </div>
              <div>• Ketua Komisi: Nailah Syaqilah Husain</div>
              <div>• Anggota: Ain Tahir, Aisyah Karimah</div>
            </div>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '9px', border: '1px solid #E5DDF5' }}>
              <div style={{ fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.25rem' }}>
                Komisi 5 — Media & Humas
              </div>
              <div>• Ketua Komisi: Ihsan Abdussalam Ma&apos;ruf</div>
              <div>• Anggota: Rafika Devi Sekar Sari, Rafael Ahmad Baihaqih Djafara, Sulaiman Nul Ihza D. Hasan, Razwa Raihana Maabu</div>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.7rem 0.95rem',
            borderRadius: '10px',
            background: '#E8F5E9',
            border: '1px solid #A5D6A7',
            color: '#2E7D32',
            fontSize: '0.84rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Free-Text Create Account Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="admin-surface"
          style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--deep-violet)', margin: 0 }}>
            Buat Akun Pengurus Baru
          </h3>

          {formError && (
            <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>
              {formError}
            </div>
          )}

          <div className="admin-form-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Nama Lengkap Pengurus *
              </label>
              <input
                type="text"
                required
                placeholder="Ketik nama lengkap pengurus..."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Jabatan Organisasi *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ketua OPDIM / Sekretaris / Ketua Komisi 4..."
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div className="admin-form-grid-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Hak Akses Divisi *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ADMIN_ROLES_META[r].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Username Login *
              </label>
              <input
                type="text"
                required
                autoCapitalize="none"
                placeholder="Contoh: ketua.opdim"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Password Awal *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCreatePassword ? 'text' : 'password'}
                  required
                  placeholder="Bebas panjang karakter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 2.5rem 0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
                />
                <button
                  type="button"
                  aria-label={showCreatePassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowCreatePassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '0.25rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--mid-grey)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {showCreatePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.83rem', color: 'var(--charcoal)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={mustChangePassword}
              onChange={(e) => setMustChangePassword(e.target.checked)}
              style={{ width: '17px', height: '17px', accentColor: 'var(--vistara-purple)' }}
            />
            <span>Paksa pengguna mengganti password saat login pertama kali</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetCreateForm();
              }}
              className="btn btn-outline btn-sm"
              style={{ minHeight: '44px' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
              style={{ minHeight: '44px' }}
            >
              {isSubmitting ? 'Membuat Akun...' : 'Simpan & Buat Akun'}
            </button>
          </div>
        </form>
      )}

      {/* Accounts List */}
      {isLoading ? (
        <LoadingState />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Belum ada akun terdaftar"
          description="Klik tombol 'Buat Akun Pengurus' untuk menambahkan akun login baru."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {accounts.map((acc) => {
            const isSelf = acc.id === currentAccountId;
            const isProtectedRoot = acc.role === 'root' && !isRootActor;
            const roleInfo = ADMIN_ROLES_META[acc.role];
            const isConfirmingDelete = confirmDeleteId === acc.id;

            return (
              <div
                key={acc.id}
                className="admin-surface"
                style={{
                  padding: '0.95rem 1.05rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  opacity: acc.isActive ? 1 : 0.72,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--vistara-purple)' }}>
                        @{acc.username}
                      </span>
                      <span
                        style={{
                          padding: '0.18rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: acc.role === 'root' ? '#EDE6F8' : '#F5F0FC',
                          color: 'var(--deep-violet)',
                        }}
                      >
                        {roleInfo?.shortLabel || acc.role}
                      </span>
                      <span
                        style={{
                          padding: '0.18rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: acc.isActive ? '#E8F5E9' : '#FFEBEE',
                          color: acc.isActive ? '#2E7D32' : '#C62828',
                        }}
                      >
                        {acc.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      {acc.mustChangePassword && (
                        <span
                          style={{
                            padding: '0.18rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: '#FFF8E1',
                            color: '#9A6700',
                          }}
                        >
                          Wajib Ganti Password
                        </span>
                      )}
                      {isSelf && (
                        <span
                          style={{
                            padding: '0.18rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: '#E3F2FD',
                            color: '#1565C0',
                          }}
                        >
                          Sesi Anda
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--deep-violet)', margin: 0 }}>
                      {acc.fullName}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', marginTop: '0.15rem' }}>
                      {acc.jabatan} · Login terakhir: <span className="tabular-nums">{formatTimestamp(acc.lastLoginAt)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {isProtectedRoot ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.76rem',
                        color: 'var(--mid-grey)',
                        fontFamily: 'var(--font-header)',
                        fontWeight: 600,
                        padding: '0.3rem 0.5rem',
                      }}
                    >
                      <Lock size={13} /> Dilindungi (Khusus Root)
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(acc)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '40px' }}
                      >
                        <Pencil size={14} /> Edit Akun
                      </button>

                      <button
                        type="button"
                        onClick={() => openResetModal(acc)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '40px' }}
                      >
                        <KeyRound size={14} /> Reset Password
                      </button>

                      {!isSelf && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(acc)}
                            className="btn btn-outline btn-sm"
                            style={{ minHeight: '40px' }}
                          >
                            <Power size={14} /> {acc.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>

                          {isConfirmingDelete ? (
                            <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(acc)}
                                style={{
                                  minHeight: '40px',
                                  padding: '0 0.75rem',
                                  borderRadius: '9px',
                                  border: 'none',
                                  background: '#C62828',
                                  color: 'white',
                                  fontFamily: 'var(--font-header)',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="btn btn-outline btn-sm"
                                style={{ minHeight: '40px' }}
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(acc.id)}
                              aria-label={`Hapus akun @${acc.username}`}
                              style={{
                                minHeight: '40px',
                                padding: '0 0.7rem',
                                borderRadius: '9px',
                                border: '1px solid #FFCDD2',
                                background: '#FFF5F5',
                                color: '#C62828',
                                fontFamily: 'var(--font-header)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={14} /> Hapus
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Username / Nama / Jabatan / Peran / Password Modal */}
      {editingAccount && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Edit akun @${editingAccount.username}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(15, 10, 30, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingAccount(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'white',
              borderRadius: '14px',
              border: '1px solid #E5DDF5',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--vistara-purple)', fontWeight: 700 }}>
                  @{editingAccount.username}
                </div>
                <h3 style={{ fontSize: '1.08rem', color: 'var(--deep-violet)', margin: 0 }}>
                  Ubah Data & Kredensial Akun
                </h3>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setEditingAccount(null)}
                style={{ width: '38px', height: '38px', borderRadius: '9px', border: '1px solid #E5DDF5', background: '#FAF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div style={{ fontSize: '0.82rem', color: '#C62828', marginBottom: '0.75rem', fontWeight: 500 }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Username Login *
                </label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Jabatan Organisasi *
                </label>
                <input
                  type="text"
                  required
                  value={editJabatan}
                  onChange={(e) => setEditJabatan(e.target.value)}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Hak Akses Divisi
                </label>
                <select
                  value={editRole}
                  disabled={editingAccount.id === currentAccountId}
                  onChange={(e) => setEditRole(e.target.value as AdminRole)}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ADMIN_ROLES_META[r].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Password Baru (Opsional — isi jika ingin mengganti)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Kosongkan jika tidak mengubah password..."
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    style={{ width: '100%', minHeight: '44px', padding: '0.55rem 2.5rem 0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
                  />
                  <button
                    type="button"
                    aria-label={showEditPassword ? 'Sembunyikan' : 'Tampilkan'}
                    onClick={() => setShowEditPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '0.25rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--mid-grey)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--charcoal)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForceChange}
                  onChange={(e) => setEditForceChange(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--vistara-purple)' }}
                />
                <span>Wajibkan ganti password pada login berikutnya</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button type="button" onClick={() => setEditingAccount(null)} className="btn btn-outline btn-sm" style={{ minHeight: '42px' }}>
                  Batal
                </button>
                <button type="submit" disabled={isModalSaving} className="btn btn-primary btn-sm" style={{ minHeight: '42px' }}>
                  {isModalSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Reset Password Modal */}
      {resetTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Reset password @${resetTarget.username}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(15, 10, 30, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetTarget(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'white',
              borderRadius: '14px',
              border: '1px solid #E5DDF5',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--vistara-purple)', fontWeight: 700 }}>
                  @{resetTarget.username}
                </div>
                <h3 style={{ fontSize: '1.08rem', color: 'var(--deep-violet)', margin: 0 }}>
                  Reset Password Pengurus
                </h3>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setResetTarget(null)}
                style={{ width: '38px', height: '38px', borderRadius: '9px', border: '1px solid #E5DDF5', background: '#FAF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div style={{ fontSize: '0.82rem', color: '#C62828', marginBottom: '0.75rem', fontWeight: 500 }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Password Baru *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    placeholder="Ketik password baru (bebas panjang)..."
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    style={{ width: '100%', minHeight: '44px', padding: '0.55rem 2.5rem 0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
                  />
                  <button
                    type="button"
                    aria-label={showResetPassword ? 'Sembunyikan' : 'Tampilkan'}
                    onClick={() => setShowResetPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '0.25rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--mid-grey)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--charcoal)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={resetForceChange}
                  onChange={(e) => setResetForceChange(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--vistara-purple)' }}
                />
                <span>Paksa ganti password pada login berikutnya</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setResetTarget(null)} className="btn btn-outline btn-sm" style={{ minHeight: '42px' }}>
                  Batal
                </button>
                <button type="submit" disabled={isModalSaving} className="btn btn-primary btn-sm" style={{ minHeight: '42px' }}>
                  <Shield size={14} /> {isModalSaving ? 'Menyimpan...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
