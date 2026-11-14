import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Megaphone, Newspaper, Calendar, Trophy,
  Image, BookOpen, Users, Zap
} from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { SectionHeading, Badge, StatusBadge } from '../../components/ui';
import { programKerjaData, beritaData, eventData, prestasiData, galeriData } from '../../data';
import CrystalCanvas from '../../components/motion/CrystalCanvas';
import {
  AnimatedCounter,
  InfiniteMarquee,
  MagneticWrapper,
  ScrollReveal,
  TiltSpotlightCard,
} from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';

const EXPO_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Helper: format tanggal ───────────────────────────────────
function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
}

// ─── Stat Item with AnimatedCounter ───────────────────────────
function StatItem({ target, suffix = '', label, delay = 0 }: { target: number; suffix?: string; label: string; delay?: number }) {
  return (
    <ScrollReveal preset="fadeUp" delay={delay}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
          <AnimatedCounter target={target} suffix={suffix} />
        </div>
        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'rgba(185,154,225,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.35rem' }}>
          {label}
        </div>
      </div>
    </ScrollReveal>
  );
}

// ─── Interactive TARA Mascot with mouse parallax ──────────────
function InteractiveTara({ height, lazy = false }: { height: string; lazy?: boolean }) {
  const { reducedMotion } = useMotionSystem();
  const rx = useSpring(0, { stiffness: 180, damping: 20 });
  const ry = useSpring(0, { stiffness: 180, damping: 20 });
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const sx = useSpring(tx, { stiffness: 160, damping: 22 });
  const sy = useSpring(ty, { stiffness: 160, damping: 22 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(nx * 18);
    rx.set(-ny * 18);
    tx.set(nx * 14);
    ty.set(ny * 14);
  };

  const handleLeave = () => {
    rx.set(0);
    ry.set(0);
    tx.set(0);
    ty.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        perspective: 900,
        rotateX: reducedMotion ? 0 : rx,
        rotateY: reducedMotion ? 0 : ry,
        x: reducedMotion ? 0 : sx,
        y: reducedMotion ? 0 : sy,
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="animate-aurora"
        style={{
          position: 'absolute',
          inset: '-24px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155,114,204,0.38) 0%, rgba(201,168,76,0.12) 45%, transparent 72%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <motion.img
        src="/maskot-tara.webp"
        alt="TARA — Maskot OPDIM VISTARA"
        width={260}
        height={260}
        loading={lazy ? 'lazy' : undefined}
        decoding="async"
        animate={reducedMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          height,
          width: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(0 20px 40px rgba(15,10,30,0.65))',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </motion.div>
  );
}

const MARQUEE_ITEMS = [
  'OPDIM VISTARA 2026–2027',
  'Satu Pilihan Seribu Perubahan',
  'MAM Unggulan Kota Gorontalo',
  '5 Komisi Pelaksana',
  '23 Program Kerja Resmi',
  'Transparansi & Aspirasi Siswa',
  'Hall of Fame Prestasi',
  'Arsip Terbuka',
];

export default function BerandaPage() {
  const { reducedMotion } = useMotionSystem();
  const [hoveredTrait, setHoveredTrait] = useState<string | null>(null);

  const recentBerita = beritaData.slice(0, 3);
  const upcomingEvents = eventData.filter((e) => e.status !== 'past').slice(0, 3);
  const latestPrestasi = prestasiData.slice(0, 3);
  const featuredProker = programKerjaData.slice(0, 3);
  const featuredGaleri = galeriData.slice(0, 4);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-title"
        className="bg-gradient-mesh"
        style={{
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 'clamp(2.25rem, 6vw, 5.75rem)',
          paddingBottom: 'clamp(2.25rem, 5vw, 4.75rem)',
        }}
      >
        {/* Interactive Crystalline Canvas */}
        <CrystalCanvas />

        {/* Decorative geometric rings */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <motion.div
            animate={reducedMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              border: '1px dashed rgba(185,154,225,0.12)',
              top: '-200px',
              right: '-100px',
            }}
          />
          <motion.div
            animate={reducedMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              border: '1px solid rgba(201,168,76,0.10)',
              top: '-50px',
              right: '100px',
            }}
          />
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
                  width: '200px',
                  height: '200px',
                  pointerEvents: 'none',
                  zIndex: 0,
                  opacity: 0.11,
                  filter: 'drop-shadow(0 0 24px rgba(185, 154, 225, 0.35))',
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
                {/* Badge + compact mobile TARA presence */}
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EXPO_EASE }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap' }}
                >
                  <img
                    src="/maskot-tara.webp"
                    alt=""
                    aria-hidden="true"
                    width={42}
                    height={42}
                    decoding="async"
                    className="hero-mobile-mascot-chip"
                    style={{
                      width: '42px',
                      height: '42px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 12px rgba(15,10,30,0.45))',
                    }}
                  />
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(185,154,225,0.12)', border: '1px solid rgba(185,154,225,0.3)', borderRadius: '100px', padding: '0.3rem 0.9rem' }}>
                    <motion.span
                      animate={reducedMotion ? undefined : { scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--soft-lilac)', boxShadow: '0 0 8px var(--soft-lilac)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--soft-lilac)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Platform Digital Resmi
                    </span>
                  </div>
                  <span className="badge badge-gold">OPDIM VISTARA 2026–2027</span>
                </motion.div>

                {/* Organization name */}
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08, ease: EXPO_EASE }}
                  style={{ fontFamily: 'var(--font-header)', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', letterSpacing: '0.18em', color: 'rgba(185,154,225,0.75)', textTransform: 'uppercase', marginBottom: '0.4rem' }}
                >
                  OPDIM MAM Unggulan Kota Gorontalo
                </motion.div>

                {/* Main title */}
                <motion.h1
                  id="hero-title"
                  initial={reducedMotion ? false : { opacity: 0, y: 20, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.65, delay: 0.14, ease: EXPO_EASE }}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 'clamp(2.35rem, 6vw, 4.5rem)',
                    color: 'white',
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    marginBottom: 'clamp(0.85rem, 2vw, 1.25rem)',
                  }}
                >
                  <span className="text-gradient-animated">VISTARA</span>
                  <br />
                  <span style={{ color: 'var(--soft-lilac)', fontSize: '0.55em', fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Hub
                  </span>
                </motion.h1>

                {/* Slogan */}
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.24, ease: EXPO_EASE }}
                  style={{ borderLeft: '3px solid var(--soft-lilac)', paddingLeft: '1rem', marginBottom: 'clamp(0.95rem, 2.5vw, 1.65rem)' }}
                >
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(0.98rem, 2vw, 1.35rem)', color: 'white', lineHeight: 1.3 }}>
                    "Satu Pilihan Seribu Perubahan"
                  </div>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', color: 'var(--pale-lilac)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.35rem' }}>
                    Slogan Resmi Periode Kepengurusan
                  </div>
                </motion.div>

                {/* Description */}
                <motion.p
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.32, ease: EXPO_EASE }}
                  style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)', color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, marginBottom: 'clamp(1.25rem, 3vw, 2rem)', maxWidth: '540px' }}
                >
                  Rumah digital resmi OPDIM VISTARA — pusat publikasi, aspirasi siswa, dokumentasi, dan arsip kepengurusan yang transparan untuk seluruh warga MAM Unggulan.
                </motion.p>

                {/* CTAs */}
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: EXPO_EASE }}
                  style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                >
                  <MagneticWrapper>
                    <Link to="/beranda/aspirasi" className="btn btn-primary btn-lg" id="hero-cta-aspirasi">
                      <Megaphone size={18} />
                      Sampaikan Aspirasi
                    </Link>
                  </MagneticWrapper>
                  <MagneticWrapper>
                    <Link to="/beranda/tentang" className="btn btn-ghost btn-lg" id="hero-cta-tentang">
                      Tentang VISTARA
                      <ArrowRight size={18} />
                    </Link>
                  </MagneticWrapper>
                </motion.div>
              </div>
            </div>

            {/* Right: Interactive TARA mascot */}
            <motion.div
              aria-hidden="true"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25, ease: EXPO_EASE }}
              style={{ display: 'none', flexShrink: 0 }}
              id="hero-mascot"
            >
              <InteractiveTara height="260px" />
            </motion.div>
          </div>

          {/* Stats Row */}
          <div style={{ marginTop: 'clamp(2rem, 5vw, 3.75rem)', paddingTop: 'clamp(1.5rem, 3.5vw, 2.25rem)', borderTop: '1px solid rgba(185,154,225,0.12)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 'clamp(1rem, 2.5vw, 2rem)' }}>
            <StatItem target={5} label="Komisi Aktif" delay={0.05} />
            <StatItem target={23} label="Program Kerja Resmi" delay={0.12} />
            <StatItem target={6} label="Prestasi 2026" delay={0.19} />
            <StatItem target={400} suffix="+" label="Siswa MAM" delay={0.26} />
          </div>
        </div>

        <style>{`
          @media (min-width: 768px) {
            #hero-mascot { display: flex !important; }
            .hero-mobile-logo { display: none !important; }
            .hero-mobile-mascot-chip { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── INFINITE MARQUEE RIBBON ─────────────────────────── */}
      <InfiniteMarquee items={MARQUEE_ITEMS} />

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
            <MagneticWrapper strength={0.18}>
              <Link to="/beranda/program-kerja" className="btn btn-outline btn-sm" id="proker-see-all">
                Lihat Semua <ArrowRight size={14} />
              </Link>
            </MagneticWrapper>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {featuredProker.map((proker, i) => (
              <ScrollReveal key={proker.id} preset="fadeUp" delay={i * 0.08}>
                <TiltSpotlightCard
                  cursorLabel="Detail"
                  style={{ border: '1px solid var(--pale-lilac)', height: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <span
                      className="badge"
                      style={{ background: `${proker.komisiColor}20`, color: proker.komisiColor, border: `1px solid ${proker.komisiColor}40`, fontSize: '0.65rem' }}
                    >
                      {proker.komisi}
                    </span>
                    <StatusBadge status={proker.status} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--deep-violet)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {proker.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.6, marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proker.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--pale-lilac)', marginTop: 'auto' }}>
                    <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)' }}>{proker.timeline}</span>
                    <Link
                      to={`/beranda/program-kerja/${proker.slug}`}
                      style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--vistara-purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                    >
                      Detail <ArrowRight size={13} />
                    </Link>
                  </div>
                </TiltSpotlightCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASPIRASI CTA ──────────────────────────────────────── */}
      <section aria-labelledby="aspirasi-cta-title" className="bg-gradient-brand" style={{ padding: '5rem 0', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div
            className="animate-aurora"
            style={{ position: 'absolute', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.16) 0%, transparent 70%)', right: '-80px', top: '10%' }}
          />
          <div
            className="animate-aurora"
            style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,154,225,0.18) 0%, transparent 70%)', left: '-80px', bottom: '-60px', animationDelay: '3s' }}
          />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <ScrollReveal preset="blurIn">
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
              <MagneticWrapper>
                <Link to="/beranda/aspirasi" className="btn btn-gold btn-lg" id="cta-aspirasi-btn">
                  <Megaphone size={18} />
                  Sampaikan Aspirasi Sekarang
                </Link>
              </MagneticWrapper>
              <MagneticWrapper>
                <Link to="/beranda/program-kerja" className="btn btn-ghost btn-lg">
                  Lihat Program Kerja
                </Link>
              </MagneticWrapper>
            </div>
          </ScrollReveal>
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
            <MagneticWrapper strength={0.18}>
              <Link to="/beranda/berita" className="btn btn-outline btn-sm" id="berita-see-all">
                Semua Berita <ArrowRight size={14} />
              </Link>
            </MagneticWrapper>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {recentBerita.map((berita, i) => (
              <ScrollReveal key={berita.id} preset="clipUp" delay={i * 0.08}>
                <TiltSpotlightCard cursorLabel="Baca" style={{ height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Badge variant="ghost">{berita.category}</Badge>
                    <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--light-grey)' }}>
                      {formatDate(berita.date)}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--deep-violet)', marginBottom: '0.5rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {berita.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem', flex: 1 }}>
                    {berita.excerpt}
                  </p>
                  <Link
                    to={`/beranda/berita/${berita.slug}`}
                    style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--vistara-purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', marginTop: 'auto' }}
                  >
                    Baca Selengkapnya <ArrowRight size={13} />
                  </Link>
                </TiltSpotlightCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENT + PRESTASI ROW ──────────────────────────────── */}
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>

            {/* Events */}
            <ScrollReveal preset="slideLeft">
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
                    <Link
                      key={event.id}
                      to={`/beranda/event?highlight=${encodeURIComponent(event.slug)}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <motion.div
                        whileHover={reducedMotion ? undefined : { x: 4 }}
                        transition={{ duration: 0.2 }}
                        className="card"
                        style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                      >
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
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Prestasi */}
            <ScrollReveal preset="slideRight">
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
                    <Link
                      key={prestasi.id}
                      to={`/beranda/prestasi/${prestasi.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <motion.div
                        whileHover={reducedMotion ? undefined : { x: 4 }}
                        transition={{ duration: 0.2 }}
                        className="card"
                        style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                      >
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
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>
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
            ].map((item, idx) => (
              <ScrollReveal key={item.href} preset="scaleIn" delay={idx * 0.04}>
                <Link
                  to={item.href}
                  style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                >
                  <TiltSpotlightCard
                    dark
                    maxTilt={7}
                    spotlightColor="rgba(185, 154, 225, 0.25)"
                    className="glass"
                    style={{
                      borderRadius: '14px',
                      padding: '1.25rem',
                      height: '100%',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${item.color}30`, border: `1px solid ${item.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--soft-lilac)' }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'white', marginBottom: '0.2rem' }}>
                          {item.label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(185,154,225,0.75)' }}>
                          {item.desc}
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'rgba(185,154,225,0.65)', marginTop: 'auto' }} />
                    </div>
                  </TiltSpotlightCard>
                </Link>
              </ScrollReveal>
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
            <MagneticWrapper strength={0.18}>
              <Link to="/beranda/galeri" className="btn btn-outline btn-sm" id="galeri-see-all">
                Lihat Galeri <ArrowRight size={14} />
              </Link>
            </MagneticWrapper>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {featuredGaleri.map((album, i) => (
              <ScrollReveal key={album.id} preset="fadeUp" delay={i * 0.06}>
                <Link
                  to={`/beranda/galeri/${album.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                  data-cursor="view"
                  data-cursor-label="Galeri"
                >
                  <motion.div
                    whileHover={reducedMotion ? undefined : { scale: 1.03, y: -4 }}
                    transition={{ duration: 0.28, ease: EXPO_EASE }}
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
                      boxShadow: '0 8px 24px rgba(45,27,105,0.14)',
                    }}
                  >
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.16 }}>
                      <Image size={48} color="white" />
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'white', lineHeight: 1.3, marginBottom: '0.25rem' }}>
                        {album.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)' }}>{album.imageCount} foto</span>
                        <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)' }}>{formatDate(album.date)}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARA MASCOT SECTION ──────────────────────────────── */}
      <section
        id="tara-section"
        aria-labelledby="tara-section-title"
        className="section"
        style={{ background: 'var(--ghost-purple)', overflow: 'hidden' }}
      >
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3rem', alignItems: 'center' }}>
            <ScrollReveal preset="scaleIn">
              <div
                aria-hidden="true"
                style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
              >
                <InteractiveTara height="200px" lazy />
              </div>
            </ScrollReveal>

            <ScrollReveal preset="slideRight">
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
                    <motion.span
                      key={tag}
                      className="badge badge-ghost"
                      whileHover={reducedMotion ? undefined : { scale: 1.08, y: -2 }}
                      onHoverStart={() => setHoveredTrait(tag)}
                      onHoverEnd={() => setHoveredTrait(null)}
                      style={{
                        cursor: 'default',
                        border: hoveredTrait === tag ? '1px solid var(--vistara-purple)' : '1px solid transparent',
                      }}
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
                <MagneticWrapper strength={0.18}>
                  <Link to="/beranda/tentang" className="btn btn-primary btn-sm" id="tara-cta">
                    Tentang VISTARA <ArrowRight size={14} />
                  </Link>
                </MagneticWrapper>
              </div>
            </ScrollReveal>
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
