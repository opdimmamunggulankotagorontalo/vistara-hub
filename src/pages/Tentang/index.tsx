import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Zap } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionHeading } from '../../components/ui';
import { komisiData } from '../../data';

const visiMisi = {
  visi: 'Terwujudnya pelajar MAM Unggulan Kota Gorontalo yang beriman, berilmu, berakhlak mulia, berjiwa kepemimpinan, unggul berprestasi, cakap literasi-teknologi, dan peduli sesama serta lingkungan.',
  misi: [
    'Membina iman, ibadah, dan nilai-nilai Kemuhammadiyahan yang kokoh sebagai pondasi gerak organisasi.',
    'Mengembangkan jiwa kepemimpinan, budaya musyawarah, dan integritas organisasi yang tinggi.',
    'Mendorong prestasi akademik, riset ilmiah, dan penalaran kritis peserta didik.',
    'Menumbuhkan literasi, seni, inovasi digital, dan kreativitas sebagai daya ungkit kemajuan.',
    'Memupuk empati sosial, kepedulian lingkungan, dan semangat gotong royong antarwarga madrasah.',
    'Membangun kemitraan strategis bersama alumni, instansi, dan lembaga eksternal atas izin Kepala Madrasah.',
  ],
};

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
        subtitle="Mengenal OPDIM — organisasi, identitas periode VISTARA, mascot TARA, dan visi besar yang kami emban bersama."
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
                Lihat Program Kerja <ArrowRight size={16} />
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

      {/* ── TIGA PILAR ─── */}
      <section className="section" style={{ background: 'var(--ghost-purple)' }}>
        <div className="container">
          <SectionHeading
            label="Filosofi Dasar"
            title="Tiga Pilar Konseptual"
            highlight="VISTARA"
            subtitle="Landasan filosofis yang menjadi jiwa seluruh gerak kepengurusan."
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

      {/* ── VISI & MISI ─── */}
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <SectionHeading label="Arah Gerak" title="Visi & Misi" highlight="OPDIM" align="center" />
          <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Visi */}
            <div className="card-dark" style={{ borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(185,154,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={20} style={{ color: 'var(--soft-lilac)' }} />
                </div>
                <h3 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}>Visi</h3>
              </div>
              <p style={{ color: 'rgba(185,154,225,0.9)', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '2px solid var(--soft-lilac)', paddingLeft: '1rem' }}>
                "{visiMisi.visi}"
              </p>
            </div>

            {/* Misi */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--lavender-mist)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={20} style={{ color: 'var(--vistara-purple)' }} />
                </div>
                <h3 style={{ color: 'var(--deep-violet)', fontSize: '1.2rem', margin: 0 }}>Misi</h3>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {visiMisi.misi.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'var(--lavender-mist)', color: 'var(--vistara-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0, marginTop: '2px' }}>
                      {i + 1}
                    </span>
                    <p style={{ fontSize: '0.875rem', color: 'var(--charcoal)', lineHeight: 1.6, margin: 0 }}>{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5 KOMISI ─── */}
      <section className="section" style={{ background: 'var(--ghost-purple)' }}>
        <div className="container">
          <SectionHeading
            label="Struktur Organisasi"
            title="5 Komisi"
            highlight="VISTARA"
            subtitle="Lima komisi pelaksana yang menggerakkan program kerja OPDIM: Keagamaan, Kepemimpinan, Akademik, Aspirasi Siswa, dan Humas & Media Digital."
          />
          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {komisiData.map((komisi) => (
              <div key={komisi.id} className="card" style={{ borderLeft: `4px solid ${komisi.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{komisi.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'var(--mid-grey)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{komisi.name}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--deep-violet)' }}>
                      {komisi.fullName.replace(`${komisi.name} — `, '')}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', lineHeight: 1.6 }}>{komisi.description}</p>
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
