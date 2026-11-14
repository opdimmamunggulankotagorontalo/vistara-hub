import { useEffect, useState } from 'react';
import { Search, Trash2, CheckCircle2, MessageSquare, X } from 'lucide-react';
import type { AspirasiRecord } from '../../../types';
import {
  clearAllAspirasi,
  deleteAspirasi,
  fetchAspirasi,
  subscribeToTableChanges,
  updateAspirasiAdmin,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';

const STATUS_OPTIONS: AspirasiRecord['status'][] = [
  'Diterima',
  'Ditinjau',
  'Didiskusikan',
  'Tindak Lanjut',
  'Selesai',
];

function getStatusColor(status: AspirasiRecord['status']) {
  switch (status) {
    case 'Selesai':
      return { bg: '#E8F5E9', color: '#2E7D32' };
    case 'Tindak Lanjut':
      return { bg: '#E3F2FD', color: '#1565C0' };
    case 'Didiskusikan':
      return { bg: '#EDE6F8', color: '#4A2C8A' };
    case 'Ditinjau':
      return { bg: '#FFF8E1', color: '#B78103' };
    default:
      return { bg: '#F5F0FC', color: '#6B3FA0' };
  }
}

export default function AspirasiPanel() {
  const [records, setRecords] = useState<AspirasiRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [editing, setEditing] = useState<AspirasiRecord | null>(null);
  const [nextStatus, setNextStatus] = useState<AspirasiRecord['status']>('Ditinjau');
  const [tanggapan, setTanggapan] = useState('');
  const [penindaklanjut, setPenindaklanjut] = useState('Komisi 4 OPDIM');
  const [catatanRiwayat, setCatatanRiwayat] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const loadData = async () => {
    const items = await fetchAspirasi();
    setRecords(items);
  };

  useEffect(() => {
    let active = true;
    fetchAspirasi()
      .then((items) => {
        if (active) setRecords(items);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsub = subscribeToTableChanges('aspirasi', () => {
      if (active) void loadData();
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const filtered = records.filter((r) => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = search.toLowerCase();
    const matchQuery =
      r.judul.toLowerCase().includes(q) ||
      r.kodeLacak.toLowerCase().includes(q) ||
      r.kategori.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const openEditor = (record: AspirasiRecord) => {
    setEditing(record);
    setNextStatus(record.status);
    setTanggapan(record.tanggapanResmi || '');
    setPenindaklanjut(record.penindaklanjut || 'Komisi 4 OPDIM');
    setCatatanRiwayat('');
    setFeedback('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsSaving(true);
    try {
      const updated = await updateAspirasiAdmin({
        kodeLacak: editing.kodeLacak,
        status: nextStatus,
        tanggapanResmi: tanggapan.trim(),
        penindaklanjut: penindaklanjut.trim() || 'Komisi 4 OPDIM',
        keterangan:
          catatanRiwayat.trim() || `Status diperbarui menjadi ${nextStatus} melalui Dashboard Admin.`,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditing(null);
      setFeedback(`Aspirasi ${updated.kodeLacak} berhasil diperbarui.`);
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAspirasi(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      await clearAllAspirasi();
      setRecords([]);
      setEditing(null);
      setConfirmClearAll(false);
      setFeedback('Seluruh data aspirasi berhasil dikosongkan.');
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Summary Strip */}
      <div
        className="admin-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div className="admin-surface" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>Total Masuk</div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-violet)', marginTop: '0.15rem' }}>
            {records.length}
          </div>
        </div>
        <div className="admin-surface" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>Diproses</div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--vistara-purple)', marginTop: '0.15rem' }}>
            {records.filter((r) => r.status !== 'Selesai').length}
          </div>
        </div>
        <div className="admin-surface" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)' }}>Selesai</div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2E7D32', marginTop: '0.15rem' }}>
            {records.filter((r) => r.status === 'Selesai').length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="admin-surface"
        style={{
          padding: '0.85rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.65rem',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }}
          />
          <input
            type="search"
            placeholder="Cari kode lacak atau judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              minHeight: '42px',
              padding: '0.5rem 0.85rem 0.5rem 2.35rem',
              borderRadius: '9px',
              border: '1px solid #E5DDF5',
              fontSize: '0.86rem',
              background: '#FAF8FF',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter status aspirasi"
          style={{
            minHeight: '42px',
            padding: '0.5rem 0.85rem',
            borderRadius: '9px',
            border: '1px solid #E5DDF5',
            background: 'white',
            fontSize: '0.84rem',
            color: 'var(--deep-violet)',
            outline: 'none',
          }}
        >
          <option value="all">Semua Status</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>

        {records.length > 0 && (
          confirmClearAll ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                disabled={isClearingAll}
                onClick={handleClearAll}
                style={{
                  minHeight: '42px',
                  padding: '0 0.85rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: '#C62828',
                  color: 'white',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isClearingAll ? 'Menghapus...' : 'Ya, Hapus Semua'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="btn btn-outline btn-sm"
                style={{ minHeight: '42px' }}
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              style={{
                minHeight: '42px',
                padding: '0 0.85rem',
                borderRadius: '9px',
                border: '1px solid #FFCDD2',
                background: '#FFF5F5',
                color: '#C62828',
                fontFamily: 'var(--font-header)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} /> Kosongkan Semua
            </button>
          )
        )}
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

      {/* Records */}
      {isLoading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Belum ada data aspirasi"
          description="Aspirasi yang dikirimkan oleh siswa di halaman publik akan tampil di sini untuk ditindaklanjuti."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.map((item) => {
            const stStyle = getStatusColor(item.status);
            return (
              <div
                key={item.id}
                className="admin-surface"
                style={{
                  padding: '0.95rem 1.05rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                    <div
                      className="tabular-nums"
                      style={{
                        fontFamily: 'var(--font-header)',
                        fontSize: '0.75rem',
                        color: 'var(--mid-grey)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--vistara-purple)' }}>{item.kodeLacak}</strong>
                      {' · '}
                      {item.kategori}
                      {' · '}
                      {item.tanggal}
                      {' · '}
                      {item.isAnonim ? 'Anonim' : `${item.namaPengirim || 'Siswa'} (${item.kelasPengirim || '-'})`}
                    </div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--deep-violet)', margin: 0 }}>
                      {item.judul}
                    </h3>
                  </div>

                  <span
                    style={{
                      padding: '0.28rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-header)',
                      background: stStyle.bg,
                      color: stStyle.color,
                      flexShrink: 0,
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--charcoal)', lineHeight: 1.5, margin: 0 }}>
                  {item.isi}
                </p>

                {item.tanggapanResmi && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', background: '#FAF8FF', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #EDE6F8' }}>
                    <strong style={{ color: 'var(--deep-violet)' }}>Tanggapan:</strong> {item.tanggapanResmi}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    className="btn btn-outline btn-sm"
                    style={{ minHeight: '40px' }}
                  >
                    <MessageSquare size={14} /> Tindak Lanjut
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Hapus aspirasi ${item.kodeLacak}`}
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
                      gap: '0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Moderation Modal / Sheet */}
      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Tindak lanjut ${editing.kodeLacak}`}
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
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
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
                  {editing.kodeLacak}
                </div>
                <h2 style={{ fontSize: '1.1rem', color: 'var(--deep-violet)', margin: 0 }}>
                  Perbarui Tindak Lanjut
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setEditing(null)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '9px',
                  border: '1px solid #E5DDF5',
                  background: '#FAF8FF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.35rem' }}>
                  Tahap Status
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as AspirasiRecord['status'])}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '9px',
                    border: '1px solid #D4BFEF',
                    fontSize: '0.88rem',
                    background: 'white',
                  }}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.35rem' }}>
                  Tanggapan Resmi Komisi 4
                </label>
                <textarea
                  rows={3}
                  value={tanggapan}
                  onChange={(e) => setTanggapan(e.target.value)}
                  placeholder="Tuliskan tanggapan resmi atau tindak lanjut yang terlihat oleh siswa..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '9px',
                    border: '1px solid #D4BFEF',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.35rem' }}>
                  Unit Penindaklanjut
                </label>
                <input
                  type="text"
                  value={penindaklanjut}
                  onChange={(e) => setPenindaklanjut(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '9px',
                    border: '1px solid #D4BFEF',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.35rem' }}>
                  Catatan Riwayat (Opsional)
                </label>
                <input
                  type="text"
                  value={catatanRiwayat}
                  onChange={(e) => setCatatanRiwayat(e.target.value)}
                  placeholder="Contoh: Disampaikan dalam rapat koordinasi pembina"
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '9px',
                    border: '1px solid #D4BFEF',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '44px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary btn-sm"
                  style={{ minHeight: '44px' }}
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
