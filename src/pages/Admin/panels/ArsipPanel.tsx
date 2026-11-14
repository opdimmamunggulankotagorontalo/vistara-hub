import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ExternalLink } from 'lucide-react';
import type { ArsipItem } from '../../../types';
import {
  createArsip,
  deleteArsip,
  fetchArsip,
  subscribeToTableChanges,
  updateArsip,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';
import MediaUploadField from '../MediaUploadField';

export default function ArsipPanel() {
  const [items, setItems] = useState<ArsipItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [jenis, setJenis] = useState<ArsipItem['jenis']>('dokumen');
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [ukuran, setUkuran] = useState('PDF');
  const [deskripsi, setDeskripsi] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    const records = await fetchArsip();
    setItems(records);
  };

  useEffect(() => {
    let active = true;
    fetchArsip()
      .then((records) => {
        if (active) setItems(records);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsub = subscribeToTableChanges('arsip', () => {
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
    setJenis('dokumen');
    setTanggal(new Date().toISOString().slice(0, 10));
    setUkuran('PDF');
    setDeskripsi('');
    setFileUrl('');
    setError('');
  };

  const openEditForm = (item: ArsipItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setJenis(item.jenis);
    setTanggal(item.tanggal);
    setUkuran(item.ukuran);
    setDeskripsi(item.deskripsi);
    setFileUrl(item.fileUrl || '');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !tanggal.trim() || !deskripsi.trim()) {
      setError('Judul, tanggal, dan deskripsi arsip wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        jenis,
        tanggal: tanggal.trim(),
        ukuran: ukuran.trim() || 'PDF',
        deskripsi: deskripsi.trim(),
        fileUrl: fileUrl.trim() || undefined,
      };
      if (editingId) {
        const updated = await updateArsip(editingId, payload);
        setItems((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const created = await createArsip(payload);
        setItems((prev) => [created, ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan dokumen arsip.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteArsip(id);
    setItems((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) {
      setShowForm(false);
      resetForm();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          Repositori SK, notulen rapat, pedoman kerja, dan laporan resmi (Pengurus Inti).
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
          {showForm ? <><X size={15} /> Tutup Form</> : <><Plus size={15} /> Unggah Arsip</>}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="admin-surface"
          style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--deep-violet)', margin: 0 }}>
            {editingId ? 'Edit Dokumen Arsip' : 'Dokumen Arsip Baru'}
          </h3>

          {error && <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>{error}</div>}

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Judul Dokumen *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: SK Kepengurusan OPDIM VISTARA 2026–2027"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
            />
          </div>

          <div className="admin-form-grid-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Jenis Dokumen
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as ArsipItem['jenis'])}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
              >
                <option value="sk">SK Kepengurusan</option>
                <option value="notulen">Notulen Rapat</option>
                <option value="dokumen">Dokumen & Pedoman</option>
                <option value="laporan">Laporan Kegiatan</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Tanggal Terbit *
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Ukuran / Format
              </label>
              <input
                type="text"
                placeholder="Contoh: 1.4 MB · PDF"
                value={ukuran}
                onChange={(e) => setUkuran(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <MediaUploadField
            label="Berkas Dokumen (Upload PDF/File atau Tempel Link Drive)"
            folder="arsip"
            mode="document"
            value={fileUrl}
            onChange={(url, meta) => {
              setFileUrl(url);
              if (meta?.sizeText) setUkuran(meta.sizeText);
            }}
            placeholder="https://drive.google.com/..."
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Keterangan Singkat *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Ringkasan isi atau kegunaan dokumen ini..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
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
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Arsip'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada dokumen arsip"
          description="Klik 'Unggah Arsip' untuk menambahkan SK, notulen, atau laporan resmi OPDIM."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {items.map((doc) => (
            <div
              key={doc.id}
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
              <div style={{ minWidth: 0, flex: '1 1 250px' }}>
                <div className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
                  {doc.jenis.toUpperCase()} · {doc.tanggal} · {doc.ukuran}
                </div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--deep-violet)', margin: '0.15rem 0', fontWeight: 700 }}>
                  {doc.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', margin: 0 }}>
                  {doc.deskripsi}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0, flexWrap: 'wrap' }}>
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ minHeight: '40px' }}
                  >
                    <ExternalLink size={14} /> Buka
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => openEditForm(doc)}
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '40px' }}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
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
