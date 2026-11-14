import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from 'lucide-react';
import type { GaleriItem } from '../../../types';
import {
  createGaleri,
  deleteGaleri,
  fetchGaleri,
  subscribeToTableChanges,
  updateGaleri,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';
import MediaUploadField from '../MediaUploadField';

export default function GaleriPanel() {
  const [albums, setAlbums] = useState<GaleriItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Kegiatan');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [imageCount, setImageCount] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    const records = await fetchGaleri();
    setAlbums(records);
  };

  useEffect(() => {
    let active = true;
    fetchGaleri()
      .then((records) => {
        if (active) setAlbums(records);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsub = subscribeToTableChanges('gallery', () => {
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
    setDescription('');
    setCoverImage('');
    setImageCount(1);
    setError('');
  };

  const openEditForm = (album: GaleriItem) => {
    setEditingId(album.id);
    setTitle(album.title);
    setCategory(album.category);
    setDate(album.date);
    setDescription(album.description);
    setCoverImage(album.coverImage || '');
    setImageCount(album.imageCount || 1);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Judul dan deskripsi album wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'Kegiatan',
        date: date.trim() || new Date().toISOString().slice(0, 10),
        coverImage: coverImage.trim(),
        imageCount: Math.max(1, Number(imageCount) || 1),
      };
      if (editingId) {
        const updated = await updateGaleri(editingId, payload);
        setAlbums((prev) => prev.map((g) => (g.id === editingId ? updated : g)));
      } else {
        const created = await createGaleri(payload);
        setAlbums((prev) => [created, ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan album galeri.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteGaleri(id);
    setAlbums((prev) => prev.filter((g) => g.id !== id));
    if (editingId === id) {
      setShowForm(false);
      resetForm();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          Dokumentasi foto kegiatan OPDIM dengan kompresi otomatis 1080p WebP.
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="btn btn-primary btn-sm"
          style={{ minHeight: '42px' }}
        >
          {showForm ? <><X size={15} /> Tutup Form</> : <><Plus size={15} /> Tambah Album</>}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="admin-surface"
          style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--deep-violet)', margin: 0 }}>
            {editingId ? 'Edit Album Galeri' : 'Album Dokumentasi Baru'}
          </h3>

          {error && <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>{error}</div>}

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Judul Album *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Dokumentasi Upacara & Pelantikan VISTARA"
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
                Tanggal Kegiatan
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
                Jumlah Foto
              </label>
              <input
                type="number"
                min={1}
                value={imageCount}
                onChange={(e) => setImageCount(Number(e.target.value) || 1)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <MediaUploadField
            label="Foto Sampul Album (Otomatis 1080p WebP)"
            folder="galeri"
            mode="image"
            value={coverImage}
            onChange={(url) => setCoverImage(url)}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Deskripsi Singkat *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Ringkasan kegiatan yang didokumentasikan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
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
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Album'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingState />
      ) : albums.length === 0 ? (
        <EmptyState
          title="Belum ada album galeri"
          description="Klik 'Tambah Album' untuk mengunggah dokumentasi kegiatan."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {albums.map((album) => (
            <div
              key={album.id}
              className="admin-surface"
              style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
            >
              <div
                style={{
                  aspectRatio: '16/9',
                  borderRadius: '9px',
                  overflow: 'hidden',
                  background: '#2D1B69',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <ImageIcon size={28} color="rgba(255,255,255,0.4)" />
                )}
              </div>

              <div>
                <div className="tabular-nums" style={{ fontSize: '0.73rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
                  {album.category} · {album.date} · {album.imageCount} foto
                </div>
                <h4 style={{ fontSize: '0.94rem', color: 'var(--deep-violet)', margin: '0.15rem 0', fontWeight: 700 }}>
                  {album.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--mid-grey)', margin: 0 }}>
                  {album.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.45rem', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => openEditForm(album)}
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '40px', flex: 1, justifyContent: 'center' }}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(album.id)}
                  style={{
                    minHeight: '40px',
                    padding: '0 0.75rem',
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
