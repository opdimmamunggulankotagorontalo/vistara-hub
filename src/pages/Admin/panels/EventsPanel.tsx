import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { EventItem } from '../../../types';
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  subscribeToTableChanges,
  updateEvent,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';
import MediaUploadField from '../MediaUploadField';

export default function EventsPanel() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('08:00');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Agenda OPDIM');
  const [status, setStatus] = useState<EventItem['status']>('upcoming');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    const records = await fetchEvents();
    setItems(records);
  };

  useEffect(() => {
    let active = true;
    fetchEvents()
      .then((records) => {
        if (active) setItems(records);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsub = subscribeToTableChanges('events', () => {
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
    setDate(new Date().toISOString().slice(0, 10));
    setTime('08:00');
    setLocation('');
    setCategory('Agenda OPDIM');
    setStatus('upcoming');
    setDescription('');
    setThumbnail('');
    setError('');
  };

  const openEditForm = (item: EventItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDate(item.date);
    setTime(item.time);
    setLocation(item.location);
    setCategory(item.category);
    setStatus(item.status);
    setDescription(item.description);
    setThumbnail(item.thumbnail || '');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim() || !location.trim() || !description.trim()) {
      setError('Judul, tanggal, lokasi, dan deskripsi agenda wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        date: date.trim(),
        time: time.trim() || '08:00',
        location: location.trim(),
        category: category.trim() || 'Agenda OPDIM',
        status,
        description: description.trim(),
        thumbnail: thumbnail.trim() || undefined,
      };
      if (editingId) {
        const updated = await updateEvent(editingId, payload);
        setItems((prev) => prev.map((ev) => (ev.id === editingId ? updated : ev)));
      } else {
        const created = await createEvent(payload);
        setItems((prev) => [created, ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan agenda event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
    setItems((prev) => prev.filter((ev) => ev.id !== id));
    if (editingId === id) {
      setShowForm(false);
      resetForm();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          Jadwal kegiatan, seminar, dan agenda resmi OPDIM (Pengurus Inti).
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
          {showForm ? <><X size={15} /> Tutup Form</> : <><Plus size={15} /> Tambah Agenda</>}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="admin-surface"
          style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--deep-violet)', margin: 0 }}>
            {editingId ? 'Edit Agenda Event' : 'Agenda Event Baru'}
          </h3>

          {error && <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>{error}</div>}

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Nama Agenda / Event *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: VISTARA Talks #3 — Kepemimpinan Muda"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
            />
          </div>

          <div className="admin-form-grid-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Tanggal *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Waktu (WITA)
              </label>
              <input
                type="text"
                placeholder="08:00"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventItem['status'])}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
              >
                <option value="upcoming">Mendatang</option>
                <option value="ongoing">Berlangsung</option>
                <option value="past">Selesai</option>
              </select>
            </div>
          </div>

          <div className="admin-form-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Lokasi *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Aula Utama MAM Unggulan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

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
          </div>

          <MediaUploadField
            label="Poster / Thumbnail Event (Opsional, Otomatis 1080p WebP)"
            folder="events"
            mode="image"
            value={thumbnail}
            onChange={(url) => setThumbnail(url)}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Deskripsi Agenda *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detail rangkaian acara atau peserta yang diharapkan hadir..."
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
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Agenda'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada agenda event"
          description="Klik 'Tambah Agenda' untuk menjadwalkan kegiatan resmi OPDIM."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {items.map((ev) => (
            <div
              key={ev.id}
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
                  {ev.category} · {ev.date} · {ev.time} WITA · {ev.location} ·{' '}
                  <strong style={{ color: ev.status === 'past' ? 'var(--mid-grey)' : '#2E7D32' }}>
                    {ev.status === 'upcoming' ? 'Mendatang' : ev.status === 'ongoing' ? 'Berlangsung' : 'Selesai'}
                  </strong>
                </div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--deep-violet)', margin: '0.15rem 0', fontWeight: 700 }}>
                  {ev.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', margin: 0 }}>
                  {ev.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => openEditForm(ev)}
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '40px' }}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ev.id)}
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
