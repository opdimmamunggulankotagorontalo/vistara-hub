import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  MessageCircle,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, EmptyState, LoadingState, StatusBadge } from '../../components/ui';
import type { EventItem } from '../../types';
import { ScrollReveal } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';
import {
  fetchEvents,
  fetchSavedEventIds,
  subscribeToTableChanges,
  toggleSavedEventId,
} from '../../services/dataClient';
import { downloadEventIcs } from '../../utils/icsCalendar';
import { buildWhatsAppShareUrl } from '../../utils/shareUtils';

function formatDate(d: string) {
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export default function EventPage() {
  const { reducedMotion } = useMotionSystem();
  const [searchParams] = useSearchParams();
  const highlightedSlug = searchParams.get('highlight');

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchSavedEventIds().then((ids) => {
      if (active) setSavedIds(ids);
    });
    fetchEvents()
      .then((items) => {
        if (active) setEvents(items);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsubscribe = subscribeToTableChanges('events', () => {
      fetchEvents().then((items) => {
        if (active) setEvents(items);
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const effectiveFilter = highlightedSlug ? 'all' : filter;
  const filtered = events.filter(
    (e) =>
      effectiveFilter === 'all' ||
      e.status === effectiveFilter ||
      (effectiveFilter === 'upcoming' && e.status === 'ongoing')
  );

  useEffect(() => {
    if (!highlightedSlug) return;
    const timer = setTimeout(() => {
      const target = document.getElementById(`event-${highlightedSlug}`);
      if (target) {
        target.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'center',
        });
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [highlightedSlug, reducedMotion]);

  const handleToggleSave = async (id: string) => {
    const currentlySaved = savedIds.includes(id);
    setSavedIds((prev) =>
      currentlySaved ? prev.filter((item) => item !== id) : [...prev, id]
    );
    const updatedIds = await toggleSavedEventId(id, currentlySaved);
    setSavedIds(updatedIds);
  };

  const handleDownloadIcs = (event: EventItem) => {
    const ok = downloadEventIcs(event);
    if (ok) {
      setDownloadedId(event.id);
      setTimeout(() => setDownloadedId((prev) => (prev === event.id ? null : prev)), 2200);
    }
  };

  return (
    <div>
      <PageHeader
        title="Agenda & Event"
        subtitle="Jadwal kegiatan, seminar, lomba, dan agenda resmi OPDIM VISTARA 2026–2027."
        breadcrumbs={[{ label: 'Event' }]}
      />

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          {/* Filter tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.35rem',
              marginBottom: '2rem',
              padding: '0.3rem',
              background: 'var(--ghost-purple)',
              borderRadius: '12px',
              border: '1px solid var(--pale-lilac)',
              width: 'fit-content',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Semua Event', value: 'all' as const },
              { label: 'Mendatang', value: 'upcoming' as const },
              { label: 'Sudah Berlalu', value: 'past' as const },
            ].map((opt) => {
              const isActive = effectiveFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  aria-pressed={isActive}
                  style={{
                    position: 'relative',
                    padding: '0.5rem 1.25rem',
                    minHeight: '44px',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-header)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    background: 'transparent',
                    color: isActive ? 'white' : 'var(--mid-grey)',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="event-filter-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '9px',
                        background: 'var(--vistara-purple)',
                        zIndex: 0,
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Events list */}
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Belum ada agenda event"
              description="Agenda kegiatan resmi yang dijadwalkan Pengurus Inti OPDIM akan tampil di halaman ini."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filtered.map((event, idx) => {
              const isHighlighted = highlightedSlug === event.slug;
              const isSaved = savedIds.includes(event.id);
              const isDownloaded = downloadedId === event.id;
              const shareUrl =
                typeof window !== 'undefined'
                  ? `${window.location.origin}/beranda/event?highlight=${encodeURIComponent(event.slug)}`
                  : `/beranda/event?highlight=${encodeURIComponent(event.slug)}`;
              const waHref = buildWhatsAppShareUrl({
                title: event.title,
                summary: `${formatDate(event.date)} · ${event.time} WITA di ${event.location}`,
                url: shareUrl,
                tag: 'Agenda VISTARA',
              });

              return (
                <ScrollReveal key={event.id} preset="fadeUp" delay={idx * 0.05}>
                  <article
                    id={`event-${event.slug}`}
                    className={`card event-card-row ${isHighlighted ? 'animate-highlight' : ''}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: '1.25rem',
                      alignItems: 'center',
                      padding: '1.5rem',
                      opacity: event.status === 'past' && !isHighlighted ? 0.85 : 1,
                      border: isHighlighted
                        ? '2px solid var(--vistara-purple)'
                        : '1px solid var(--pale-lilac)',
                      background: isHighlighted ? 'var(--ghost-purple)' : 'white',
                    }}
                  >
                    {/* Date block */}
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '12px',
                        background:
                          event.status === 'past'
                            ? 'var(--lavender-mist)'
                            : 'linear-gradient(135deg, var(--deep-violet), var(--vistara-purple))',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: event.status === 'past' ? 'var(--mid-grey)' : 'white',
                      }}
                    >
                      <div
                        className="tabular-nums"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          fontSize: '1.35rem',
                          lineHeight: 1,
                        }}
                      >
                        {new Date(event.date).getDate()}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-header)',
                          fontSize: '0.65rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          opacity: 0.85,
                        }}
                      >
                        {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(
                          new Date(event.date)
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <Badge variant="ghost">{event.category}</Badge>
                        <StatusBadge status={event.status} />
                        {isHighlighted && (
                          <Badge variant="gold">Dipilih dari Pencarian</Badge>
                        )}
                      </div>
                      <h2
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          color: 'var(--deep-violet)',
                          lineHeight: 1.3,
                          marginBottom: '0.5rem',
                        }}
                      >
                        {event.title}
                      </h2>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--mid-grey)',
                          lineHeight: 1.5,
                          marginBottom: '0.75rem',
                        }}
                      >
                        {event.description}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.9rem',
                          fontFamily: 'var(--font-header)',
                          fontSize: '0.78rem',
                          color: 'var(--mid-grey)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={13} />
                          {formatDate(event.date)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={13} />
                          {event.time} WITA
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <MapPin size={13} />
                          {event.location}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Reminder, Add to Calendar (.ics), WhatsApp Share */}
                    <div
                      className="event-card-action"
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {event.status !== 'past' && (
                        <>
                          <motion.button
                            type="button"
                            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                            onClick={() => handleToggleSave(event.id)}
                            className={`btn btn-sm ${isSaved ? 'btn-gold' : 'btn-outline'}`}
                            aria-pressed={isSaved}
                            style={{ minHeight: '44px' }}
                          >
                            {isSaved ? (
                              <>
                                <BookmarkCheck size={14} /> Tersimpan
                              </>
                            ) : (
                              <>
                                <Bookmark size={14} /> Pengingat
                              </>
                            )}
                          </motion.button>

                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(event)}
                            aria-label={`Tambah "${event.title}" ke kalender (.ics)`}
                            className="btn btn-sm"
                            style={{
                              minHeight: '44px',
                              background: isDownloaded ? '#E8F5E9' : 'var(--lavender-mist)',
                              color: isDownloaded ? '#2E7D32' : 'var(--deep-violet)',
                              border: '1px solid var(--pale-lilac)',
                            }}
                          >
                            {isDownloaded ? (
                              <>
                                <Check size={14} /> Terunduh (.ics)
                              </>
                            ) : (
                              <>
                                <CalendarPlus size={14} /> Kalender (.ics)
                              </>
                            )}
                          </button>
                        </>
                      )}

                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Bagikan agenda "${event.title}" ke WhatsApp`}
                        className="btn btn-sm"
                        style={{
                          minHeight: '44px',
                          background: '#1E8449',
                          color: 'white',
                        }}
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 767px) {
          .event-card-row {
            grid-template-columns: auto 1fr !important;
          }
          .event-card-action {
            grid-column: 1 / -1;
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}
