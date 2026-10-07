import { Link } from 'react-router-dom';
import {
  ArrowRight, Megaphone, Newspaper, Calendar, Trophy,
  Image, BookOpen, Users, Zap
} from 'lucide-react';
import { SectionHeading, Badge, StatusBadge } from '../../components/ui';
import { programKerjaData, beritaData, eventData, prestasiData } from '../../data';

// ─── Helper: format tanggal ───────────────────────────────────
function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
}

// ─── Stat Item ────────────────────────────────────────────────
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'rgba(185,154,225,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
        {label}
      </div>
    </div>
  );
}

export default function BerandaPage() {
  const recentBerita = beritaData.slice(0, 3);
  const upcomingEvents = eventData.filter(e => e.status !== 'past').slice(0, 3);
  const latestPrestasi = prestasiData.slice(0, 3);
  const featuredProker = programKerjaData.slice(0, 4);

  return (
    <div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-title"
        className="bg-gradient-mesh"
        style={{ position: 'relative', overflow: 'hidden', paddingTop: '6rem', paddingBottom: '5rem' }}
      >
        {/* Decorative elements */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', border: '1px solid rgba(185,154,225,0.08)', top: '-200px', right: '-100px' }} />
          <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(185,154,225,0.06)', top: '-50px', right: '100px' }} />
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.08 }} viewBox="0 0 1440 700" fill="none">
            <line x1="300" y1="0" x2="720" y2="500" stroke="#DA82FF" strokeWidth="0.8" />
            <line x1="720" y1="500" x2="1140" y2="0" stroke="#DA82FF" strokeWidth="0.8" />
            <polygon points="720,450 760,530 720,610 680,530" stroke="#B99AE1" strokeWidth="0.6" fill="rgba(185,154,225,0.03)" />
          </svg>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '2rem', alignItems: 'center' }}>
            {/* Left: Text content */}
            <div style={{ maxWidth: '680px', position: 'relative' }}>
              {/* Background Watermark Logo VISTARA for Mobile */}
              <div
                className="hero-mobile-logo"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '15px',
                  width: '220px',
                  height: '220px',
                  pointerEvents: 'none',
                  zIndex: 0,
                  opacity: 0.16,
                  filter: 'drop-shadow(0 0 24px rgba(185, 154, 225, 0.4))',
                  userSelect: 'none',
                }}
              >
                <img
                  src="/logo-vistara.svg"
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(185,154,225,0.12)', border: '1px solid rgba(185,154,225,0.3)', borderRadius: '100px', padding: '0.3rem 1rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--soft-lilac)', boxShadow: '0 0 6px var(--soft-lilac)' }} />
                    <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--soft-lilac)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Platform Digital Resmi
                    </span>
                  </div>
                  <span className="badge badge-gold">OPDIM VISTARA 2026–2027</span>
                </div>

              {/* Organization name */}
              <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.85rem', letterSpacing: '0.2em', color: 'rgba(185,154,225,0.7)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                OPDIM MAM Unggulan Kota Gorontalo
              </div>

              {/* Main title */}
              <h1
                id="hero-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                  color: 'white',
                  lineHeight: 0.95,
                  letterSpacing: '-0.04em',
                  marginBottom: '1.25rem',
                }}
              >
                VISTARA
                <br />
                <span style={{ color: 'var(--soft-lilac)', fontSize: '0.55em', fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Hub
                </span>
              </h1>

              {/* Slogan */}
              <div style={{ borderLeft: '3px solid var(--soft-lilac)', paddingLeft: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1rem, 2vw, 1.35rem)', color: 'white', lineHeight: 1.3 }}>
                  "Satu Pilihan Seribu Perubahan"
                </div>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', color: 'var(--pale-lilac)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.4rem' }}>
                  Slogan Resmi Periode Kepengurusan
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '540px' }}>
                Rumah digital resmi OPDIM VISTARA — pusat publikasi, aspirasi siswa, dokumentasi, dan arsip kepengurusan yang transparan untuk seluruh warga MAM Unggulan.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/beranda/aspirasi" className="btn btn-primary btn-lg" id="hero-cta-aspirasi">
                  <Megaphone size={18} />
                  Sampaikan Aspirasi
                </Link>
                <Link to="/beranda/tentang" className="btn btn-ghost btn-lg" id="hero-cta-tentang">
                  Tentang VISTARA
                  <ArrowRight size={18} />
                </Link>
                </div>
              </div>
            </div>

            {/* Right: TARA mascot */}
            <div
              aria-hidden="true"
              className="animate-float"
              style={{ display: 'none', flexShrink: 0 }}
              id="hero-mascot"
            >
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,114,204,0.35) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                <img
                  src="/maskot-tara.png"
                  alt="TARA — Maskot OPDIM VISTARA"
                  style={{ height: '260px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(15,10,30,0.8))', position: 'relative', zIndex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ marginTop: '4rem', paddingTop: '2.5rem', borderTop: '1px solid rgba(185,154,225,0.12)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '2rem' }}>
            <StatItem value="5" label="Komisi Aktif" />
            <StatItem value="20+" label="Program Kerja" />
            <StatItem value="6" label="Prestasi 2026" />
            <StatItem value="400+" label="Siswa MAM" />
          </div>
        </div>

        <style>{`
          @media (min-width: 768px) {
            #hero-mascot { display: flex !important; }
            .hero-mobile-logo { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── PROGRAM KERJA HIGHLIGHT ────────────────────────── */}
      <section
        aria-labelledby="proker-title"
        className="section"
        style={{ background: 'var(--warm-white)' }}
      >
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <SectionHeading
              label="Program Kerja"
              title="Gerak Nyata"
              highlight="VISTARA"
              subtitle="Highlight program unggulan yang sedang berjalan dan direncanakan."
            />
            <Link to="/beranda/program-kerja" className="btn btn-outline btn-sm" id="proker-see-all">
              Lihat Semua <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {featuredProker.map((proker, i) => (
              <article
                key={proker.id}
                className="card"
                style={{ animationDelay: `${i * 100}ms`, border: `1px solid var(--pale-lilac)` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <span
                      className="badge"
                      style={{ background: `${proker.komisiColor}20`, color: proker.komisiColor, border: `1px solid ${proker.komisiColor}40`, fontSize: '0.65rem' }}
                    >
                      {proker.komisi}
                    </span>
                    {proker.frekuensi && (
                      <span
                        className="badge"
                        style={{ background: 'var(--lavender-mist)', color: 'var(--royal-purple)', border: '1px solid var(--pale-lilac)', fontSize: '0.62rem' }}
                      >
                        {proker.frekuensi}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={proker.status} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--deep-violet)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  {proker.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.6, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {proker.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--pale-lilac)' }}>
                  <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)' }}>{proker.timeline}</span>
                  <Link
                    to={`/beranda/program-kerja/${proker.slug}`}
                    style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--vistara-purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                  >
                    Detail <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASPIRASI CTA ──────────────────────────────────────── */}
      <section aria-labelledby="aspirasi-cta-title" className="bg-gradient-brand" style={{ padding: '5rem 0', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(185,154,225,0.05)', right: '-100px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="section-label section-label-light" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            Pusat Aspirasi
          </div>
          <h2 id="aspirasi-cta-title" style={{ color: 'white', marginBottom: '1rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Suaramu Penting untuk
            <span style={{ color: 'var(--gold-soft)' }}> OPDIM</span>
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(185,154,225,0.85)', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Sampaikan aspirasi, saran, dan masukanmu kepada OPDIM VISTARA. Setiap suara dicatat, ditindaklanjuti, dan dilaporkan secara transparan.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/beranda/aspirasi" className="btn btn-gold btn-lg" id="cta-aspirasi-btn">
              <Megaphone size={18} />
              Sampaikan Aspirasi Sekarang
            </Link>
            <Link to="/beranda/program-kerja" className="btn btn-ghost btn-lg">
              Lihat Program Kerja
            </Link>
          </div>
        </div>
      </section>

      {/* ── BERITA TERBARU ─────────────────────────────────────── */}
      <section aria-labelledby="berita-title" className="section" style={{ background: 'var(--ghost-purple)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <SectionHeading
              label="Berita Terbaru"
              title="Kabar dari"
              highlight="VISTARA"
            />
            <Link to="/beranda/berita" className="btn btn-outline btn-sm" id="berita-see-all">
              Semua Berita <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {recentBerita.map((berita, i) => (
              <article key={berita.id} className="card" style={{ animationDelay: `${i * 100}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Badge variant="ghost">{berita.category}</Badge>
                  <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--light-grey)' }}>
                    {formatDate(berita.date)}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--deep-violet)', marginBottom: '0.5rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {berita.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                  {berita.excerpt}
                </p>
                <Link
                  to={`/beranda/berita/${berita.slug}`}
                  style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--vistara-purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                >
                  Baca Selengkapnya <ArrowRight size={13} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENT + PRESTASI ROW ──────────────────────────────── */}
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>

            {/* Events */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div className="section-label"><Calendar size={14} /> Agenda Terdekat</div>
                  <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Event VISTARA</h2>
                </div>
                <Link to="/beranda/event" className="btn btn-outline btn-sm" id="event-see-all">
                  Semua <ArrowRight size={13} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: 'var(--lavender-mist)', borderRadius: '10px', padding: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={18} style={{ color: 'var(--vistara-purple)' }} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--deep-violet)', lineHeight: 1.3, marginBottom: '0.25rem' }}>
                        {event.title}
                      </h4>
                      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)' }}>
                        {formatDate(event.date)} · {event.time} WITA
                      </div>
                      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--light-grey)', marginTop: '0.2rem' }}>
                        📍 {event.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prestasi */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div className="section-label"><Trophy size={14} /> Prestasi Terbaru</div>
                  <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Kebanggaan MAM</h2>
                </div>
                <Link to="/beranda/prestasi" className="btn btn-outline btn-sm" id="prestasi-see-all">
                  Semua <ArrowRight size={13} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {latestPrestasi.map((prestasi) => (
                  <div key={prestasi.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                      {prestasi.medali === 'emas' || prestasi.medali === 'juara1' ? '🥇'
                        : prestasi.medali === 'perak' || prestasi.medali === 'juara2' ? '🥈'
                        : prestasi.medali === 'perunggu' || prestasi.medali === 'juara3' ? '🥉'
                        : '🏅'}
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--deep-violet)', lineHeight: 1.3, marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {prestasi.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Badge variant="ghost">{prestasi.tingkat}</Badge>
                        <Badge variant="outline">{prestasi.tahun}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK LINKS GRID ─────────────────────────────────── */}
      <section aria-labelledby="quick-links-title" className="section bg-gradient-mesh" style={{ position: 'relative' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <SectionHeading
            label="Eksplorasi"
            title="Jelajahi VISTARA Hub"
            subtitle="Semua fitur platform dalam satu tempat."
            align="center"
            dark
          />

          <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { icon: <BookOpen size={22} />, label: 'Tentang OPDIM', desc: 'Visi, misi, dan sejarah', href: '/beranda/tentang', color: '#6B3FA0' },
              { icon: <Zap size={22} />, label: 'Program Kerja', desc: 'Agenda & rencana aksi', href: '/beranda/program-kerja', color: '#4A2C8A' },
              { icon: <Megaphone size={22} />, label: 'Aspirasi', desc: 'Suarakan pendapatmu', href: '/beranda/aspirasi', color: '#C9A84C' },
              { icon: <Newspaper size={22} />, label: 'Berita', desc: 'Kabar terkini OPDIM', href: '/beranda/berita', color: '#845CBC' },
              { icon: <Image size={22} />, label: 'Galeri', desc: 'Dokumentasi kegiatan', href: '/beranda/galeri', color: '#9B72CC' },
              { icon: <Calendar size={22} />, label: 'Event', desc: 'Agenda & jadwal', href: '/beranda/event', color: '#4A2C8A' },
              { icon: <Trophy size={22} />, label: 'Prestasi', desc: 'Capaian membanggakan', href: '/beranda/prestasi', color: '#6B3FA0' },
              { icon: <Users size={22} />, label: 'Kontak', desc: 'Hubungi OPDIM', href: '/beranda/kontak', color: '#845CBC' },
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="glass"
                  style={{
                    borderRadius: '14px',
                    padding: '1.25rem',
                    transition: 'all var(--transition-base)',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(107,63,160,0.3)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${item.color}30`, border: `1px solid ${item.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--soft-lilac)' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'white', marginBottom: '0.2rem' }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(185,154,225,0.7)' }}>
                      {item.desc}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'rgba(185,154,225,0.5)', marginTop: 'auto' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALERI SNIPPET ───────────────────────────────────── */}
      <section aria-labelledby="galeri-snippet-title" className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <SectionHeading
              label="Galeri"
              title="Dokumentasi"
              highlight="Pilihan"
            />
            <Link to="/beranda/galeri" className="btn btn-outline btn-sm" id="galeri-see-all">
              Lihat Galeri <ArrowRight size={14} />
            </Link>
          </div>

          {/* Galeri grid placeholder — 4 tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Pelantikan VISTARA', count: 48, date: '15 Sep 2026' },
              { label: 'Raker Perdana', count: 32, date: '22 Sep 2026' },
              { label: 'VISTARA Talks #1', count: 24, date: '3 Okt 2026' },
              { label: 'Green Campus', count: 18, date: '2 Okt 2026' },
            ].map((item, i) => (
              <Link
                key={i}
                to="/beranda/galeri"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    aspectRatio: '4/3',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, hsl(${260 + i * 10}, 50%, ${20 + i * 5}%) 0%, hsl(${280 + i * 10}, 60%, ${30 + i * 5}%) 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform var(--transition-base)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                    <Image size={48} color="white" />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'white', lineHeight: 1.3, marginBottom: '0.25rem' }}>
                      {item.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>{item.count} foto</span>
                      <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{item.date}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARA MASCOT SECTION ──────────────────────────────── */}
      <section
        aria-labelledby="tara-section-title"
        className="section"
        style={{ background: 'var(--ghost-purple)', overflow: 'hidden' }}
      >
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3rem', alignItems: 'center' }}>
            <div
              aria-hidden="true"
              style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
            >
              <div style={{ position: 'absolute', inset: '-30px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,63,160,0.15) 0%, transparent 70%)' }} />
              <img
                src="/maskot-tara.png"
                alt=""
                className="animate-float"
                style={{ height: '200px', width: 'auto', objectFit: 'contain', position: 'relative', zIndex: 1 }}
              />
            </div>
            <div>
              <div className="section-label">Maskot VISTARA</div>
              <h2 id="tara-section-title" style={{ marginBottom: '0.75rem' }}>
                Kenali <span style={{ color: 'var(--vistara-purple)' }}>TARA</span>
              </h2>
              <p style={{ color: 'var(--mid-grey)', marginBottom: '1rem', lineHeight: 1.7 }}>
                TARA adalah maskot resmi OPDIM VISTARA 2026–2027 — seekor burung hantu muda yang cerdas dan bersahabat. Namanya terinspirasi dari kata <em>VISTARA</em>, membumikan filosofi yang agung menjadi sosok yang hangat dan dekat dengan seluruh warga madrasah.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {['🦉 Bijak', '💜 Hangat', '⚡ Semangat', '📚 Berprestasi', '🤝 Ramah'].map((tag) => (
                  <span key={tag} className="badge badge-ghost">{tag}</span>
                ))}
              </div>
              <Link to="/beranda/tentang" className="btn btn-primary btn-sm" id="tara-cta">
                Tentang VISTARA <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          #tara-section .container > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
