import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { BeritaItem } from '../../../types';
import {
  createBerita,
  deleteBerita,
  fetchBerita,
  subscribeToTableChanges,
  updateBerita,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';
import MediaUploadField from '../MediaUploadField';

export default function BeritaPanel() {
  const [items, setItems] = useState<BeritaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Kegiatan');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [author, setAuthor] = useState('Komisi 5 Media & Humas');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState('');
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

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Kegiatan');
    setDate(new Date().toISOString().slice(0, 10));
    setAuthor('Komisi 5 Media & Humas');
    setExcerpt('');
    setContent('');
    setThumbnail('');
    setError('');
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (item: BeritaItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setDate(item.date);
    setAuthor(item.author);
    setExcerpt(item.excerpt);
    setContent(item.content || '');
    setThumbnail(item.thumbnail || '');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) {
      setError('Judul dan ringkasan berita wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        category: category.trim() || 'Kegiatan',
        date: date.trim() || new Date().toISOString().slice(0, 10),
        author: author.trim() || 'Komisi 5 Media',
        thumbnail: thumbnail.trim() || undefined,
        content: content.trim() || undefined,
      };
      if (editingId) {
        const updated = await updateBerita(editingId, payload);
        setItems((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
      } else {
        const created = await createBerita(payload);
        setItems((prev) => [created, ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan berita.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBerita(id);
    setItems((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) {
      setShowForm(false);
      resetForm();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          Publikasi artikel berita & informasi resmi OPDIM (Komisi 5 Media).
        </div>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openNewForm())}
          className="btn btn-primary btn-sm"
          style={{ minHeight: '42px' }}
        >
          {showForm ? <><X size={15} /> Tutup Form</> : <><Plus size={15} /> Tulis Berita Baru</>}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="admin-surface"
          style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--deep-violet)', margin: 0 }}>
            {editingId ? 'Edit Artikel Berita' : 'Terbitkan Artikel Berita'}
          </h3>

          {error && <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>{error}</div>}

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Judul Berita *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pembukaan Classmeeting Semester Genap 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
            />
          </div>

          <div className="admin-form-grid-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Kategori
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Tanggal Terbit
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Penulis / Divisi
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <MediaUploadField
            label="Foto Sampul Berita (Otomatis 1080p WebP)"
            folder="berita"
            mode="image"
            value={thumbnail}
            onChange={(url) => setThumbnail(url)}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Ringkasan Singkat (Excerpt) *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Ringkasan 1–2 kalimat yang tampil di kartu beranda & daftar berita..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Isi Berita Lengkap
            </label>
            <textarea
              rows={5}
              placeholder="Tuliskan isi lengkap berita (pisahkan paragraf dengan Enter)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="btn btn-outline btn-sm"
              style={{ minHeight: '44px' }}
            >
              Batal
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary btn-sm" style={{ minHeight: '44px' }}>
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Berita'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada artikel berita"
          description="Klik 'Tulis Berita Baru' untuk menerbitkan kabar terbaru ke portal publik."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="admin-surface"
              style={{
                padding: '0.9rem 1rem',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: '1 1 250px' }}>
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    style={{ width: '56px', height: '42px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #E5DDF5' }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
                    {item.category} · {item.date} · {item.author}
                  </div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--deep-violet)', margin: '0.15rem 0', fontWeight: 700 }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.excerpt}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0 }}>
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
                  onClick={() => handleDelete(item.id)}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
