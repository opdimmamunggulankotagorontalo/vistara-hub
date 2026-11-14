import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  MapPin,
  Mail,
  Clock,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { InstagramIcon } from '../../components/ui/Icons';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge } from '../../components/ui';
import { MagneticWrapper, ScrollReveal, TiltSpotlightCard } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';

export default function Kontak() {
  const { reducedMotion } = useMotionSystem();
  const [formData, setFormData] = useState({
    nama: '',
    kontak: '',
    subjek: '',
    pesan: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.pesan) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({ nama: '', kontak: '', subjek: '', pesan: '' });
    }, 650);
  };

  return (
    <div>
      <PageHeader
        title="Hubungi & Kunjungi Kami"
        subtitle="Sekretariat OPDIM VISTARA MAM Unggulan Kota Gorontalo terbuka untuk komunikasi, audiensi, kolaborasi kemitraan, dan informasi publik."
        badge="Saluran Resmi"
        breadcrumbs={[
          { label: 'Beranda', href: '/beranda' },
          { label: 'Kontak' },
        ]}
      />

      <div className="section-padding">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '2.5rem',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Contact Cards & Office Details */}
            <ScrollReveal preset="slideLeft">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <TiltSpotlightCard
                  maxTilt={4}
                  style={{
                    borderRadius: '20px',
                    padding: '2rem',
                    boxShadow: '0 8px 32px rgba(45, 27, 105, 0.05)',
                  }}
                >
                  <Badge variant="purple" style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}>
                    Sekretariat Utama
                  </Badge>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.35rem',
                      color: 'var(--deep-violet)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    OPDIM MAM Unggulan Kota Gorontalo
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'var(--ghost-purple)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--royal-purple)',
                          flexShrink: 0,
                        }}
                      >
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Alamat
                        </div>
                        <div style={{ color: 'var(--charcoal)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                          Jl. K. H. Ahmad Dahlan No.1, Limba U I, Kota Selatan, Kota Gorontalo, Gorontalo 96135
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'var(--ghost-purple)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--vistara-purple)',
                          flexShrink: 0,
                        }}
                      >
                        <Mail size={20} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Email Resmi
                        </div>
                        <a
                          href="mailto:opdimmamunggulankotagorontalo@gmail.com"
                          style={{ color: 'var(--royal-purple)', fontSize: '0.92rem', textDecoration: 'none', fontWeight: 600, wordBreak: 'break-all' }}
                        >
                          opdimmamunggulankotagorontalo@gmail.com
                        </a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'var(--ghost-purple)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--gold-accent)',
                          flexShrink: 0,
                        }}
                      >
                        <Clock size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Jam Layanan & Piket
                        </div>
                        <div style={{ color: 'var(--charcoal)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                          Senin – Jumat: 13.30 – 16.30 WITA<br />
                          (Di luar jam pelajaran aktif madrasah)
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltSpotlightCard>

                {/* Social Channels */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, var(--deep-violet), var(--royal-purple))',
                    borderRadius: '20px',
                    padding: '1.75rem',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(45, 27, 105, 0.15)',
                  }}
                >
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'white', marginBottom: '0.5rem' }}>
                    Kanal Media Resmi
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '1.25rem' }}>
                    Ikuti liputan kegiatan, podcast, dan pembaruan informasi terkini melalui akun resmi Komisi 5 Humas.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <motion.a
                      whileHover={reducedMotion ? undefined : { y: -2, scale: 1.03 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.12)',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <InstagramIcon size={16} />
                      <span>Instagram</span>
                    </motion.a>

                    <motion.a
                      whileHover={reducedMotion ? undefined : { y: -2, scale: 1.03 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                      href="https://wa.me/opdimmamunggulankotagorontalo"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.12)',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>💬</span>
                      <span>WhatsApp</span>
                    </motion.a>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Column: Contact Message Form */}
            <ScrollReveal preset="slideRight">
              <div
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid var(--pale-lilac)',
                  padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                  boxShadow: '0 8px 32px rgba(45, 27, 105, 0.05)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.5rem',
                    color: 'var(--deep-violet)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Kirim Pesan atau Pertanyaan
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--mid-grey)', marginBottom: '1.75rem' }}>
                  Untuk kerja sama ekstrakurikuler, media partner, ataupun pertanyaan umum seputar OPDIM VISTARA.
                </p>

                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="kontak-submitted"
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
                      style={{
                        background: 'var(--ghost-purple)',
                        border: '1px solid var(--soft-lilac)',
                        borderRadius: '14px',
                        padding: '2rem',
                        textAlign: 'center',
                      }}
                    >
                      <CheckCircle2 size={44} style={{ color: 'var(--vistara-purple)', margin: '0 auto 1rem' }} />
                      <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--deep-violet)', marginBottom: '0.5rem' }}>
                        Pesan Berhasil Terkirim!
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--mid-grey)', marginBottom: '1.25rem' }}>
                        Terima kasih telah menghubungi kami. Tim Humas & Sekretariat OPDIM VISTARA akan merespons pesan Anda segera.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="btn btn-primary btn-sm"
                      >
                        Kirim Pesan Lain
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="kontak-form"
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0 }}
                      onSubmit={handleSubmit}
                      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                    >
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>
                          Nama Lengkap / Instansi *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan nama atau lembaga Anda"
                          value={formData.nama}
                          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--pale-lilac)',
                            background: 'var(--ghost-purple)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>
                          Kontak (Email / No. WhatsApp) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="contoh: nama@email.com atau 0812xxxx"
                          value={formData.kontak}
                          onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--pale-lilac)',
                            background: 'var(--ghost-purple)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>
                          Subjek / Keperluan *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Undangan Lomba / Kerja Sama Media"
                          value={formData.subjek}
                          onChange={(e) => setFormData({ ...formData, subjek: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--pale-lilac)',
                            background: 'var(--ghost-purple)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>
                          Isi Pesan *
                        </label>
                        <textarea
                          required
                          rows={5}
                          placeholder="Tuliskan pesan, rincian keperluan, atau pertanyaan Anda..."
                          value={formData.pesan}
                          onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--pale-lilac)',
                            background: 'var(--ghost-purple)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            resize: 'vertical',
                          }}
                        />
                      </div>

                      <MagneticWrapper style={{ width: '100%' }}>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn btn-primary btn-lg"
                          style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                        >
                          <Send size={18} />
                          <span>{submitting ? 'Mengirim...' : 'Kirim Pesan Sekarang'}</span>
                        </button>
                      </MagneticWrapper>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
