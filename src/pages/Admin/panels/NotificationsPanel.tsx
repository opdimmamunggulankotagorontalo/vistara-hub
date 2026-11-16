import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type { CustomNotificationItem, NotificationCategory } from '../../../types';
import {
  createCustomNotification,
  deleteCustomNotification,
  fetchCustomNotifications,
  subscribeToTableChanges,
  updateCustomNotification,
} from '../../../services/dataClient';
import {
  getNotificationPermissionState,
  requestTaraNotificationPermission,
  showTaraNotification,
  TARA_NOTIF_ICON,
} from '../../../services/taraNotifications';
import { EmptyState, LoadingState } from '../../../components/ui';

const CATEGORY_OPTIONS: Array<{ value: NotificationCategory; label: string; color: string; bg: string }> = [
  { value: 'pengumuman', label: 'Pengumuman Umum', color: '#4A2C8A', bg: '#EDE6F8' },
  { value: 'semangat', label: 'Penyemangat Siswa', color: '#6B3FA0', bg: '#F5F0FC' },
  { value: 'libur', label: 'Pengingat Hari Libur', color: '#2E7D32', bg: '#E8F5E9' },
  { value: 'event', label: 'Info Event / Agenda', color: '#1565C0', bg: '#E3F2FD' },
  { value: 'berita', label: 'Info Berita Baru', color: '#B78103', bg: '#FFF8E1' },
];

const TARGET_PRESETS = [
  { label: 'Beranda Utama', path: '/beranda' },
  { label: 'Agenda Event', path: '/beranda/event' },
  { label: 'Berita & Kabar', path: '/beranda/berita' },
  { label: 'Kotak Aspirasi', path: '/beranda/aspirasi' },
  { label: 'Program Kerja', path: '/beranda/program-kerja' },
  { label: 'Hall of Fame Prestasi', path: '/beranda/prestasi' },
];

interface NotifDraft {
  title: string;
  message: string;
  category: NotificationCategory;
  targetPath: string;
  expiresAt: string;
  isActive: boolean;
}

function createEmptyDraft(): NotifDraft {
  return {
    title: '',
    message: '',
    category: 'pengumuman',
    targetPath: '/beranda',
    expiresAt: '',
    isActive: true,
  };
}

function getCategoryMeta(cat: NotificationCategory) {
  return CATEGORY_OPTIONS.find((c) => c.value === cat) ?? CATEGORY_OPTIONS[0];
}

export default function NotificationsPanel() {
  const [items, setItems] = useState<CustomNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NotifDraft>(createEmptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    const records = await fetchCustomNotifications(true);
    setItems(records);
  };

  useEffect(() => {
    let active = true;
    fetchCustomNotifications(true)
      .then((records) => {
        if (active) setItems(records);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const unsub = subscribeToTableChanges('custom_notifications', () => {
      if (active) void loadData();
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setDraft(createEmptyDraft());
    setError('');
    setFeedback('');
    setShowForm(true);
  };

  const openEditForm = (item: CustomNotificationItem) => {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      message: item.message,
      category: item.category,
      targetPath: item.targetPath || '/beranda',
      expiresAt: item.expiresAt || '',
      isActive: item.isActive,
    });
    setError('');
    setFeedback('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.message.trim()) {
      setError('Judul dan isi pesan notifikasi wajib diisi.');
      return;
    }
    setError('');
    setFeedback('');
    setIsSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        message: draft.message.trim(),
        category: draft.category,
        targetPath: draft.targetPath.trim() || '/beranda',
        expiresAt: draft.expiresAt.trim() || null,
        isActive: draft.isActive,
      };
      if (editingId) {
        const updated = await updateCustomNotification(editingId, payload);
        setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
        setFeedback('Notifikasi custom berhasil diperbarui.');
      } else {
        const created = await createCustomNotification(payload);
        setItems((prev) => [created, ...prev]);
        setFeedback('Notifikasi custom aktif dan akan dikirim ke pengguna yang mengizinkan notifikasi TARA.');
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan notifikasi custom.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item: CustomNotificationItem) => {
    try {
      const updated = await updateCustomNotification(item.id, { isActive: !item.isActive });
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status notifikasi.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCustomNotification(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    setConfirmDeleteId(null);
  };

  const handleTestOnDevice = async (title: string, message: string, targetPath: string) => {
    setFeedback('');
    setError('');
    let perm = getNotificationPermissionState();
    if (perm === 'default') {
      perm = await requestTaraNotificationPermission();
    }
    if (perm === 'unsupported') {
      setError('Browser ini belum mendukung Notification API.');
      return;
    }
    if (perm !== 'granted') {
      setError('Izin notifikasi browser ditolak. Aktifkan izin notifikasi untuk situs ini di pengaturan browser.');
      return;
    }
    const ok = await showTaraNotification({
      title: title.trim() || 'Pratinjau Notifikasi TARA',
      body: message.trim() || 'Ini adalah contoh tampilan notifikasi resmi OPDIM VISTARA dengan ikon maskot TARA.',
      tag: `tara-preview-${Date.now()}`,
      targetPath: targetPath || '/beranda',
    });
    if (ok) {
      setFeedback('Notifikasi uji coba TARA berhasil dikirim ke perangkat Anda.');
    } else {
      setError('Gagal menampilkan notifikasi uji coba.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)', maxWidth: '580px' }}>
          Kelola pesan notifikasi custom dengan ikon maskot TARA untuk seluruh pengguna aplikasi OPDIM VISTARA (khusus Admin & Pengurus Inti).
        </div>

        <button
          type="button"
          onClick={showForm ? () => setShowForm(false) : openCreateForm}
          className="btn btn-primary btn-sm"
          style={{ minHeight: '44px' }}
        >
          {showForm ? (
            <>
              <X size={15} /> Tutup Form
            </>
          ) : (
            <>
              <Plus size={15} /> Buat Notifikasi TARA
            </>
          )}
        </button>
      </div>

      {/* Automatic Triggers Summary Strip */}
      <div
        className="admin-surface"
        style={{
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          background: '#FAF8FF',
        }}
      >
        <img
          src={TARA_NOTIF_ICON}
          alt="Ikon Maskot TARA"
          width={42}
          height={42}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '11px',
            objectFit: 'cover',
            border: '1px solid #DFD4F3',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.84rem', color: 'var(--deep-violet)' }}>
            Notifikasi Otomatis TARA Aktif
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--mid-grey)', lineHeight: 1.4 }}>
            Penyemangat harian acak di hari masuk sekolah · Pengingat istirahat saat akhir pekan & hari libur · Info otomatis Event/Berita baru.
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            void handleTestOnDevice(
              'Sapaan Resmi dari TARA!',
              'Semangat beraktivitas hari ini! Cek info terbaru di aplikasi OPDIM VISTARA.',
              '/beranda'
            )
          }
          className="btn btn-outline btn-sm"
          style={{ minHeight: '40px' }}
        >
          <Bell size={14} /> Uji Ikon TARA
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: '#FFF5F5',
            border: '1px solid #FFCDD2',
            color: '#C62828',
            fontSize: '0.83rem',
          }}
        >
          {error}
        </div>
      )}

      {feedback && (
        <div
          role="status"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: '#E8F5E9',
            border: '1px solid #A5D6A7',
            color: '#2E7D32',
            fontSize: '0.83rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => void handleSave(e)}
          className="admin-surface"
          style={{
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
            border: '1.5px solid #D4BFEF',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.02rem', color: 'var(--deep-violet)' }}>
            {editingId ? 'Edit Notifikasi Custom TARA' : 'Buat Notifikasi Custom Baru'}
          </div>

          <div className="admin-form-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Judul Notifikasi *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pengingat Rapat Koordinasi BESOK"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Kategori Pesan
              </label>
              <select
                value={draft.category}
                onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value as NotificationCategory }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: '#FFFFFF' }}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Isi Pesan TARA *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Tuliskan pesan singkat yang menyemangati atau memberi info penting bagi siswa..."
              value={draft.message}
              onChange={(e) => setDraft((prev) => ({ ...prev, message: e.target.value }))}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem', lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>

          <div className="admin-form-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Halaman Tujuan Saat Notifikasi Diklik
              </label>
              <select
                value={TARGET_PRESETS.some((p) => p.path === draft.targetPath) ? draft.targetPath : '__custom'}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v !== '__custom') setDraft((prev) => ({ ...prev, targetPath: v }));
                }}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: '#FFFFFF', marginBottom: '0.45rem' }}
              >
                {TARGET_PRESETS.map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.label} ({p.path})
                  </option>
                ))}
                <option value="__custom">Path Kustom</option>
              </select>
              <input
                type="text"
                value={draft.targetPath}
                onChange={(e) => setDraft((prev) => ({ ...prev, targetPath: e.target.value }))}
                placeholder="/beranda"
                style={{ width: '100%', minHeight: '40px', padding: '0.45rem 0.75rem', borderRadius: '9px', border: '1px solid #E5DDF5', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Berlaku Sampai Tanggal (Opsional)
              </label>
              <input
                type="date"
                value={draft.expiresAt}
                onChange={(e) => setDraft((prev) => ({ ...prev, expiresAt: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.6rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--deep-violet)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--vistara-purple)' }}
                />
                <span>Langsung aktif dikirim ke pengguna</span>
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          <div
            style={{
              background: '#1E1148',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '0.8rem 0.9rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <img
              src={TARA_NOTIF_ICON}
              alt="Pratinjau TARA"
              width={44}
              height={44}
              style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, background: '#F5F0FC' }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.68rem', color: 'rgba(212, 191, 239, 0.85)', fontFamily: 'var(--font-header)', marginBottom: '0.15rem' }}>
                OPDIM VISTARA · Pratinjau Tampilan
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.25 }}>
                {draft.title.trim() || 'Judul Notifikasi TARA'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(244, 240, 255, 0.9)', lineHeight: 1.4, marginTop: '0.2rem' }}>
                {draft.message.trim() || 'Isi pesan akan tampil lengkap beserta ikon maskot TARA di perangkat siswa.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void handleTestOnDevice(draft.title, draft.message, draft.targetPath)}
              className="btn btn-outline btn-sm"
              style={{ minHeight: '44px' }}
            >
              <Bell size={14} /> Uji Tampil di Perangkat Ini
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary btn-sm"
              style={{ minHeight: '44px', opacity: isSaving ? 0.7 : 1 }}
            >
              <Send size={14} /> {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Notifikasi'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada notifikasi custom"
          description='Klik "Buat Notifikasi TARA" untuk mengirim pengumuman khusus, ucapan libur, atau pesan semangat ke pengguna aplikasi.'
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {items.map((item) => {
            const catMeta = getCategoryMeta(item.category);
            const isConfirming = confirmDeleteId === item.id;
            return (
              <div
                key={item.id}
                className="admin-surface"
                style={{
                  padding: '0.95rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  opacity: item.isActive ? 1 : 0.72,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <img
                    src={TARA_NOTIF_ICON}
                    alt="TARA"
                    width={40}
                    height={40}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid #E5DDF5',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-header)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: catMeta.bg,
                          color: catMeta.color,
                        }}
                      >
                        {catMeta.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-header)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: item.isActive ? '#2E7D32' : 'var(--mid-grey)',
                        }}
                      >
                        {item.isActive ? 'Aktif' : 'Dijeda'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--mid-grey)' }}>
                        · Target: <code style={{ fontFamily: 'var(--font-mono)' }}>{item.targetPath}</code>
                        {item.expiresAt ? ` · s.d. ${item.expiresAt}` : ''}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.2rem', fontFamily: 'var(--font-display)', fontSize: '0.98rem', color: 'var(--deep-violet)' }}>
                      {item.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--charcoal)', lineHeight: 1.48 }}>
                      {item.message}
                    </p>
                    <div style={{ fontSize: '0.71rem', color: 'var(--mid-grey)', marginTop: '0.3rem' }}>
                      Dibuat oleh: <strong>{item.createdBy}</strong>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '0.45rem',
                    paddingTop: '0.55rem',
                    borderTop: '1px solid #F1ECFA',
                  }}
                >
                  {isConfirming ? (
                    <>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#C62828', marginRight: 'auto' }}>
                        Hapus notifikasi ini?
                      </span>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '40px' }}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        style={{
                          minHeight: '40px',
                          padding: '0 0.85rem',
                          borderRadius: '9px',
                          border: '1px solid #EF9A9A',
                          background: '#C62828',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-header)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Ya, Hapus
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(item)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '40px' }}
                      >
                        {item.isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        <span>{item.isActive ? 'Jeda' : 'Aktifkan'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '40px' }}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        style={{
                          minHeight: '40px',
                          padding: '0 0.8rem',
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
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
