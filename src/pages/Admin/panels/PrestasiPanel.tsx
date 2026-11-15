import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Trophy, User, Building2, Calendar, Search } from 'lucide-react';
import type { PrestasiItem } from '../../../types';
import {
  createPrestasi,
  deletePrestasi,
  fetchPrestasi,
  subscribeToTableChanges,
  updatePrestasi,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';
import RichTextRenderer from '../../../components/ui/RichTextRenderer';
import EditorialWorkspaceShell from '../../../components/admin/EditorialWorkspaceShell';
import RichTextDocEditor from '../../../components/admin/RichTextDocEditor';
import MediaUploadField from '../MediaUploadField';
import { richTextToPlainText, sanitizeRichHtml } from '../../../utils/richText';

const MEDAL_LABELS: Record<string, string> = {
  emas: 'Medali Emas',
  perak: 'Medali Perak',
  perunggu: 'Medali Perunggu',
  juara1: 'Juara 1',
  juara2: 'Juara 2',
  juara3: 'Juara 3',
  peserta: 'Penghargaan / Finalis',
};

interface PrestasiDraft {
  title: string;
  tingkat: PrestasiItem['tingkat'];
  kategori: string;
  peraih: string;
  tahun: string;
  medali: PrestasiItem['medali'];
  penyelenggara: string;
  description: string;
  thumbnail: string;
}

function createEmptyDraft(): PrestasiDraft {
  return {
    title: '',
    tingkat: 'provinsi',
    kategori: 'Akademik',
    peraih: '',
    tahun: String(new Date().getFullYear()),
    medali: 'juara1',
    penyelenggara: '',
    description: '',
    thumbnail: '',
  };
}

export default function PrestasiPanel() {
  const [items, setItems] = useState<PrestasiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PrestasiDraft>(createEmptyDraft);
  const [initialSnapshot, setInitialSnapshot] = useState<string>(() => JSON.stringify(createEmptyDraft()));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    const records = await fetchPrestasi();
    setItems(records);
  };

  useEffect(() => {
    let active = true;
    fetchPrestasi()
      .then((records) => {
        if (active) setItems(records);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsub = subscribeToTableChanges('prestasi', () => {
      if (active) void loadData();
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const isDirty = useMemo(
    () => viewMode === 'editor' && JSON.stringify(draft) !== initialSnapshot,
    [draft, initialSnapshot, viewMode]
  );

  const openNewEditor = () => {
    const empty = createEmptyDraft();
    setEditingId(null);
    setDraft(empty);
    setInitialSnapshot(JSON.stringify(empty));
    setError('');
    setViewMode('editor');
  };

  const openEditEditor = (item: PrestasiItem) => {
    const next: PrestasiDraft = {
      title: item.title,
      tingkat: item.tingkat,
      kategori: item.kategori,
      peraih: item.peraih,
      tahun: item.tahun,
      medali: item.medali,
      penyelenggara: item.penyelenggara,
      description: item.description || '',
      thumbnail: item.thumbnail || '',
    };
    setEditingId(item.id);
    setDraft(next);
    setInitialSnapshot(JSON.stringify(next));
    setError('');
    setViewMode('editor');
  };

  const closeEditor = () => {
    setViewMode('list');
    setEditingId(null);
    setError('');
  };

  const handleSave = async () => {
    if (!draft.title.trim() || !draft.peraih.trim() || !draft.penyelenggara.trim()) {
      setError('Judul lomba/penghargaan, nama peraih, dan penyelenggara wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const cleanedDesc = sanitizeRichHtml(draft.description);
      const payload: Omit<PrestasiItem, 'id' | 'slug'> = {
        title: draft.title.trim(),
        tingkat: draft.tingkat,
        kategori: draft.kategori.trim() || 'Akademik',
        peraih: draft.peraih.trim(),
        tahun: draft.tahun.trim() || String(new Date().getFullYear()),
        medali: draft.medali,
        penyelenggara: draft.penyelenggara.trim(),
        description: cleanedDesc || undefined,
        thumbnail: draft.thumbnail.trim() || undefined,
      };
      if (editingId) {
        const updated = await updatePrestasi(editingId, payload);
        setItems((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createPrestasi(payload);
        setItems((prev) => [created, ...prev]);
      }
      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data prestasi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePrestasi(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
    if (editingId === id) {
      closeEditor();
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.peraih.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.penyelenggara.toLowerCase().includes(q)
    );
  }, [items, search]);

  if (viewMode === 'editor') {
    return (
      <EditorialWorkspaceShell
        docTypeLabel="Prestasi"
        isEditing={Boolean(editingId)}
        isDirty={isDirty}
        isSaving={isSaving}
        saveLabel={editingId ? 'Simpan Perubahan' : 'Terbitkan Prestasi'}
        error={error}
        onBack={closeEditor}
        onSave={handleSave}
        documentColumn={
          <>
            <div>
              <label
                htmlFor="prestasi-doc-title"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--mid-grey)',
                  marginBottom: '0.35rem',
                }}
              >
                Judul Lomba / Penghargaan *
              </label>
              <textarea
                id="prestasi-doc-title"
                rows={2}
                placeholder="Contoh: Juara 1 Olimpiade Sains Madrasah Bidang Fisika"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value.replace(/\n/g, ' ') }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1px solid #EDE6F8',
                  padding: '0.35rem 0 0.55rem',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.25rem, 2.4vw, 1.65rem)',
                  fontWeight: 800,
                  lineHeight: 1.28,
                  color: 'var(--deep-violet)',
                  outline: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fieldSizing: 'content',
                }}
              />
            </div>

            <RichTextDocEditor
              label="Kisah & Catatan Pembinaan Prestasi (Opsional)"
              ariaLabel="Editor kisah prestasi"
              value={draft.description}
              minHeight={300}
              placeholder="Ceritakan perjalanan kompetisi, tim pembina, atau pesan inspiratif untuk santri lainnya (opsional)..."
              onChange={(html) => setDraft((prev) => ({ ...prev, description: html }))}
              onShortcutSave={handleSave}
            />
          </>
        }
        settingsColumn={
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Nama Peraih / Tim *
              </label>
              <input
                type="text"
                placeholder="Nama siswa atau tim..."
                value={draft.peraih}
                onChange={(e) => setDraft((prev) => ({ ...prev, peraih: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Penyelenggara *
              </label>
              <input
                type="text"
                placeholder="Contoh: Kemenag RI / Dinas Pendidikan"
                value={draft.penyelenggara}
                onChange={(e) => setDraft((prev) => ({ ...prev, penyelenggara: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div className="admin-form-grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Tingkat
                </label>
                <select
                  value={draft.tingkat}
                  onChange={(e) => setDraft((prev) => ({ ...prev, tingkat: e.target.value as PrestasiItem['tingkat'] }))}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
                >
                  <option value="nasional">Nasional</option>
                  <option value="provinsi">Provinsi</option>
                  <option value="kabupaten">Kota / Kabupaten</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Tahun *
                </label>
                <input
                  type="text"
                  placeholder="2026"
                  value={draft.tahun}
                  onChange={(e) => setDraft((prev) => ({ ...prev, tahun: e.target.value }))}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            <div className="admin-form-grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Peringkat / Medali
                </label>
                <select
                  value={draft.medali}
                  onChange={(e) => setDraft((prev) => ({ ...prev, medali: e.target.value as PrestasiItem['medali'] }))}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
                >
                  <option value="juara1">Juara 1</option>
                  <option value="juara2">Juara 2</option>
                  <option value="juara3">Juara 3</option>
                  <option value="emas">Medali Emas</option>
                  <option value="perak">Medali Perak</option>
                  <option value="perunggu">Medali Perunggu</option>
                  <option value="peserta">Penghargaan / Finalis</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Bidang / Kategori
                </label>
                <input
                  type="text"
                  placeholder="Akademik / Seni"
                  value={draft.kategori}
                  onChange={(e) => setDraft((prev) => ({ ...prev, kategori: e.target.value }))}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            <MediaUploadField
              label="Foto Dokumentasi / Piala (Opsional)"
              folder="prestasi"
              mode="image"
              value={draft.thumbnail}
              onChange={(url) => setDraft((prev) => ({ ...prev, thumbnail: url }))}
            />
          </>
        }
        previewNode={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--vistara-purple)' }}>
              {MEDAL_LABELS[draft.medali] || draft.medali} · {draft.tingkat.toUpperCase()} · {draft.kategori || 'Akademik'} ({draft.tahun})
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, color: 'var(--deep-violet)', margin: 0, lineHeight: 1.3 }}>
              {draft.title.trim() || 'Judul Lomba / Penghargaan Belum Diisi'}
            </h2>

            {draft.thumbnail && (
              <div style={{ height: 'clamp(170px, 30vw, 250px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5DDF5' }}>
                <img
                  src={draft.thumbnail}
                  alt={draft.title || 'Foto dokumentasi prestasi'}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', padding: '0.85rem 1rem', borderRadius: '12px', background: '#FAF8FF', border: '1px solid #E5DDF5', fontSize: '0.84rem', color: 'var(--deep-violet)', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} style={{ color: 'var(--vistara-purple)' }} /> {draft.peraih || 'Nama peraih belum diisi'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building2 size={14} style={{ color: 'var(--vistara-purple)' }} /> {draft.penyelenggara || 'Penyelenggara belum diisi'}
              </span>
              <span className="tabular-nums" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} style={{ color: 'var(--vistara-purple)' }} /> {draft.tahun}
              </span>
            </div>

            {draft.description.trim() ? (
              <RichTextRenderer content={draft.description} />
            ) : (
              <p style={{ color: 'var(--mid-grey)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Jika catatan kisah dibiarkan kosong, halaman publik akan menampilkan narasi apresiasi standar OPDIM VISTARA.
              </p>
            )}
          </div>
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          Catat dan kelola Hall of Fame prestasi santri &amp; pelajar MAM Unggulan.
        </div>
        <button
          type="button"
          onClick={openNewEditor}
          className="btn btn-primary btn-sm"
          style={{ minHeight: '44px' }}
        >
          <Plus size={15} /> Tambah Prestasi
        </button>
      </div>

      {items.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul prestasi, nama peraih, atau penyelenggara..."
            aria-label="Cari catatan prestasi"
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0.55rem 0.9rem 0.55rem 2.45rem',
              borderRadius: '11px',
              border: '1px solid #DFD4F3',
              background: '#FFFFFF',
              fontSize: '0.88rem',
            }}
          />
        </div>
      )}

      {isLoading ? (
        <LoadingState />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? 'Belum ada data prestasi' : 'Prestasi tidak ditemukan'}
          description={
            items.length === 0
              ? 'Klik "Tambah Prestasi" untuk mencatat prestasi & cerita keberhasilan di Studio Editorial.'
              : 'Ubah kata kunci pencarian untuk melihat daftar prestasi lainnya.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {filteredItems.map((item) => {
            const isConfirming = confirmDeleteId === item.id;
            const plainStory = item.description ? richTextToPlainText(item.description) : '';
            return (
              <div
                key={item.id}
                className="admin-surface"
                style={{
                  padding: '0.95rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid #E5DDF5',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: '#F5F0FC',
                        color: 'var(--vistara-purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Trophy size={19} />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      className="tabular-nums"
                      style={{
                        fontFamily: 'var(--font-header)',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        color: 'var(--vistara-purple)',
                      }}
                    >
                      {MEDAL_LABELS[item.medali] || item.medali} · {item.tingkat.toUpperCase()} · {item.kategori} ({item.tahun})
                    </div>
                    <h4
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.98rem',
                        color: 'var(--deep-violet)',
                        margin: '0.2rem 0 0.25rem',
                        fontWeight: 700,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)', fontWeight: 600 }}>
                      {item.peraih} · <span style={{ color: 'var(--mid-grey)', fontWeight: 500 }}>{item.penyelenggara}</span>
                    </div>
                    {plainStory && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--mid-grey)',
                          margin: '0.25rem 0 0',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {plainStory}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '0.45rem',
                    paddingTop: '0.6rem',
                    borderTop: '1px solid #F1ECFA',
                  }}
                >
                  {isConfirming ? (
                    <>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#C62828', marginRight: 'auto' }}>
                        Hapus catatan prestasi?
                      </span>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '42px' }}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        style={{
                          minHeight: '42px',
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
                        onClick={() => openEditEditor(item)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '42px', flex: '1 1 110px', maxWidth: '160px' }}
                      >
                        <Pencil size={14} /> Buka Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        style={{
                          minHeight: '42px',
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
                          justifyContent: 'center',
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
