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
  const [showFormModal, setShowFormModal] = useState(false);
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

  useEffect(() => {
    if (!showFormModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFormModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showFormModal]);

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
    setShowFormModal(true);
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
    setShowFormModal(true);
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
      setShowFormModal(false);
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
      setShowFormModal(false);
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
      <style>{`
        .anggota-admin-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.65rem;
        }
        .anggota-admin-tabs {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem;
          border-radius: 10px;
          background: #F2ECFC;
          border: 1px solid #E5DDF5;
        }
        .anggota-admin-card {
          padding: 0.9rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }
        .anggota-admin-card-info {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          min-width: 0;
          flex: 1 1 250px;
        }
        .anggota-admin-card-actions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        @media (max-width: 639px) {
          .anggota-admin-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .anggota-admin-tabs {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .anggota-admin-tabs > button {
            width: 100%;
            justify-content: center;
          }
          .anggota-admin-add-btn {
            width: 100%;
            justify-content: center;
          }
          .anggota-admin-card {
            flex-direction: column;
            align-items: stretch;
            gap: 0.7rem;
          }
          .anggota-admin-card-info {
            flex: 0 0 auto;
            width: 100%;
            align-items: flex-start;
          }
          .anggota-admin-card-actions {
            width: 100%;
            padding-top: 0.65rem;
            border-top: 1px solid #F0EAFA;
            display: grid;
            grid-template-columns: 40px 40px minmax(0, 1fr) auto;
            gap: 0.4rem;
          }
        }
      `}</style>

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

      {/* Segmented View Tabs + Add CTA */}
      <div className="anggota-admin-toolbar">
        <div
          className="anggota-admin-tabs"
          role="tablist"
          aria-label="Tampilan menu Anggota OPDIM"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === 'list'}
            onClick={() => setViewTab('list')}
            style={{
              minHeight: '40px',
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
              whiteSpace: 'nowrap',
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
              minHeight: '40px',
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
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: viewTab === 'chart' ? '0 1px 4px rgba(46,26,71,0.08)' : 'none',
            }}
          >
            <Network size={15} /> Bagan Struktur
          </button>
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="btn btn-primary btn-sm anggota-admin-add-btn"
          style={{ minHeight: '42px', whiteSpace: 'nowrap' }}
        >
          <Plus size={15} /> Tambah Anggota
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
        <div className="admin-surface" style={{ padding: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <OrgStructureCanvas
            members={items.filter((i) => i.isActive)}
            selectedNode={chartSelectedNode}
            onSelectNode={(node) =>
              setChartSelectedNode((prev) => (prev === node ? null : node))
            }
            onSelectMember={(member) => openEditForm(member)}
          />
        </div>
      ) : (
        <>
          {/* Search & Scrollable Single-Line Unit Filter Bar */}
          <div className="admin-surface" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pengurus, Kepala Madrasah, Pembina, atau jabatan..."
                style={{
                  width: '100%',
                  minHeight: '44px',
                  padding: searchQuery ? '0.5rem 2.5rem 0.5rem 2.35rem' : '0.5rem 0.85rem 0.5rem 2.35rem',
                  borderRadius: '9px',
                  border: '1px solid #D4BFEF',
                  fontSize: '0.88rem',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Hapus pencarian anggota"
                  onClick={() => setSearchQuery('')}
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
                  <X size={15} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.15rem', scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setUnitFilter('all')}
                style={{
                  minHeight: '38px',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '8px',
                  border: unitFilter === 'all' ? '1px solid var(--vistara-purple)' : '1px solid #E5DDF5',
                  background: unitFilter === 'all' ? 'var(--deep-violet)' : '#FAF8FF',
                  color: unitFilter === 'all' ? 'white' : 'var(--deep-violet)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
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
                      minHeight: '38px',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '8px',
                      border: active ? '1px solid var(--vistara-purple)' : '1px solid #E5DDF5',
                      background: active ? 'var(--deep-violet)' : '#FAF8FF',
                      color: active ? 'white' : 'var(--deep-violet)',
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredItems.map((item, idx) => {
                const unitMeta = ANGGOTA_UNIT_META[item.unit];
                const isConfirming = confirmDeleteId === item.id;
                return (
                  <div
                    key={item.id}
                    className="admin-surface anggota-admin-card"
                    style={{ opacity: item.isActive ? 1 : 0.68 }}
                  >
                    <div className="anggota-admin-card-info">
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
                          <span className="tabular-nums">#{item.sortOrder}</span>
                          {!item.isActive && ' · Disembunyikan'}
                        </div>
                        <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--deep-violet)', marginTop: '0.1rem', lineHeight: 1.25 }}>
                          {item.fullName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)', marginTop: '0.1rem' }}>
                          {item.jabatan}
                        </div>
                      </div>
                    </div>

                    <div className="anggota-admin-card-actions">
                      <button
                        type="button"
                        aria-label={`Naikkan urutan ${item.fullName}`}
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(idx, -1, filteredItems)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '9px',
                          border: '1px solid #E5DDF5',
                          background: '#FAF8FF',
                          color: idx === 0 ? '#B0A4C8' : 'var(--deep-violet)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: idx === 0 ? 'default' : 'pointer',
                        }}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Turunkan urutan ${item.fullName}`}
                        disabled={idx === filteredItems.length - 1}
                        onClick={() => handleMoveOrder(idx, 1, filteredItems)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '9px',
                          border: '1px solid #E5DDF5',
                          background: '#FAF8FF',
                          color: idx === filteredItems.length - 1 ? '#B0A4C8' : 'var(--deep-violet)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: idx === filteredItems.length - 1 ? 'default' : 'pointer',
                        }}
                      >
                        <ArrowDown size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '40px', justifyContent: 'center', whiteSpace: 'nowrap' }}
                      >
                        <Pencil size={14} /> Edit Anggota
                      </button>

                      {isConfirming ? (
                        <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(item.id)}
                            style={{
                              minHeight: '40px',
                              padding: '0 0.7rem',
                              borderRadius: '9px',
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
                            style={{ minHeight: '40px' }}
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
                            minWidth: '40px',
                            minHeight: '40px',
                            padding: '0 0.65rem',
                            borderRadius: '9px',
                            border: '1px solid #FFCDD2',
                            background: '#FFF5F5',
                            color: '#C62828',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={15} />
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

      {/* Add / Edit Anggota Popup Modal */}
      {showFormModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? `Edit data ${fullName}` : 'Tambah Personel Baru ke Struktur OPDIM'}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 92,
            background: 'rgba(15, 10, 30, 0.56)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.85rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFormModal(false);
              resetForm();
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90dvh',
              overflow: 'hidden',
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5DDF5',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.15rem 0.75rem', borderBottom: '1px solid #EDE6F8', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--vistara-purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {editingId ? 'Sunting Personel' : 'Personel Baru'}
                </div>
                <h3 style={{ fontSize: '1.08rem', color: 'var(--deep-violet)', margin: 0 }}>
                  {editingId ? 'Edit Data Anggota / Pimpinan' : 'Tambah Anggota OPDIM'}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Tutup popup anggota"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid #E5DDF5',
                  background: '#FAF8FF',
                  color: 'var(--deep-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 auto',
                minHeight: 0,
              }}
            >
              <div
                style={{
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  padding: '0.9rem 1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {error && (
                  <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>
                    {error}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                    Nama Lengkap &amp; Gelar (Jika Ada) *
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

                <div className="admin-form-grid-2">
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
                </div>

                <div className="admin-form-grid-2">
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

                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.35rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--charcoal)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--vistara-purple)' }}
                      />
                      <span>Tampilkan di halaman publik</span>
                    </label>
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
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '0.8rem 1.15rem 1rem', borderTop: '1px solid #EDE6F8', background: '#FFFFFF', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '44px', flex: '1 1 auto', justifyContent: 'center' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary btn-sm"
                  style={{ minHeight: '44px', flex: '2 1 auto', justifyContent: 'center' }}
                >
                  {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
