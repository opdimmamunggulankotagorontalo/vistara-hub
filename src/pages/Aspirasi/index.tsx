import { useState } from 'react';
import { Send, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionHeading, Badge } from '../../components/ui';

const KATEGORI = [
  'Fasilitas Madrasah',
  'Program & Kegiatan',
  'Pelayanan Organisasi',
  'Akademik & Belajar',
  'Lingkungan & Kebersihan',
  'Media & Komunikasi',
  'Lainnya',
];

const DEMO_ASPIRASI = [
  { id: 1, judul: 'Penambahan Kipas Angin di Ruang Kelas XI', kategori: 'Fasilitas Madrasah', status: 'proses', tanggal: '2026-09-28', kelas: 'XI IPA 1' },
  { id: 2, judul: 'Permintaan Kegiatan Studi Banding ke Perguruan Tinggi', kategori: 'Program & Kegiatan', status: 'diterima', tanggal: '2026-09-25', kelas: 'XII IPS 2' },
  { id: 3, judul: 'Perbaikan WiFi di Area Perpustakaan', kategori: 'Fasilitas Madrasah', status: 'proses', tanggal: '2026-10-01', kelas: 'X IPA 3' },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  diterima: { label: '✓ Diterima', color: '#2E7D32', bg: '#E8F5E9' },
  proses: { label: '⟳ Ditindaklanjuti', color: '#1565C0', bg: '#E3F2FD' },
  selesai: { label: '✓ Selesai', color: '#C9A84C', bg: '#FFF8E1' },
};

export default function AspirasiPage() {
  const [formData, setFormData] = useState({ nama: '', kelas: '', kategori: '', judul: '', isi: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.isi || !formData.kategori) {
      setError('Harap isi semua field yang wajib diisi.');
      return;
    }
    setError('');
    // DEMO ONLY — no real submission
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ nama: '', kelas: '', kategori: '', judul: '', isi: '' });
  };

  return (
    <div>
      <PageHeader
        title="Pusat Aspirasi"
        subtitle="Sampaikan aspirasi, saran, dan masukanmu kepada OPDIM VISTARA. Setiap suara dicatat dan ditindaklanjuti secara transparan."
        badge="Demo Mode"
        breadcrumbs={[{ label: 'Aspirasi' }]}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(230,81,0,0.15)', border: '1px solid rgba(230,81,0,0.3)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          <AlertCircle size={14} style={{ color: '#FFB74D' }} />
          <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: '#FFB74D' }}>
            Mode Demo — aspirasi tidak benar-benar disimpan
          </span>
        </div>
      </PageHeader>

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>

            {/* FORM */}
            <div>
              <SectionHeading label="Kirim Aspirasi" title="Suarakan" highlight="Pendapatmu" subtitle="Formulir aspirasi anonym — identitasmu aman." />

              {submitted ? (
                <div style={{ marginTop: '2rem', padding: '2.5rem', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '16px', textAlign: 'center' }}>
                  <CheckCircle size={48} style={{ color: '#2E7D32', margin: '0 auto 1rem' }} />
                  <h3 style={{ color: '#2E7D32', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    Aspirasi Terkirim! (Demo)
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#388E3C', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Dalam versi aktif, aspirasi kamu akan dicatat dan ditindaklanjuti oleh pengurus OPDIM VISTARA.
                  </p>
                  <button onClick={handleReset} className="btn btn-primary">
                    Kirim Aspirasi Lagi
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  aria-label="Formulir aspirasi"
                  style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                  {error && (
                    <div role="alert" style={{ padding: '0.875rem', background: '#FFEBEE', border: '1px solid #EF9A9A', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', color: '#C62828' }}>
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  {/* Nama (optional) */}
                  <div>
                    <label htmlFor="aspirasi-nama" style={{ display: 'block', fontFamily: 'var(--font-header)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--deep-violet)', marginBottom: '0.4rem' }}>
                      Nama <span style={{ color: 'var(--mid-grey)', fontWeight: 400 }}>(opsional)</span>
                    </label>
                    <input
                      id="aspirasi-nama"
                      type="text"
                      placeholder="Nama kamu (boleh dikosongkan)"
                      value={formData.nama}
                      onChange={e => setFormData({ ...formData, nama: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--pale-lilac)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--charcoal)', background: 'white', outline: 'none', transition: 'border-color var(--transition-fast)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--vistara-purple)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--pale-lilac)'; }}
                    />
                  </div>

                  {/* Kelas */}
                  <div>
                    <label htmlFor="aspirasi-kelas" style={{ display: 'block', fontFamily: 'var(--font-header)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--deep-violet)', marginBottom: '0.4rem' }}>
                      Kelas <span style={{ color: 'var(--mid-grey)', fontWeight: 400 }}>(opsional)</span>
                    </label>
                    <input
                      id="aspirasi-kelas"
                      type="text"
                      placeholder="Contoh: XI IPA 2"
                      value={formData.kelas}
                      onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--pale-lilac)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--charcoal)', background: 'white', outline: 'none', transition: 'border-color var(--transition-fast)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--vistara-purple)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--pale-lilac)'; }}
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label htmlFor="aspirasi-kategori" style={{ display: 'block', fontFamily: 'var(--font-header)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--deep-violet)', marginBottom: '0.4rem' }}>
                      Kategori <span style={{ color: 'var(--vistara-purple)' }}>*</span>
                    </label>
                    <select
                      id="aspirasi-kategori"
                      required
                      value={formData.kategori}
                      onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--pale-lilac)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: formData.kategori ? 'var(--charcoal)' : 'var(--mid-grey)', background: 'white', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--vistara-purple)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--pale-lilac)'; }}
                    >
                      <option value="">-- Pilih kategori aspirasi --</option>
                      {KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Judul */}
                  <div>
                    <label htmlFor="aspirasi-judul" style={{ display: 'block', fontFamily: 'var(--font-header)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--deep-violet)', marginBottom: '0.4rem' }}>
                      Judul Aspirasi <span style={{ color: 'var(--vistara-purple)' }}>*</span>
                    </label>
                    <input
                      id="aspirasi-judul"
                      type="text"
                      required
                      placeholder="Tulis judul singkat aspirasi kamu"
                      value={formData.judul}
                      onChange={e => setFormData({ ...formData, judul: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--pale-lilac)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--charcoal)', background: 'white', outline: 'none', transition: 'border-color var(--transition-fast)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--vistara-purple)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--pale-lilac)'; }}
                    />
                  </div>

                  {/* Isi */}
                  <div>
                    <label htmlFor="aspirasi-isi" style={{ display: 'block', fontFamily: 'var(--font-header)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--deep-violet)', marginBottom: '0.4rem' }}>
                      Isi Aspirasi <span style={{ color: 'var(--vistara-purple)' }}>*</span>
                    </label>
                    <textarea
                      id="aspirasi-isi"
                      required
                      placeholder="Ceritakan aspirasi atau masukanmu secara detail..."
                      rows={5}
                      value={formData.isi}
                      onChange={e => setFormData({ ...formData, isi: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--pale-lilac)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--charcoal)', background: 'white', outline: 'none', resize: 'vertical', minHeight: '120px', lineHeight: 1.6, transition: 'border-color var(--transition-fast)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--vistara-purple)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--pale-lilac)'; }}
                    />
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-header)', fontSize: '0.7rem', color: 'var(--mid-grey)', marginTop: '0.25rem' }}>
                      {formData.isi.length} karakter
                    </div>
                  </div>

                  <button type="submit" id="aspirasi-submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    <Send size={18} />
                    Kirim Aspirasi (Demo)
                  </button>
                </form>
              )}
            </div>

            {/* DAFTAR ASPIRASI PUBLIK */}
            <div>
              <SectionHeading label="Transparansi" title="Daftar Aspirasi" highlight="Publik" subtitle="Aspirasi yang telah diterima dan sedang ditindaklanjuti. (Data Demo)" />

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {DEMO_ASPIRASI.map((item) => {
                  const s = statusMap[item.status] || { label: item.status, color: 'var(--mid-grey)', bg: 'var(--ghost-purple)' };
                  return (
                    <div key={item.id} className="card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.625rem' }}>
                        <Badge variant="ghost">{item.kategori}</Badge>
                        <span
                          className="badge"
                          style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30`, fontSize: '0.65rem', flexShrink: 0 }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--deep-violet)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                        {item.judul}
                      </h4>
                      <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--mid-grey)' }}>
                        {item.kelas && <span>🎓 {item.kelas}</span>}
                        <span>📅 {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(item.tanggal))}</span>
                      </div>
                    </div>
                  );
                })}

                <div style={{ padding: '1rem', background: 'var(--lavender-mist)', borderRadius: '10px', textAlign: 'center', border: '1px dashed var(--pale-lilac)' }}>
                  <MessageSquare size={20} style={{ color: 'var(--amethyst)', margin: '0 auto 0.5rem' }} />
                  <p style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', color: 'var(--amethyst)', margin: 0 }}>
                    Dalam versi aktif, seluruh aspirasi yang terkirim akan tampil di sini secara publik.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
