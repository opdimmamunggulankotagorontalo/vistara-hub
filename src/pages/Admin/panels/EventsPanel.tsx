import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, Search } from 'lucide-react';
import type { EventItem } from '../../../types';
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  subscribeToTableChanges,
  updateEvent,
} from '../../../services/dataClient';
import { EmptyState, LoadingState, StatusBadge } from '../../../components/ui';
import RichTextRenderer from '../../../components/ui/RichTextRenderer';
import EditorialWorkspaceShell from '../../../components/admin/EditorialWorkspaceShell';
import RichTextDocEditor from '../../../components/admin/RichTextDocEditor';
import MediaUploadField from '../MediaUploadField';
import { richTextToPlainText, sanitizeRichHtml } from '../../../utils/richText';

interface EventDraft {
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  status: EventItem['status'];
  description: string;
  thumbnail: string;
}

function createEmptyDraft(): EventDraft {
  return {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '08:00',
    location: '',
    category: 'Agenda OPDIM',
    status: 'upcoming',
    description: '',
    thumbnail: '',
  };
}

export default function EventsPanel() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>(createEmptyDraft);
  const [initialSnapshot, setInitialSnapshot] = useState<string>(() => JSON.stringify(createEmptyDraft()));
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

  const openEditEditor = (item: EventItem) => {
    const next: EventDraft = {
      title: item.title,
      date: item.date,
      time: item.time,
      location: item.location,
      category: item.category,
      status: item.status,
      description: item.description,
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
    const plainDesc = richTextToPlainText(draft.description);
    if (!draft.title.trim() || !draft.date.trim() || !draft.location.trim() || !plainDesc) {
      setError('Nama agenda, tanggal, lokasi, dan deskripsi rangkaian acara wajib diisi.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const cleanedDescription = sanitizeRichHtml(draft.description) || plainDesc;
      const payload = {
        title: draft.title.trim(),
        date: draft.date.trim(),
        time: draft.time.trim() || '08:00',
        location: draft.location.trim(),
        category: draft.category.trim() || 'Agenda OPDIM',
        status: draft.status,
        description: cleanedDescription,
        thumbnail: draft.thumbnail.trim() || undefined,
      };
      if (editingId) {
        const updated = await updateEvent(editingId, payload);
        setItems((prev) => prev.map((ev) => (ev.id === editingId ? updated : ev)));
      } else {
        const created = await createEvent(payload);
        setItems((prev) => [created, ...prev]);
      }
      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan agenda event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
    setItems((prev) => prev.filter((ev) => ev.id !== id));
    setConfirmDeleteId(null);
    if (editingId === id) {
      closeEditor();
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q) ||
        richTextToPlainText(ev.description).toLowerCase().includes(q)
    );
  }, [items, search]);

  if (viewMode === 'editor') {
    return (
      <EditorialWorkspaceShell
        docTypeLabel="Event"
        isEditing={Boolean(editingId)}
        isDirty={isDirty}
        isSaving={isSaving}
        saveLabel={editingId ? 'Simpan Perubahan' : 'Terbitkan Agenda'}
        error={error}
        onBack={closeEditor}
        onSave={handleSave}
        documentColumn={
          <>
            <div>
              <label
                htmlFor="event-doc-title"
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
                Nama Agenda / Event *
              </label>
              <textarea
                id="event-doc-title"
                rows={2}
                placeholder="Contoh: VISTARA Talks #3 — Kepemimpinan Muda"
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
              label="Deskripsi & Rundown Acara *"
              ariaLabel="Editor deskripsi agenda event"
              value={draft.description}
              minHeight={320}
              placeholder='Tuliskan deskripsi kegiatan, syarat peserta, atau poin rundown acara... Ketik "- " untuk daftar rundown atau Ctrl+K untuk tautan pendaftaran.'
              onChange={(html) => setDraft((prev) => ({ ...prev, description: html }))}
              onShortcutSave={handleSave}
            />
          </>
        }
        settingsColumn={
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div className="admin-form-grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Waktu (WITA)
                </label>
                <input
                  type="text"
                  placeholder="08:00"
                  value={draft.time}
                  onChange={(e) => setDraft((prev) => ({ ...prev, time: e.target.value }))}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                  Status
                </label>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as EventItem['status'] }))}
                  style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem', background: 'white' }}
                >
                  <option value="upcoming">Mendatang</option>
                  <option value="ongoing">Berlangsung</option>
                  <option value="past">Selesai</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Lokasi *
              </label>
              <input
                type="text"
                placeholder="Contoh: Aula Utama MAM Unggulan"
                value={draft.location}
                onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

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

            <MediaUploadField
              label="Poster / Thumbnail Event (Opsional)"
              folder="events"
              mode="image"
              value={draft.thumbnail}
              onChange={(url) => setDraft((prev) => ({ ...prev, thumbnail: url }))}
            />
          </>
        }
        previewNode={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--vistara-purple)' }}>
                {draft.category || 'Agenda OPDIM'}
              </span>
              <StatusBadge status={draft.status} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-violet)', margin: 0, lineHeight: 1.3 }}>
              {draft.title.trim() || 'Nama Agenda / Event Belum Diisi'}
            </h2>

            {draft.thumbnail && (
              <div style={{ height: 'clamp(160px, 28vw, 240px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5DDF5' }}>
                <img
                  src={draft.thumbnail}
                  alt={draft.title || 'Poster Event'}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--mid-grey)', padding: '0.75rem 0.9rem', borderRadius: '10px', background: '#FAF8FF', border: '1px solid #E5DDF5' }}>
              <span className="tabular-nums" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} /> {draft.date || '-'}
              </span>
              <span className="tabular-nums" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} /> {draft.time || '08:00'} WITA
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={14} /> {draft.location || 'Lokasi belum diisi'}
              </span>
            </div>

            {draft.description.trim() ? (
              <RichTextRenderer content={draft.description} compact />
            ) : (
              <p style={{ color: 'var(--mid-grey)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Belum ada deskripsi agenda. Tulis detail kegiatan di tab Tulis.
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
          Jadwal kegiatan, seminar, dan agenda resmi OPDIM (Pengurus Inti).
        </div>
        <button
          type="button"
          onClick={openNewEditor}
          className="btn btn-primary btn-sm"
          style={{ minHeight: '44px' }}
        >
          <Plus size={15} /> Tambah Agenda
        </button>
      </div>

      {items.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama agenda, lokasi, atau kategori..."
            aria-label="Cari agenda event"
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
          title={items.length === 0 ? 'Belum ada agenda event' : 'Agenda tidak ditemukan'}
          description={
            items.length === 0
              ? 'Klik "Tambah Agenda" untuk menyusun detail agenda melalui Studio Editorial.'
              : 'Coba ubah kata kunci pencarian untuk melihat agenda lain.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {filteredItems.map((ev) => {
            const isConfirming = confirmDeleteId === ev.id;
            const plainDesc = richTextToPlainText(ev.description);
            const statusText =
              ev.status === 'upcoming' ? 'Mendatang' : ev.status === 'ongoing' ? 'Berlangsung' : 'Selesai';
            return (
              <div
                key={ev.id}
                className="admin-surface"
                style={{
                  padding: '0.95rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                  {ev.thumbnail && (
                    <img
                      src={ev.thumbnail}
                      alt={ev.title}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '60px',
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
                      {ev.category} · {ev.date} · {ev.time} WITA ·{' '}
                      <span style={{ color: ev.status === 'past' ? 'var(--mid-grey)' : '#2E7D32' }}>
                        {statusText}
                      </span>
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
                      {ev.title}
                    </h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--charcoal)', fontWeight: 600, marginBottom: '0.2rem' }}>
                      Lokasi: {ev.location}
                    </div>
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
                      {plainDesc}
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
                        Hapus agenda ini?
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
                        onClick={() => void handleDelete(ev.id)}
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
                        onClick={() => openEditEditor(ev)}
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: '42px', flex: '1 1 110px', maxWidth: '160px' }}
                      >
                        <Pencil size={14} /> Buka Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(ev.id)}
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
