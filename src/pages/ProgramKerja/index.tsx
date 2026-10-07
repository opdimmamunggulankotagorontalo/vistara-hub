import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Filter, Search, Calendar,
  BookOpen, CheckCircle2, Sparkles
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge, EmptyState } from '../../components/ui';
import {
  programKerjaData,
  prokerSiklusData,
  komisi2DiplomasiBlueprint
} from '../../data';

export default function ProgramKerjaPage() {
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTabBlueprint, setActiveTabBlueprint] = useState<'pilar' | 'tahapan' | 'peran' | 'protokol'>('pilar');

  const filtered = useMemo(() => {
    return programKerjaData.filter((pk) => {
      // Filter kategori / komisi
      let komisiMatch = true;
      if (filter === 'siklus') {
        komisiMatch = pk.kategoriProker === 'Siklus' || pk.komisi.includes('Siklus');
      } else if (filter !== 'all') {
        komisiMatch = pk.komisi.toLowerCase().includes(filter.toLowerCase()) ||
                      Boolean(pk.kategoriProker?.toLowerCase().includes(filter.toLowerCase()));
      }

      // Filter status
      const statusMatch = statusFilter === 'all' || pk.status === statusFilter;

      // Filter pencarian
      const query = searchQuery.toLowerCase().trim();
      const searchMatch = !query ||
        pk.title.toLowerCase().includes(query) ||
        pk.description.toLowerCase().includes(query) ||
        (pk.tujuan && pk.tujuan.toLowerCase().includes(query)) ||
        (pk.pj && pk.pj.toLowerCase().includes(query)) ||
        pk.komisi.toLowerCase().includes(query);

      return komisiMatch && statusMatch && searchMatch;
    });
  }, [filter, statusFilter, searchQuery]);

  return (
    <div>
      <PageHeader
        title="Program Kerja Resmi OPDIM"
        subtitle="Daftar lengkap seluruh program kerja resmi 5 Komisi OPDIM VISTARA 2026–2027 beserta siklus harian, mingguan, bulanan, dan tahunan."
        badge="Periode 2026–2027"
        breadcrumbs={[{ label: 'Program Kerja' }]}
      />

      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">

          {/* ── STATS ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              { value: programKerjaData.length.toString(), label: 'Total Program Resmi', color: 'var(--deep-violet)', icon: <BookOpen size={16} /> },
              { value: prokerSiklusData.length.toString(), label: 'Program Siklus', color: '#8A6812', icon: <Calendar size={16} /> },
              { value: programKerjaData.filter(p => p.status === 'ongoing').length.toString(), label: 'Sedang Berjalan / Rutin', color: '#2E7D32', icon: <CheckCircle2 size={16} /> },
              { value: programKerjaData.filter(p => p.status === 'planned').length.toString(), label: 'Direncanakan / Usulan', color: 'var(--vistara-purple)', icon: <Sparkles size={16} /> },
            ].map((stat) => (
              <div key={stat.label} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.85rem', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', marginTop: '0.5rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── PROGRAM SIKLUS HIGHLIGHT BANNER ── */}
          <div
            className="card-dark"
            style={{
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2.5rem',
              background: 'linear-gradient(135deg, var(--deep-violet) 0%, var(--royal-purple) 60%, var(--vistara-purple) 100%)',
              border: '1px solid rgba(185, 154, 225, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge" style={{ background: 'rgba(201, 168, 76, 0.2)', color: 'var(--gold-soft)', border: '1px solid rgba(201, 168, 76, 0.4)', marginBottom: '0.4rem' }}>
                  ⭐ Rutinitas Terjadwal
                </span>
                <h3 style={{ color: 'white', fontSize: '1.3rem', margin: 0 }}>
                  Program Kerja Siklus Resmi OPDIM
                </h3>
                <p style={{ color: 'rgba(237, 230, 248, 0.85)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                  Pembiasaan harian, mingguan, bulanan, hingga festival akbar tahunan bersama Hizbul Wathan.
                </p>
              </div>

              <button
                onClick={() => setFilter(filter === 'siklus' ? 'all' : 'siklus')}
                className="btn btn-gold btn-sm"
                style={{ cursor: 'pointer' }}
              >
                {filter === 'siklus' ? 'Tampilkan Semua Program' : 'Filter Program Siklus'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {prokerSiklusData.map((siklus) => (
                <Link
                  key={siklus.id}
                  to={`/beranda/program-kerja/${siklus.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="glass"
                    style={{
                      borderRadius: '12px',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(185, 154, 225, 0.2)',
                      transition: 'all var(--transition-fast)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.16)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.65rem' }}>
                        {siklus.frekuensi}
                      </span>
                      <span style={{ fontSize: '1.25rem' }}>{siklus.icon}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'white', lineHeight: 1.3, marginBottom: '0.35rem' }}>
                      {siklus.judul}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(237, 230, 248, 0.8)', lineHeight: 1.5, margin: 0, marginTop: 'auto' }}>
                      {siklus.artinya}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── SEARCH & FILTERS CONTROLS ── */}
          <div style={{ background: 'var(--ghost-purple)', borderRadius: '16px', border: '1px solid var(--pale-lilac)', padding: '1.25rem', marginBottom: '2rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mid-grey)' }} />
              <input
                type="text"
                placeholder="Cari program kerja berdasarkan judul, komisi, tujuan, atau personil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--pale-lilac)',
                  background: 'white',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--mid-grey)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  ✕ Hapus
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Category / Commission Filter */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem' }}>
                  <Filter size={14} style={{ color: 'var(--mid-grey)' }} />
                  <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', fontWeight: 700, textTransform: 'uppercase' }}>Kategori:</span>
                </div>

                {[
                  { label: 'Semua Program', value: 'all' },
                  { label: '📅 Program Siklus', value: 'siklus' },
                  { label: '🛡️ Komisi 1 (Keamanan)', value: 'Komisi 1' },
                  { label: '🤝 Komisi 2 (Eksternal)', value: 'Komisi 2' },
                  { label: '🌱 Komisi 3 (Lingkungan)', value: 'Komisi 3' },
                  { label: '💬 Komisi 4 (Aspirasi)', value: 'Komisi 4' },
                  { label: '📸 Komisi 5 (Humas)', value: 'Komisi 5' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      padding: '0.35rem 0.85rem',
                      background: filter === opt.value ? 'var(--vistara-purple)' : 'white',
                      color: filter === opt.value ? 'white' : 'var(--deep-violet)',
                      boxShadow: filter === opt.value ? '0 2px 8px rgba(107,63,160,0.3)' : 'none',
                      transition: 'all var(--transition-fast)',
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                    aria-pressed={filter === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--pale-lilac)' }}>
                <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', fontWeight: 700, textTransform: 'uppercase', marginRight: '0.5rem' }}>Status:</span>
                {[
                  { label: 'Semua Status', value: 'all' },
                  { label: '🟢 Berlangsung / Rutin', value: 'ongoing' },
                  { label: '🟣 Direncanakan / Usulan', value: 'planned' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      background: statusFilter === opt.value ? 'var(--deep-violet)' : 'rgba(255,255,255,0.7)',
                      color: statusFilter === opt.value ? 'white' : 'var(--mid-grey)',
                      border: `1px solid ${statusFilter === opt.value ? 'transparent' : 'var(--pale-lilac)'}`,
                      padding: '0.3rem 0.75rem',
                      transition: 'all var(--transition-fast)',
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.72rem',
                    }}
                    aria-pressed={statusFilter === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.85rem', color: 'var(--mid-grey)' }}>
              Menampilkan <strong style={{ color: 'var(--deep-violet)', fontSize: '1rem' }}>{filtered.length}</strong> program kerja resmi
              {filter !== 'all' && <span> • Kategori: <em>{filter}</em></span>}
              {searchQuery && <span> • Kata kunci: "{searchQuery}"</span>}
            </div>

            {(filter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--vistara-purple)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          {/* ── PROGRAM GRID ── */}
          {filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada program kerja yang cocok"
              description="Coba ubah kata kunci pencarian atau sesuaikan filter komisi/status."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((proker) => (
                <article
                  key={proker.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: `4px solid ${proker.komisiColor}`,
                    transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
                  }}
                >
                  {/* Badges row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span
                        className="badge"
                        style={{
                          background: `${proker.komisiColor}18`,
                          color: proker.komisiColor,
                          border: `1px solid ${proker.komisiColor}35`,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      >
                        {proker.komisi}
                      </span>
                      {proker.frekuensi && (
                        <span
                          className="badge"
                          style={{
                            background: 'var(--lavender-mist)',
                            color: 'var(--royal-purple)',
                            fontSize: '0.62rem',
                          }}
                        >
                          {proker.frekuensi}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={proker.status} />
                  </div>

                  {/* Title */}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--deep-violet)', marginBottom: '0.625rem', lineHeight: 1.35 }}>
                    {proker.title}
                  </h3>

                  {/* Description */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: '0.75rem', flex: 1 }}>
                    {proker.description}
                  </p>

                  {/* Tujuan / Fungsi highlight snippet */}
                  {(proker.tujuan || proker.fungsi) && (
                    <div style={{ background: 'var(--ghost-purple)', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', borderLeft: `2px solid ${proker.komisiColor}` }}>
                      <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--vistara-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {proker.tujuan ? 'Tujuan Program' : 'Fungsi Utama'}:
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--charcoal)', lineHeight: 1.5, margin: 0, marginTop: '0.15rem' }}>
                        {proker.tujuan || proker.fungsi}
                      </p>
                    </div>
                  )}

                  {/* Meta stats grid */}
                  <div style={{ background: 'var(--lavender-mist)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: '0.15rem' }}>
                          Timeline
                        </div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--deep-violet)', fontWeight: 700 }}>
                          {proker.timeline}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: '0.15rem' }}>
                          Target / Output
                        </div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--deep-violet)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proker.targetOutput}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detail link */}
                  <Link
                    to={`/beranda/program-kerja/${proker.slug}`}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                  >
                    Lihat Detail Lengkap & SOP <ArrowRight size={14} />
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* ── MATRIKS LENGKAP SELURUH PROKER (Sesuai Bab 6 Dokumen Rekap) ── */}
          <div style={{ marginTop: '5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="section-label">Bab 6 Dokumen Rekap</div>
              <h2 style={{ fontSize: '1.75rem', color: 'var(--deep-violet)' }}>
                Matriks Rekapitulasi Seluruh Program Kerja
              </h2>
              <p style={{ color: 'var(--mid-grey)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Tabel kompilasi terpadu 23 program kerja resmi OPDIM MAM Unggulan Kota Gorontalo 2026–2027 tanpa ada poin yang dihilangkan.
              </p>
            </div>

            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '16px', border: '1px solid var(--pale-lilac)', boxShadow: '0 4px 20px rgba(45,27,105,0.04)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
                <thead>
                  <tr style={{ background: 'var(--ghost-purple)', borderBottom: '2px solid var(--pale-lilac)' }}>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Unit / Komisi</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Nama Program</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Jenis / Frekuensi</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Inti Kegiatan & Tujuan</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-header)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {programKerjaData.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--lavender-mist)',
                        background: idx % 2 === 0 ? 'white' : 'var(--warm-white)',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span className="badge" style={{ background: `${item.komisiColor}15`, color: item.komisiColor, fontWeight: 700, fontSize: '0.65rem' }}>
                          {item.komisi}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <strong style={{ color: 'var(--deep-violet)', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>
                          {item.title}
                        </strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', fontSize: '0.8rem', color: 'var(--mid-grey)' }}>
                        {item.frekuensi || item.timeline}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', fontSize: '0.8rem', color: 'var(--charcoal)', maxWidth: '320px', lineHeight: 1.5 }}>
                        {item.tujuan || item.description}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <StatusBadge status={item.status} />
                      </td>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', textAlign: 'center' }}>
                        <Link
                          to={`/beranda/program-kerja/${item.slug}`}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── BLUEPRINT DIPLOMASI KOMISI 2 & SISTEM PENDUKUNG ── */}
          <div style={{ marginTop: '5rem' }}>
            <div className="section-label">Blueprint Khusus Komisi 2</div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--deep-violet)', marginBottom: '0.5rem' }}>
              Arsitektur Diplomasi & Tata Kelola Hubungan Eksternal
            </h2>
            <p style={{ color: 'var(--mid-grey)', fontSize: '0.95rem', maxWidth: '750px', marginBottom: '2rem' }}>
              Komisi 2 hadir sebagai unit diplomasi strategis yang proaktif membangun hubungan, menginisiasi pertukaran wawasan, dan memfasilitasi kerja nyata antarsekolah.
            </p>

            {/* Blueprint Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[
                { id: 'pilar', label: '3 Pilar Filosofi Diplomasi' },
                { id: 'tahapan', label: '9 Tahapan Model Kolaborasi' },
                { id: 'peran', label: 'Sinergi Komisi 2 vs Komisi 5' },
                { id: 'protokol', label: 'Protokol SOP Otoritas' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabBlueprint(tab.id as any)}
                  className="badge"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    background: activeTabBlueprint === tab.id ? 'var(--deep-violet)' : 'var(--ghost-purple)',
                    color: activeTabBlueprint === tab.id ? 'white' : 'var(--charcoal)',
                    border: `1px solid ${activeTabBlueprint === tab.id ? 'transparent' : 'var(--pale-lilac)'}`,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="card" style={{ padding: '1.75rem', border: '1.5px solid var(--pale-lilac)' }}>
              {activeTabBlueprint === 'pilar' && (
                <div>
                  <h3 style={{ color: 'var(--deep-violet)', marginBottom: '1rem', fontSize: '1.2rem' }}>
                    Tiga Pilar Filosofi Diplomasi Komisi 2
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {komisi2DiplomasiBlueprint.filosofi.map((p, idx) => (
                      <div key={idx} style={{ background: 'var(--ghost-purple)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid var(--royal-purple)' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--deep-violet)', marginBottom: '0.25rem' }}>
                          {idx + 1}. {p.pilar}
                        </div>
                        <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.78rem', color: 'var(--vistara-purple)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                          "{p.slogan}"
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, margin: 0 }}>
                          {p.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTabBlueprint === 'tahapan' && (
                <div>
                  <h3 style={{ color: 'var(--deep-violet)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                    Model Jaringan Kolaborasi Aktif (9 Tahapan)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: '1.25rem' }}>
                    Connect → Exchange → Collaborate → Grow → Maintain
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {komisi2DiplomasiBlueprint.tahapanModel.map((t) => (
                      <div key={t.nomor} style={{ display: 'flex', gap: '0.75rem', background: 'var(--warm-white)', padding: '0.875rem', borderRadius: '10px', border: '1px solid var(--pale-lilac)' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--lavender-mist)', color: 'var(--deep-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                          {t.nomor}
                        </span>
                        <div>
                          <strong style={{ color: 'var(--deep-violet)', fontSize: '0.9rem', display: 'block' }}>{t.tahap}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>{t.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTabBlueprint === 'peran' && (
                <div>
                  <h3 style={{ color: 'var(--deep-violet)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                    Pembagian Peran: Komisi 2 vs Komisi 5 (Relationship ≠ Media)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                    "Komisi 2 membangun dan merawat relasi diplomasinya; Komisi 5 mendokumentasikan momentumnya dan mengabarkan keberhasilannya kepada publik luas."
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--ghost-purple)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid var(--royal-purple)' }}>
                      <span className="badge" style={{ background: 'var(--royal-purple)', color: 'white', marginBottom: '0.5rem' }}>Komisi 2</span>
                      <h4 style={{ color: 'var(--deep-violet)', margin: '0.25rem 0 0.5rem' }}>{komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi2.gelar}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                        <strong>Fokus:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi2.fokus}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                        <strong>Kegiatan:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi2.kegiatan}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                        <strong>Batasan:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi2.batasan}
                      </p>
                    </div>

                    <div style={{ background: 'var(--warm-white)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid var(--gold-accent)' }}>
                      <span className="badge" style={{ background: 'var(--gold-accent)', color: 'white', marginBottom: '0.5rem' }}>Komisi 5</span>
                      <h4 style={{ color: 'var(--deep-violet)', margin: '0.25rem 0 0.5rem' }}>{komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi5.gelar}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                        <strong>Fokus:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi5.fokus}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                        <strong>Kegiatan:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi5.kegiatan}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                        <strong>Batasan:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi5.batasan}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTabBlueprint === 'protokol' && (
                <div>
                  <h3 style={{ color: 'var(--deep-violet)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                    Tata Kelola & Protokol Otoritas SOP
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: '1.25rem' }}>
                    Pedoman pembagian kewenangan mandiri versus hal yang wajib berkoordinasi dan mengantongi izin resmi Pembina & Kepala Madrasah.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ background: 'rgba(46, 125, 50, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(46, 125, 50, 0.2)' }}>
                      <h4 style={{ color: '#2E7D32', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ✓ Dapat Dilakukan Mandiri oleh Komisi 2:
                      </h4>
                      <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--charcoal)' }}>
                        {komisi2DiplomasiBlueprint.protokolOtoritas.mandiri.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: 'rgba(230, 81, 0, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(230, 81, 0, 0.2)' }}>
                      <h4 style={{ color: '#E65100', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚠️ Wajib Izin Pembina & Kepala Madrasah:
                      </h4>
                      <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--charcoal)' }}>
                        {komisi2DiplomasiBlueprint.protokolOtoritas.wajibIzin.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
