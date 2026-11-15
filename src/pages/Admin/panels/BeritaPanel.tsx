import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, User, Search } from 'lucide-react';
import type { BeritaItem } from '../../../types';
import {
  createBerita,
  deleteBerita,
  fetchBerita,
  subscribeToTableChanges,
  updateBerita,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';
import RichTextRenderer from '../../../components/ui/RichTextRenderer';
import EditorialWorkspaceShell from '../../../components/admin/EditorialWorkspaceShell';
import RichTextDocEditor from '../../../components/admin/RichTextDocEditor';
import MediaUploadField from '../MediaUploadField';
import { richTextToPlainText, sanitizeRichHtml } from '../../../utils/richText';

interface BeritaDraft {
  title: string;
  category: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
  thumbnail: string;
}

function createEmptyDraft(): BeritaDraft {
  return {
    title: '',
    category: 'Kegiatan',
    date: new Date().toISOString().slice(0, 10),
    author: 'Komisi 5 Media & Humas',
    excerpt: '',
    content: '',
    thumbnail: '',
  };
}

export default function BeritaPanel() {
  const [items, setItems] = useState<BeritaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BeritaDraft>(createEmptyDraft);
  const [initialSnapshot, setInitialSnapshot] = useState<string>(() => JSON.stringify(createEmptyDraft()));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    const records = await fetchBerita();
    setItems(records);
  };

  useEffect(() => {
    let active = true;
    fetchBerita()
      .then((records) => {
        if (active) setItems(records);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsub = subscribeToTableChanges('berita', () => {
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

  const openEditEditor = (item: BeritaItem) => {
    const next: BeritaDraft = {
      title: item.title,
      category: item.category,
      date: item.date,
      author: item.author,
      excerpt: item.excerpt,
      content: item.content || '',
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
    if (!draft.title.trim() || !draft.excerpt.trim()) {
      setError('Judul berita dan ringkasan singkat (excerpt) wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const cleanedContent = sanitizeRichHtml(draft.content);
      const payload = {
        title: draft.title.trim(),
        excerpt: draft.excerpt.trim(),
        category: draft.category.trim() || 'Kegiatan',
        date: draft.date.trim() || new Date().toISOString().slice(0, 10),
        author: draft.author.trim() || 'Komisi 5 Media',
        thumbnail: draft.thumbnail.trim() || undefined,
        content: cleanedContent || undefined,
      };
      if (editingId) {
        const updated = await updateBerita(editingId, payload);
        setItems((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
      } else {
        const created = await createBerita(payload);
        setItems((prev) => [created, ...prev]);
      }
      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan berita.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBerita(id);
    setItems((prev) => prev.filter((b) => b.id !== id));
    setConfirmDeleteId(null);
    if (editingId === id) {
      closeEditor();
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q)
    );
  }, [items, search]);

  if (viewMode === 'editor') {
    return (
      <EditorialWorkspaceShell
        docTypeLabel="Berita"
        isEditing={Boolean(editingId)}
        isDirty={isDirty}
        isSaving={isSaving}
        saveLabel={editingId ? 'Simpan Perubahan' : 'Terbitkan Berita'}
        error={error}
        onBack={closeEditor}
        onSave={handleSave}
        documentColumn={
          <>
            <div>
              <label
                htmlFor="berita-doc-title"
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
                Judul Artikel *
              </label>
              <textarea
                id="berita-doc-title"
                rows={2}
                placeholder="Tulis judul berita utama di sini..."
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

            <div>
              <label
                htmlFor="berita-doc-excerpt"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  color: 'var(--deep-violet)',
                  marginBottom: '0.35rem',
                }}
              >
                Ringkasan / Lead Berita *
              </label>
              <textarea
                id="berita-doc-excerpt"
                rows={2}
                placeholder="Ringkasan 1–2 kalimat yang tampil pada kartu beranda & pembuka artikel..."
                value={draft.excerpt}
                onChange={(e) => setDraft((prev) => ({ ...prev, excerpt: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '11px',
                  border: '1px solid #E2D9F3',
                  background: '#FAF8FF',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  color: 'var(--charcoal)',
                  resize: 'vertical',
                }}
              />
            </div>

            <RichTextDocEditor
              label="Isi Berita Lengkap"
              ariaLabel="Editor isi berita lengkap"
              value={draft.content}
              minHeight={340}
              placeholder='Mulai tulis laporan atau berita lengkap... Gunakan "# " untuk subjudul, "- " untuk daftar, atau Ctrl+B / Ctrl+I / Ctrl+K.'
              onChange={(html) => setDraft((prev) => ({ ...prev, content: html }))}
              onShortcutSave={handleSave}
            />
          </>
        }
        settingsColumn={
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Kategori
              </label>
              <input
                type="text"
                value={draft.category}
                onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Tanggal Terbit
              </label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Penulis / Divisi
              </label>
              <input
                type="text"
                value={draft.author}
                onChange={(e) => setDraft((prev) => ({ ...prev, author: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <MediaUploadField
              label="Foto Sampul Berita (WebP 1080p)"
              folder="berita"
              mode="image"
              value={draft.thumbnail}
              onChange={(url) => setDraft((prev) => ({ ...prev, thumbnail: url }))}
            />
          </>
        }
        previewNode={
          <article style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--vistara-purple)', display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
              <span>{draft.category || 'Kegiatan'}</span>
              <span>·</span>
              <span className="tabular-nums" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={13} /> {draft.date}
              </span>
              <span>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={13} /> {draft.author || 'Komisi 5 Media'}
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)', fontWeight: 800, color: 'var(--deep-violet)', margin: 0, lineHeight: 1.25 }}>
              {draft.title.trim() || 'Judul Artikel Berita Belum Diisi'}
            </h2>

            {draft.thumbnail && (
              <div style={{ height: 'clamp(180px, 32vw, 280px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5DDF5' }}>
                <img
                  src={draft.thumbnail}
                  alt={draft.title || 'Pratinjau sampul berita'}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {draft.excerpt.trim() && (
              <div style={{ padding: '0.9rem 1.1rem', borderRadius: '11px', background: '#FAF8FF', border: '1px solid #E5DDF5', color: 'var(--deep-violet)', fontWeight: 500, lineHeight: 1.65 }}>
                {draft.excerpt}
              </div>
            )}

            {draft.content.trim() ? (
              <RichTextRenderer content={draft.content} />
            ) : (
              <p style={{ color: 'var(--mid-grey)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Belum ada isi naskah berita. Beralih ke tab Tulis untuk mulai menulis.
              </p>
            )}
          </article>
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          Publikasi artikel berita &amp; informasi resmi OPDIM (Komisi 5 Media).
        </div>
        <button
          type="button"
          onClick={openNewEditor}
          className="btn btn-primary btn-sm"
          style={{ minHeight: '44px' }}
        >
          <Plus size={15} /> Tulis Berita Baru
        </button>
      </div>

      {items.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, kategori, atau penulis berita..."
            aria-label="Cari artikel berita"
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
          title={items.length === 0 ? 'Belum ada artikel berita' : 'Tidak ada berita cocok'}
          description={
            items.length === 0
              ? 'Klik "Tulis Berita Baru" untuk membuka Studio Editorial dan menerbitkan berita resmi.'
              : 'Ubah kata kunci pencarian untuk melihat daftar berita lain.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {filteredItems.map((item) => {
            const isConfirming = confirmDeleteId === item.id;
            const plainPreview = richTextToPlainText(item.excerpt || item.content || '');
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
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '64px',
                        height: '48px',
                        borderRadius: '9px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid #E5DDF5',
                      }}
                    />
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
                      {item.category} · {item.date} · {item.author}
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
                    <p
                      style={{
                        fontSize: '0.81rem',
                        color: 'var(--mid-grey)',
                        margin: 0,
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {plainPreview}
                    </p>
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
                        Hapus artikel ini?
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
