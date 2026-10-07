import { Link } from 'react-router-dom';
import { ArrowRight, Target, Zap, UserCheck } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionHeading } from '../../components/ui';
import { komisiData, visiMisiOfficial, prokerSiklusData } from '../../data';

const tiga_pilar = [
  { num: '01', title: 'SATU TITIK', subtitle: 'Fokus & Keberanian Memilih', desc: 'Setiap transformasi besar bermula dari satu titik tolak: satu suara, satu niat tulus, satu gagasan yang diperjuangkan dengan kesungguhan.', color: 'var(--deep-violet)' },
  { num: '02', title: 'SATU GERAKAN', subtitle: 'Struktur & Sinergi Komisi', desc: 'Gagasan diorganisasikan melalui 5 Komisi pelaksana, dimusyawarahkan, dan dieksekusi secara terkoordinasi dan disiplin.', color: 'var(--vistara-purple)' },
  { num: '03', title: 'SERIBU DAMPAK', subtitle: 'Ekspansi Perubahan Nyata', desc: 'Hasil dari gerak kolektif yang terpelihara adalah dampak yang meluas bagi seluruh warga madrasah, Muhammadiyah, dan masyarakat.', color: 'var(--amethyst)' },
];

export default function TentangPage() {
  return (
    <div>
      <PageHeader
        title="Tentang OPDIM VISTARA"
        subtitle="Mengenal OPDIM — organisasi, visi dan misi resmi, identitas periode VISTARA, struktur 5 komisi, dan program kerja berkala."
        badge="2026–2027"
        breadcrumbs={[{ label: 'Tentang' }]}
      />

      {/* ── TENTANG VISTARA ─── */}
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <div className="section-label">Identitas Periode</div>
              <h2 style={{ marginBottom: '1rem' }}>Apa itu <span style={{ color: 'var(--vistara-purple)' }}>VISTARA</span>?</h2>
              <p style={{ color: 'var(--charcoal)', lineHeight: 1.8, marginBottom: '1rem' }}>
                <strong>VISTARA</strong> adalah nama yang dipilih untuk menandai periode kepengurusan OPDIM 2026–2027. Berakar dari kata Sanskerta <em>vistāra</em> yang bermakna <em>perluasan, pemekaran, dan keluasan cakrawala</em>.
              </p>
              <p style={{ color: 'var(--charcoal)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                Ini bukan nama organisasi baru — VISTARA adalah <strong>identitas periode kepemimpinan</strong>. Organisasinya tetap OPDIM (Organisasi Peserta Didik Intra Madrasah) MAM Unggulan Kota Gorontalo.
              </p>
              <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, var(--deep-violet), var(--royal-purple))', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--soft-lilac)', marginBottom: '0.5rem' }}>
                  Sebutan Resmi
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
                  OPDIM VISTARA 2026–2027
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(185,154,225,0.8)', marginTop: '0.25rem' }}>
                  MAM Unggulan Kota Gorontalo
                </div>
              </div>
              <Link to="/beranda/program-kerja" className="btn btn-primary">
                Lihat Seluruh Program Kerja <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,63,160,0.12) 0%, transparent 70%)' }} />
              <img
                src="/logo-vistara-full.png"
                alt="Logo OPDIM VISTARA"
                style={{ maxWidth: '280px', width: '100%', height: 'auto', objectFit: 'contain', position: 'relative', zIndex: 1 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── VISI & MISI RESMI OPDIM ─── */}
      <section className="section" style={{ background: 'var(--ghost-purple)' }}>
        <div className="container">
          <SectionHeading
            label="Arah Gerak Resmi"
            title="Visi & Misi Resmi"
            highlight="OPDIM"
            subtitle="Landasan gerak resmi kepengurusan untuk membawa perubahan nyata yang aktif, inovatif, dan aspiratif."
            align="center"
          />

          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Visi Card */}
            <div
              className="card-dark"
              style={{
                borderRadius: '20px',
                padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(45, 27, 105, 0.25)',
              }}
            >
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  🌟
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-soft)', fontWeight: 700 }}>
                    Visi Resmi OPDIM
                  </span>
                  <h3 style={{ color: 'white', fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', margin: 0, fontWeight: 800 }}>
                    Visi Kepengurusan
                  </h3>
                </div>
              </div>

              <blockquote style={{ fontSize: 'clamp(1.1rem, 2vw, 1.45rem)', color: 'white', fontWeight: 700, lineHeight: 1.5, margin: '0 0 1.25rem', fontFamily: 'var(--font-display)', borderLeft: '4px solid var(--gold-accent)', paddingLeft: '1.25rem' }}>
                “{visiMisiOfficial.visi.teks}”
              </blockquote>

              <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid rgba(185, 154, 225, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--gold-soft)', fontWeight: 700, fontSize: '0.9rem' }}>➡️ Artinya:</span>
                </div>
                <p style={{ color: 'rgba(237, 230, 248, 0.95)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                  {visiMisiOfficial.visi.artinya}
                </p>
              </div>
            </div>

            {/* Misi Cards */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--lavender-mist)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={22} style={{ color: 'var(--vistara-purple)' }} />
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mid-grey)', fontWeight: 600 }}>5 Poin Prioritas Gerak</span>
                  <h3 style={{ color: 'var(--deep-violet)', fontSize: '1.35rem', margin: 0, fontWeight: 800 }}>Misi Resmi OPDIM</h3>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {visiMisiOfficial.misi.map((m) => (
                  <div
                    key={m.nomor}
                    className="card"
                    style={{
                      borderTop: '3px solid var(--vistara-purple)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      padding: '1.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, var(--deep-violet), var(--vistara-purple))',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        {m.nomor}
                      </span>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--deep-violet)', margin: 0, lineHeight: 1.35 }}>
                        {m.poin}
                      </h4>
                    </div>

                    <div style={{ background: 'var(--ghost-purple)', borderRadius: '10px', padding: '0.75rem 1rem', borderLeft: '3px solid var(--soft-lilac)', marginTop: 'auto' }}>
                      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--vistara-purple)', marginBottom: '0.2rem' }}>
                        ➡️ Artinya:
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, margin: 0 }}>
                        {m.artinya}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAM KERJA SIKLUS RESMI (HARIAN, MINGGUAN, BULANAN, TAHUNAN) ─── */}
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <SectionHeading
            label="Siklus Kegiatan"
            title="Program Kerja Berkala"
            highlight="Resmi"
            subtitle="Agenda berkesinambungan OPDIM yang dieksekusi secara harian, mingguan, bulanan, hingga perhelatan puncak tahunan."
            align="center"
          />

          <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {prokerSiklusData.map((siklus) => (
              <div
                key={siklus.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${
                    siklus.frekuensi === 'Harian' ? '#2E7D32' :
                    siklus.frekuensi === 'Mingguan' ? 'var(--orchid)' :
                    siklus.frekuensi === 'Bulanan' ? 'var(--vistara-purple)' :
                    'var(--gold-accent)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span
                    className="badge"
                    style={{
                      background:
                        siklus.frekuensi === 'Harian' ? 'rgba(46, 125, 50, 0.12)' :
                        siklus.frekuensi === 'Mingguan' ? 'rgba(155, 114, 204, 0.15)' :
                        siklus.frekuensi === 'Bulanan' ? 'rgba(107, 63, 160, 0.12)' :
                        'rgba(201, 168, 76, 0.18)',
                      color:
                        siklus.frekuensi === 'Harian' ? '#2E7D32' :
                        siklus.frekuensi === 'Mingguan' ? 'var(--royal-purple)' :
                        siklus.frekuensi === 'Bulanan' ? 'var(--deep-violet)' :
                        '#8A6812',
                      fontWeight: 700,
                    }}
                  >
                    📅 Program {siklus.frekuensi}
                  </span>
                  <span style={{ fontSize: '1.5rem' }}>{siklus.icon}</span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--deep-violet)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  {siklus.judul}
                </h3>

                <div style={{ background: 'var(--ghost-purple)', borderRadius: '8px', padding: '0.75rem 0.875rem', marginBottom: '1rem', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--vistara-purple)', marginBottom: '0.25rem' }}>
                    ➡️ Artinya:
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, margin: 0 }}>
                    {siklus.artinya}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--pale-lilac)', paddingTop: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)' }}>
                    Pelaksana: <strong>{siklus.pelaksana.split('&')[0]}</strong>
                  </span>
                  <Link
                    to={`/beranda/program-kerja/${siklus.slug}`}
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--vistara-purple)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                    }}
                  >
                    Detail <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 KOMISI RESMI OPDIM & STRUKTUR ─── */}
      <section className="section" style={{ background: 'var(--ghost-purple)' }}>
        <div className="container">
          <SectionHeading
            label="Struktur Organisasi Resmi"
            title="5 Komisi Pelaksana"
            highlight="OPDIM"
            subtitle="Lima komisi resmi yang menggerakkan roda organisasi dengan tugas pokok, fungsi, dan susunan personil yang jelas."
            align="center"
          />

          <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {komisiData.map((komisi) => (
              <div
                key={komisi.id}
                className="card"
                style={{
                  borderLeft: `5px solid ${komisi.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>{komisi.icon}</span>
                    <div>
                      <span className="badge" style={{ background: `${komisi.color}15`, color: komisi.color, border: `1px solid ${komisi.color}35`, fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                        {komisi.name}
                      </span>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--deep-violet)', margin: 0 }}>
                        {komisi.fullName.replace(`${komisi.name} — `, '')}
                      </h3>
                    </div>
                  </div>
                </div>

                {komisi.tagline && (
                  <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--vistara-purple)', fontWeight: 600, fontStyle: 'italic' }}>
                    Tagline: {komisi.tagline}
                  </div>
                )}

                <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.65, margin: 0, flex: 1 }}>
                  {komisi.description}
                </p>

                {/* Struktur Pengurus Komisi (Ketua & Anggota jika ada) */}
                {(komisi.ketua || (komisi.anggota && komisi.anggota.length > 0)) && (
                  <div style={{ background: 'var(--ghost-purple)', borderRadius: '10px', padding: '0.875rem', border: '1px solid var(--pale-lilac)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <UserCheck size={14} style={{ color: komisi.color }} />
                      <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--deep-violet)' }}>
                        Personil Komisi:
                      </span>
                    </div>
                    {komisi.ketua && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)', marginBottom: '0.25rem' }}>
                        <strong>Ketua Komisi:</strong> {komisi.ketua}
                      </div>
                    )}
                    {komisi.anggota && komisi.anggota.length > 0 && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--mid-grey)', lineHeight: 1.5 }}>
                        <strong>Anggota:</strong> {komisi.anggota.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIGA PILAR KONSEPTUAL ─── */}
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <SectionHeading
            label="Filosofi Dasar"
            title="Tiga Pilar Konseptual"
            highlight="VISTARA"
            subtitle="Landasan filosofis yang menjadi jiwa seluruh gerak kepengurusan periode 2026–2027."
            align="center"
          />
          <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {tiga_pilar.map((pilar) => (
              <div key={pilar.num} className="card" style={{ borderTop: `3px solid ${pilar.color}` }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: pilar.color, marginBottom: '0.5rem', lineHeight: 1 }}>
                  {pilar.num}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: pilar.color, marginBottom: '0.25rem' }}>
                  {pilar.title}
                </h3>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--mid-grey)', marginBottom: '0.75rem', fontWeight: 600 }}>
                  {pilar.subtitle}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--charcoal)', lineHeight: 1.7 }}>{pilar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SLOGAN BANNER ─── */}
      <section className="bg-gradient-brand" style={{ padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(185,154,225,0.15)', border: '1px solid rgba(185,154,225,0.3)', borderRadius: '100px', padding: '0.4rem 1rem', marginBottom: '1.25rem' }}>
            <Zap size={14} style={{ color: 'var(--soft-lilac)' }} />
            <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--soft-lilac)', textTransform: 'uppercase', fontWeight: 600 }}>Slogan Resmi Kepengurusan</span>
          </div>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'white', lineHeight: 1.2, maxWidth: '700px', margin: '0 auto 1.5rem' }}>
            "Satu Pilihan Seribu Perubahan"
          </blockquote>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Institusional', 'Kristal & Modern', 'Intelektual', 'Palet Lilac & Violet', 'Islami & Muhammadiyah'].map((tag) => (
              <span key={tag} className="badge" style={{ background: 'rgba(185,154,225,0.15)', color: 'var(--soft-lilac)', border: '1px solid rgba(185,154,225,0.2)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

