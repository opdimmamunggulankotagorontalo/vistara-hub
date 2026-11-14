import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Trophy } from 'lucide-react';
import type { PrestasiItem } from '../../../types';
import {
  createPrestasi,
  deletePrestasi,
  fetchPrestasi,
  subscribeToTableChanges,
  updatePrestasi,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';

const MEDAL_LABELS: Record<string, string> = {
  emas: 'Medali Emas',
  perak: 'Medali Perak',
  perunggu: 'Medali Perunggu',
  juara1: 'Juara 1',
  juara2: 'Juara 2',
  juara3: 'Juara 3',
  peserta: 'Penghargaan / Finalis',
};

export default function PrestasiPanel() {
  const [items, setItems] = useState<PrestasiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [tingkat, setTingkat] = useState<PrestasiItem['tingkat']>('provinsi');
  const [kategori, setKategori] = useState('Akademik');
  const [peraih, setPeraih] = useState('');
  const [tahun, setTahun] = useState(() => String(new Date().getFullYear()));
  const [medali, setMedali] = useState<PrestasiItem['medali']>('juara1');
  const [penyelenggara, setPenyelenggara] = useState('');
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

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setTingkat('provinsi');
    setKategori('Akademik');
    setPeraih('');
    setTahun(String(new Date().getFullYear()));
    setMedali('juara1');
    setPenyelenggara('');
    setError('');
  };

  const openEditForm = (item: PrestasiItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setTingkat(item.tingkat);
    setKategori(item.kategori);
    setPeraih(item.peraih);
    setTahun(item.tahun);
    setMedali(item.medali);
    setPenyelenggara(item.penyelenggara);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !peraih.trim() || !penyelenggara.trim()) {
      setError('Judul prestasi, nama peraih, dan penyelenggara wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const payload: Omit<PrestasiItem, 'id' | 'slug'> = {
        title: title.trim(),
        tingkat,
        kategori: kategori.trim() || 'Akademik',
        peraih: peraih.trim(),
        tahun: tahun.trim() || String(new Date().getFullYear()),
        medali,
        penyelenggara: penyelenggara.trim(),
      };
      if (editingId) {
        const updated = await updatePrestasi(editingId, payload);
        setItems((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createPrestasi(payload);
        setItems((prev) => [created, ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data prestasi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePrestasi(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) {
      setShowForm(false);
      resetForm();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          Catat dan kelola Hall of Fame prestasi santri & pelajar MAM Unggulan.
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
          {showForm ? <><X size={15} /> Tutup Form</> : <><Plus size={15} /> Tambah Prestasi</>}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="admin-surface"
          style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--deep-violet)', margin: 0 }}>
            {editingId ? 'Edit Data Prestasi' : 'Catat Prestasi Baru'}
          </h3>

          {error && <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>{error}</div>}

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Judul Lomba / Penghargaan *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Juara 1 Olimpiade Sains Madrasah Bidang Fisika"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
            />
          </div>

          <div className="admin-form-grid-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Tingkat
              </label>
              <select
                value={tingkat}
                onChange={(e) => setTingkat(e.target.value as PrestasiItem['tingkat'])}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
              >
                <option value="nasional">Nasional</option>
                <option value="provinsi">Provinsi</option>
                <option value="kabupaten">Kota / Kabupaten</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Peringkat / Medali
              </label>
              <select
                value={medali}
                onChange={(e) => setMedali(e.target.value as PrestasiItem['medali'])}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
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
                Tahun *
              </label>
              <input
                type="text"
                required
                placeholder="2026"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div className="admin-form-grid-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Nama Peraih / Tim *
              </label>
              <input
                type="text"
                required
                placeholder="Nama siswa atau tim..."
                value={peraih}
                onChange={(e) => setPeraih(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Bidang / Kategori
              </label>
              <input
                type="text"
                placeholder="Contoh: Akademik / Olahraga / Seni"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Penyelenggara *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kemenag RI / Dinas Pendidikan"
                value={penyelenggara}
                onChange={(e) => setPenyelenggara(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
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
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Prestasi'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada data prestasi"
          description="Klik 'Tambah Prestasi' untuk mencatat prestasi santri & pelajar MAM Unggulan ke halaman publik."
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
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#F5F0FC',
                    color: 'var(--vistara-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
                    {MEDAL_LABELS[item.medali] || item.medali} · {item.tingkat.toUpperCase()} · {item.kategori} ({item.tahun})
                  </div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--deep-violet)', margin: '0.15rem 0', fontWeight: 700 }}>
                    {item.title}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)' }}>
                    Peraih: <strong style={{ color: 'var(--charcoal)' }}>{item.peraih}</strong> · {item.penyelenggara}
                  </div>
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
