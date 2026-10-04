import { useState } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge, StatusBadge } from '../../components/ui';
import { eventData } from '../../data';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
}

export default function EventPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const filtered = eventData.filter(e => filter === 'all' || e.status === filter || (filter === 'upcoming' && e.status === 'ongoing'));

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
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', padding: '0.25rem', background: 'var(--ghost-purple)', borderRadius: '12px', width: 'fit-content' }}>
            {[
              { label: 'Semua Event', value: 'all' },
              { label: 'Mendatang', value: 'upcoming' },
              { label: 'Sudah Berlalu', value: 'past' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value as any)}
                aria-pressed={filter === opt.value}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-header)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  background: filter === opt.value ? 'var(--vistara-purple)' : 'transparent',
                  color: filter === opt.value ? 'white' : 'var(--mid-grey)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Events list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filtered.map((event) => (
              <article
                key={event.id}
                className="card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1.5rem',
                  alignItems: 'center',
                  padding: '1.5rem',
                  opacity: event.status === 'past' ? 0.75 : 1,
                }}
              >
                {/* Date block */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: event.status === 'past' ? 'var(--lavender-mist)' : 'linear-gradient(135deg, var(--deep-violet), var(--vistara-purple))',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: event.status === 'past' ? 'var(--mid-grey)' : 'white',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.35rem', lineHeight: 1 }}>
                    {new Date(event.date).getDate()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
                    {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(event.date))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <Badge variant="ghost">{event.category}</Badge>
                    <StatusBadge status={event.status} />
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--deep-violet)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                    {event.title}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.5, marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {event.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontFamily: 'var(--font-header)', fontSize: '0.78rem', color: 'var(--mid-grey)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={13} />{formatDate(event.date)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={13} />{event.time} WITA</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><MapPin size={13} />{event.location}</span>
                  </div>
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0, display: 'none' }} id="event-action">
                  {event.status !== 'past' && (
                    <button className="btn btn-primary btn-sm" disabled aria-label="Daftar event (segera hadir)">
                      Daftar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 640px) {
          #event-action { display: block !important; }
        }
        @media (max-width: 639px) {
          article[class="card"] { grid-template-columns: auto 1fr !important; }
        }
      `}</style>
    </div>
  );
}
