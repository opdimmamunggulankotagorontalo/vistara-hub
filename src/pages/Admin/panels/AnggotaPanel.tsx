import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  Search,
  UserCheck,
  CheckCircle2,
  Network,
  List,
} from 'lucide-react';
import type { AnggotaLevel, AnggotaOpdim, AnggotaUnit } from '../../../types';
import { ANGGOTA_LEVEL_LABELS, ANGGOTA_UNIT_META } from '../../../data/anggotaSeed';
import {
  createAnggotaOpdim,
  deleteAnggotaOpdim,
  fetchAnggotaOpdim,
  subscribeToTableChanges,
  updateAnggotaOpdim,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';
import OrgStructureCanvas, { type OrgTreeNodeKey } from '../../../components/shared/OrgStructureCanvas';
import MediaUploadField from '../MediaUploadField';

const UNIT_ORDER: AnggotaUnit[] = [
  'pimpinan',
  'inti',
  'komisi1',
  'komisi2',
  'komisi3',
  'komisi4',
  'komisi5',
];

const LEVEL_OPTIONS: AnggotaLevel[] = [
  'kepala_madrasah',
  'pembina',
  'inti',
  'ketua_komisi',
  'anggota',
];

function getInitials(name: string): string {
  const parts = name
    .replace(/,.*$/, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'OP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function AnggotaPanel() {
  const [items, setItems] = useState<AnggotaOpdim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'list' | 'chart'>('list');
  const [chartSelectedNode, setChartSelectedNode] = useState<OrgTreeNodeKey | null>(null);
  const [unitFilter, setUnitFilter] = useState<'all' | AnggotaUnit>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [unit, setUnit] = useState<AnggotaUnit>('komisi1');
  const [peranLevel, setPeranLevel] = useState<AnggotaLevel>('anggota');
  const [tugasUtama, setTugasUtama] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(32);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    const records = await fetchAnggotaOpdim();
    setItems([...records].sort((a, b) => a.sortOrder - b.sortOrder));
  };

  useEffect(() => {
    let active = true;
    fetchAnggotaOpdim()
      .then((records) => {
        if (active) setItems([...records].sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsub = subscribeToTableChanges('anggota_opdim', () => {
      if (active) void loadData();
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  const resetForm = () => {
    const maxOrder = items.reduce((acc, cur) => Math.max(acc, cur.sortOrder), 0);
    setEditingId(null);
    setFullName('');
    setJabatan('');
    setUnit('komisi1');
    setPeranLevel('anggota');
    setTugasUtama('');
    setFotoUrl('');
    setSortOrder(maxOrder + 1);
    setIsActive(true);
    setError('');
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (item: AnggotaOpdim) => {
    setEditingId(item.id);
    setFullName(item.fullName);
    setJabatan(item.jabatan);
    setUnit(item.unit);
    setPeranLevel(item.peranLevel);
    setTugasUtama(item.tugasUtama || '');
    setFotoUrl(item.fotoUrl || '');
    setSortOrder(item.sortOrder);
    setIsActive(item.isActive);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !jabatan.trim()) {
      setError('Nama lengkap dan jabatan anggota wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const payload: Omit<AnggotaOpdim, 'id'> = {
        fullName: fullName.trim(),
        jabatan: jabatan.trim(),
        unit,
        peranLevel,
        tugasUtama: tugasUtama.trim(),
        fotoUrl: fotoUrl.trim(),
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 50,
        isActive,
      };
      if (editingId) {
        const updated = await updateAnggotaOpdim(editingId, payload);
        setItems((prev) =>
          prev
            .map((a) => (a.id === editingId ? updated : a))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        );
        showToast(`Data ${updated.fullName} berhasil diperbarui.`);
      } else {
        const created = await createAnggotaOpdim(payload);
        setItems((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
        showToast(`${created.fullName} ditambahkan ke struktur OPDIM.`);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data anggota OPDIM.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteAnggotaOpdim(id);
    setItems((prev) => prev.filter((a) => a.id !== id));
    setConfirmDeleteId(null);
    if (editingId === id) {
      setShowForm(false);
      resetForm();
    }
    showToast('Anggota telah dihapus dari struktur.');
  };

  const handleMoveOrder = async (index: number, direction: -1 | 1, scopedList: AnggotaOpdim[]) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= scopedList.length) return;
    const currentItem = scopedList[index];
    const neighborItem = scopedList[targetIdx];

    const currentOrder = currentItem.sortOrder;
    const neighborOrder =
      neighborItem.sortOrder === currentOrder
        ? currentOrder + direction
        : neighborItem.sortOrder;

    const updatedCurrent = { ...currentItem, sortOrder: neighborOrder };
    const updatedNeighbor = { ...neighborItem, sortOrder: currentOrder };

    setItems((prev) =>
      prev
        .map((a) => {
          if (a.id === updatedCurrent.id) return updatedCurrent;
          if (a.id === updatedNeighbor.id) return updatedNeighbor;
          return a;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder)
    );

    await Promise.all([
      updateAnggotaOpdim(updatedCurrent.id, updatedCurrent),
      updateAnggotaOpdim(updatedNeighbor.id, updatedNeighbor),
    ]);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (unitFilter !== 'all' && item.unit !== unitFilter) return false;
    if (q) {
      const hay = `${item.fullName} ${item.jabatan} ${item.tugasUtama || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const withPhotoCount = items.filter((a) => Boolean(a.fotoUrl?.trim())).length;
  const intiCount = items.filter((a) => a.unit === 'inti').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* KPI Row */}
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
            Total Personel
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-violet)', marginTop: '0.15rem' }}>
            {items.length}
          </div>
        </div>
        <div className="admin-surface" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
            Pengurus Inti
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--vistara-purple)', marginTop: '0.15rem' }}>
            {intiCount}
          </div>
        </div>
        <div className="admin-surface" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>
            Foto Terpasang
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2E7D32', marginTop: '0.15rem' }}>
            {withPhotoCount}/{items.length}
          </div>
        </div>
      </div>

      {/* Segmented View Tabs + Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
        <div
          role="tablist"
          aria-label="Tampilan menu Anggota OPDIM"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem',
            borderRadius: '10px',
            background: '#F2ECFC',
            border: '1px solid #E5DDF5',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === 'list'}
            onClick={() => setViewTab('list')}
            style={{
              minHeight: '38px',
              padding: '0 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: viewTab === 'list' ? '#FFFFFF' : 'transparent',
              color: viewTab === 'list' ? 'var(--deep-violet)' : 'var(--mid-grey)',
              fontFamily: 'var(--font-header)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: viewTab === 'list' ? '0 1px 4px rgba(46,26,71,0.08)' : 'none',
            }}
          >
            <List size={15} /> Daftar &amp; Kelola
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === 'chart'}
            onClick={() => setViewTab('chart')}
            style={{
              minHeight: '38px',
              padding: '0 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: viewTab === 'chart' ? '#FFFFFF' : 'transparent',
              color: viewTab === 'chart' ? 'var(--deep-violet)' : 'var(--mid-grey)',
              fontFamily: 'var(--font-header)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: viewTab === 'chart' ? '0 1px 4px rgba(46,26,71,0.08)' : 'none',
            }}
          >
            <Network size={15} /> Bagan Struktur
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setViewTab('list');
            if (showForm) {
              setShowForm(false);
            } else {
              openNewForm();
            }
          }}
          className="btn btn-primary btn-sm"
          style={{ minHeight: '42px' }}
        >
          {showForm && viewTab === 'list' ? <><X size={15} /> Tutup Form</> : <><Plus size={15} /> Tambah Anggota</>}
        </button>
      </div>

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

      {viewTab === 'chart' ? (
        <div className="admin-surface" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <OrgStructureCanvas
            members={items.filter((i) => i.isActive)}
            selectedNode={chartSelectedNode}
            onSelectNode={(node) =>
              setChartSelectedNode((prev) => (prev === node ? null : node))
            }
          />
          {chartSelectedNode && (
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                background: '#FAF8FF',
                border: '1px solid #E5DDF5',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.65rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--vistara-purple)', fontFamily: 'var(--font-header)', textTransform: 'uppercase' }}>
                  Unit Terpilih di Bagan
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--deep-violet)', marginTop: '0.1rem' }}>
                  {chartSelectedNode === 'kepala_madrasah' || chartSelectedNode === 'pembina'
                    ? ANGGOTA_UNIT_META.pimpinan.label
                    : ANGGOTA_UNIT_META[chartSelectedNode].label}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ minHeight: '40px' }}
                onClick={() => {
                  const targetUnit: AnggotaUnit =
                    chartSelectedNode === 'kepala_madrasah' || chartSelectedNode === 'pembina'
                      ? 'pimpinan'
                      : chartSelectedNode;
                  setUnitFilter(targetUnit);
                  setViewTab('list');
                }}
              >
                Kelola Personel Unit Ini
              </button>
            </div>
          )}
        </div>
      ) : (
        <>

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="admin-surface"
          style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--deep-violet)', margin: 0 }}>
            {editingId ? 'Edit Data Anggota / Pimpinan' : 'Tambah Personel Baru ke Struktur OPDIM'}
          </h3>

          {error && <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>{error}</div>}

          <div className="admin-form-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Nama Lengkap & Gelar (Jika Ada) *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Muhamad Aryansyah Thaib"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Jabatan Tampil *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ketua OPDIM / Pembina OPDIM / Anggota Komisi 4"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div className="admin-form-grid-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Unit / Divisi Struktur *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as AnggotaUnit)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
              >
                {UNIT_ORDER.map((u) => (
                  <option key={u} value={u}>
                    {ANGGOTA_UNIT_META[u].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Tingkatan Peran *
              </label>
              <select
                value={peranLevel}
                onChange={(e) => setPeranLevel(e.target.value as AnggotaLevel)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
              >
                {LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {ANGGOTA_LEVEL_LABELS[lvl]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Urutan Tampil
              </label>
              <input
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 1)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Tugas Pokok / Keterangan Singkat
            </label>
            <textarea
              rows={2}
              placeholder="Ringkasan amanah dan tanggung jawab jabatan..."
              value={tugasUtama}
              onChange={(e) => setTugasUtama(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', resize: 'vertical' }}
            />
          </div>

          <MediaUploadField
            label="Foto Profil (Opsional · Konversi Otomatis WebP 1080p)"
            folder="anggota"
            mode="image"
            value={fotoUrl}
            onChange={(url) => setFotoUrl(url)}
            placeholder="https://... (kosongkan untuk memakai avatar inisial)"
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--charcoal)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '17px', height: '17px', accentColor: 'var(--vistara-purple)' }}
            />
            <span>Status aktif (tampilkan di halaman publik Anggota OPDIM)</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="btn btn-outline btn-sm"
              style={{ minHeight: '42px' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary btn-sm"
              style={{ minHeight: '42px' }}
            >
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan Anggota'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Unit Filter Controls */}
      <div className="admin-surface" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengurus, Kepala Madrasah, Pembina, atau jabatan..."
            style={{ width: '100%', minHeight: '42px', padding: '0.5rem 0.85rem 0.5rem 2.3rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.86rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.15rem', scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setUnitFilter('all')}
            style={{
              minHeight: '36px',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: unitFilter === 'all' ? '1px solid var(--vistara-purple)' : '1px solid #E5DDF5',
              background: unitFilter === 'all' ? 'var(--deep-violet)' : '#FAF8FF',
              color: unitFilter === 'all' ? 'white' : 'var(--deep-violet)',
              fontFamily: 'var(--font-header)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Semua ({items.length})
          </button>
          {UNIT_ORDER.map((u) => {
            const count = items.filter((a) => a.unit === u).length;
            const active = unitFilter === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => setUnitFilter(u)}
                style={{
                  minHeight: '36px',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: active ? '1px solid var(--vistara-purple)' : '1px solid #E5DDF5',
                  background: active ? 'var(--deep-violet)' : '#FAF8FF',
                  color: active ? 'white' : 'var(--deep-violet)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {ANGGOTA_UNIT_META[u].shortLabel} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Member List */}
      {isLoading ? (
        <LoadingState />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="Tidak ada anggota yang cocok"
          description="Tambahkan personel baru atau ubah kata kunci filter pencarian."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filteredItems.map((item, idx) => {
            const unitMeta = ANGGOTA_UNIT_META[item.unit];
            const isConfirming = confirmDeleteId === item.id;
            return (
              <div
                key={item.id}
                className="admin-surface"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.85rem',
                  flexWrap: 'wrap',
                  opacity: item.isActive ? 1 : 0.68,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0, flex: '1 1 260px' }}>
                  {item.fotoUrl ? (
                    <img
                      src={item.fotoUrl}
                      alt={item.fullName}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        objectPosition: 'top',
                        border: '1px solid #E5DDF5',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        background: '#F5F0FC',
                        border: '1px solid #E5DDF5',
                        color: 'var(--deep-violet)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(item.fullName)}
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.73rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)', fontWeight: 600 }}>
                      <span style={{ color: unitMeta?.accentColor || 'var(--vistara-purple)', fontWeight: 700 }}>
                        {unitMeta?.shortLabel || item.unit}
                      </span>
                      {' · '}
                      <span>{ANGGOTA_LEVEL_LABELS[item.peranLevel]}</span>
                      {' · '}
                      <span className="tabular-nums">Urutan #{item.sortOrder}</span>
                      {!item.isActive && ' · Disembunyikan'}
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--deep-violet)', marginTop: '0.1rem' }}>
                      {item.fullName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)' }}>
                      {item.jabatan}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    aria-label={`Naikkan urutan ${item.fullName}`}
                    disabled={idx === 0}
                    onClick={() => handleMoveOrder(idx, -1, filteredItems)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #E5DDF5',
                      background: '#FAF8FF',
                      color: idx === 0 ? '#B0A4C8' : 'var(--deep-violet)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: idx === 0 ? 'default' : 'pointer',
                    }}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Turunkan urutan ${item.fullName}`}
                    disabled={idx === filteredItems.length - 1}
                    onClick={() => handleMoveOrder(idx, 1, filteredItems)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #E5DDF5',
                      background: '#FAF8FF',
                      color: idx === filteredItems.length - 1 ? '#B0A4C8' : 'var(--deep-violet)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: idx === filteredItems.length - 1 ? 'default' : 'pointer',
                    }}
                  >
                    <ArrowDown size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditForm(item)}
                    className="btn btn-outline btn-sm"
                    style={{ minHeight: '36px' }}
                  >
                    <Pencil size={13} /> Edit
                  </button>

                  {isConfirming ? (
                    <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(item.id)}
                        style={{
                          minHeight: '36px',
                          padding: '0 0.7rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#C62828',
                          color: 'white',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '36px' }}
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      aria-label={`Hapus ${item.fullName}`}
                      style={{
                        minHeight: '36px',
                        padding: '0 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid #FFCDD2',
                        background: '#FFF5F5',
                        color: '#C62828',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--mid-grey)' }}>
        <UserCheck size={14} />
        <span>Setiap perubahan anggota langsung disinkronkan secara real-time ke halaman publik Anggota OPDIM.</span>
      </div>
    </div>
  );
}
