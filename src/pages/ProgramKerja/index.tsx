import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Filter, Search, Calendar,
  BookOpen, CheckCircle2, Sparkles, LayoutGrid, Table, Compass
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge, EmptyState } from '../../components/ui';
import {
  programKerjaData,
  prokerSiklusData,
  komisi2DiplomasiBlueprint
} from '../../data';

type ViewMode = 'cards' | 'matrix' | 'blueprint';

export default function ProgramKerjaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
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
        subtitle="Daftar lengkap seluruh 23 program kerja resmi 5 Komisi OPDIM VISTARA 2026–2027 beserta siklus harian, mingguan, bulanan, dan tahunan."
        badge="Periode 2026–2027"
        breadcrumbs={[{ label: 'Program Kerja' }]}
      />

      <section className="section" style={{ background: 'var(--warm-white)', paddingBottom: '5rem' }}>
        <div className="container">

          {/* ── STATS ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { value: programKerjaData.length.toString(), label: 'Total Program Resmi', color: 'var(--deep-violet)', icon: <BookOpen size={16} /> },
              { value: prokerSiklusData.length.toString(), label: 'Program Siklus', color: '#8A6812', icon: <Calendar size={16} /> },
              { value: programKerjaData.filter(p => p.status === 'ongoing').length.toString(), label: 'Sedang Berjalan / Rutin', color: '#2E7D32', icon: <CheckCircle2 size={16} /> },
              { value: programKerjaData.filter(p => p.status === 'planned').length.toString(), label: 'Direncanakan / Usulan', color: 'var(--vistara-purple)', icon: <Sparkles size={16} /> },
            ].map((stat) => (
              <div key={stat.label} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.85rem', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--mid-grey)', marginTop: '0.5rem', wordBreak: 'break-word' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── VIEW MODE TOGGLE BUTTONS ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', background: 'var(--lavender-mist)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--pale-lilac)' }}>
              {[
                { id: 'cards' as ViewMode, label: 'Katalog Kartu Program', icon: <LayoutGrid size={15} /> },
                { id: 'matrix' as ViewMode, label: 'Tabel Matriks Bab 6', icon: <Table size={15} /> },
                { id: 'blueprint' as ViewMode, label: 'Blueprint Komisi 2', icon: <Compass size={15} /> },
              ].map((vm) => (
                <button
                  key={vm.id}
                  onClick={() => setViewMode(vm.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '9px',
                    border: 'none',
                    fontFamily: 'var(--font-header)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    background: viewMode === vm.id ? 'var(--deep-violet)' : 'transparent',
                    color: viewMode === vm.id ? 'white' : 'var(--deep-violet)',
                    boxShadow: viewMode === vm.id ? '0 2px 8px rgba(45, 27, 105, 0.25)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {vm.icon}
                  <span>{vm.label}</span>
                </button>
              ))}
            </div>

            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.82rem', color: 'var(--mid-grey)' }}>
              Total <strong style={{ color: 'var(--deep-violet)' }}>23 Program Resmi</strong> terdata sesuai berkas
            </div>
          </div>

          {/* ── TAB 1: CARDS VIEW ── */}
          {viewMode === 'cards' && (
            <>
              {/* SIKLUS HIGHLIGHT BANNER */}
              <div
                className="card-dark"
                style={{
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  background: 'linear-gradient(135deg, var(--deep-violet) 0%, var(--royal-purple) 60%, var(--vistara-purple) 100%)',
                  border: '1px solid rgba(185, 154, 225, 0.25)',
                  minWidth: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(201, 168, 76, 0.2)', color: 'var(--gold-soft)', border: '1px solid rgba(201, 168, 76, 0.4)', marginBottom: '0.4rem' }}>
                      ⭐ Rutinitas Terjadwal
                    </span>
                    <h3 style={{ color: 'white', fontSize: '1.25rem', margin: 0 }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.875rem' }}>
                  {prokerSiklusData.map((siklus) => (
                    <Link
                      key={siklus.id}
                      to={`/beranda/program-kerja/${siklus.slug}`}
                      style={{ textDecoration: 'none', minWidth: 0 }}
                    >
                      <div
                        className="glass"
                        style={{
                          borderRadius: '12px',
                          padding: '0.875rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(185, 154, 225, 0.2)',
                          transition: 'all var(--transition-fast)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.16)';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', gap: '0.5rem' }}>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.65rem' }}>
                            {siklus.frekuensi}
                          </span>
                          <span style={{ fontSize: '1.15rem' }}>{siklus.icon}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'white', lineHeight: 1.3, marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                          {siklus.judul}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'rgba(237, 230, 248, 0.8)', lineHeight: 1.45, margin: 0, marginTop: 'auto', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {siklus.artinya}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* SEARCH & FILTERS CONTROLS */}
              <div style={{ background: 'var(--ghost-purple)', borderRadius: '16px', border: '1px solid var(--pale-lilac)', padding: '1.25rem', marginBottom: '1.75rem', minWidth: 0 }}>
                {/* Search Input */}
                <div style={{ position: 'relative', marginBottom: '1rem', minWidth: 0 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
                  {/* Category / Commission Filter */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.4rem' }}>
                      <Filter size={13} style={{ color: 'var(--mid-grey)' }} />
                      <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--mid-grey)', fontWeight: 700, textTransform: 'uppercase' }}>Kategori:</span>
                    </div>

                    {[
                      { label: 'Semua', value: 'all' },
                      { label: '📅 Siklus', value: 'siklus' },
                      { label: '🛡️ Komisi 1', value: 'Komisi 1' },
                      { label: '🤝 Komisi 2', value: 'Komisi 2' },
                      { label: '🌱 Komisi 3', value: 'Komisi 3' },
                      { label: '💬 Komisi 4', value: 'Komisi 4' },
                      { label: '📸 Komisi 5', value: 'Komisi 5' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilter(opt.value)}
                        className="badge"
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          background: filter === opt.value ? 'var(--vistara-purple)' : 'white',
                          color: filter === opt.value ? 'white' : 'var(--deep-violet)',
                          boxShadow: filter === opt.value ? '0 2px 6px rgba(107,63,160,0.3)' : 'none',
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
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--pale-lilac)' }}>
                    <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--mid-grey)', fontWeight: 700, textTransform: 'uppercase', marginRight: '0.4rem' }}>Status:</span>
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
                          padding: '0.3rem 0.7rem',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.85rem', color: 'var(--mid-grey)' }}>
                  Menampilkan <strong style={{ color: 'var(--deep-violet)', fontSize: '0.95rem' }}>{filtered.length}</strong> program kerja
                  {filter !== 'all' && <span> • Kategori: <em>{filter}</em></span>}
                  {searchQuery && <span> • Pencarian: "{searchQuery}"</span>}
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
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* PROGRAM GRID */}
              {filtered.length === 0 ? (
                <EmptyState
                  title="Tidak ada program kerja yang cocok"
                  description="Coba ubah kata kunci pencarian atau sesuaikan filter komisi/status."
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: '1.25rem' }}>
                  {filtered.map((proker) => (
                    <article
                      key={proker.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: `4px solid ${proker.komisiColor}`,
                        transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
                        minWidth: 0,
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        padding: '1.25rem',
                      }}
                    >
                      {/* Badges row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
                          <span
                            className="badge"
                            style={{
                              background: `${proker.komisiColor}18`,
                              color: proker.komisiColor,
                              border: `1px solid ${proker.komisiColor}35`,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              wordBreak: 'break-word',
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
                                wordBreak: 'break-word',
                              }}
                            >
                              {proker.frekuensi.replace(' (Setiap Hari Sekolah)', '').replace(' (Rutin Tiap Pekan)', '').replace(' (1x Setiap Bulan)', '').replace(' (Event Puncak Periode)', '')}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={proker.status} />
                      </div>

                      {/* Title */}
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--deep-violet)', marginBottom: '0.5rem', lineHeight: 1.35, wordBreak: 'break-word' }}>
                        {proker.title}
                      </h3>

                      {/* Description */}
                      <p style={{ fontSize: '0.82rem', color: 'var(--charcoal)', lineHeight: 1.55, marginBottom: '0.75rem', flex: 1, wordBreak: 'break-word' }}>
                        {proker.description}
                      </p>

                      {/* Tujuan / Fungsi highlight snippet */}
                      {(proker.tujuan || proker.fungsi) && (
                        <div style={{ background: 'var(--ghost-purple)', borderRadius: '8px', padding: '0.55rem 0.75rem', marginBottom: '0.875rem', borderLeft: `2px solid ${proker.komisiColor}`, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--vistara-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {proker.tujuan ? 'Tujuan Program' : 'Fungsi Utama'}:
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--charcoal)', lineHeight: 1.45, margin: 0, marginTop: '0.15rem', wordBreak: 'break-word' }}>
                            {proker.tujuan || proker.fungsi}
                          </p>
                        </div>
                      )}

                      {/* Meta stats grid — FIXED OVERFLOW WITH minWidth: 0 */}
                      <div style={{ background: 'var(--lavender-mist)', borderRadius: '8px', padding: '0.65rem', marginBottom: '1rem', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.65rem', minWidth: 0 }}>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: '0.15rem' }}>
                              Timeline
                            </div>
                            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--deep-violet)', fontWeight: 700, wordBreak: 'break-word', lineHeight: 1.3 }}>
                              {proker.timeline}
                            </div>
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: '0.15rem' }}>
                              Target / Output
                            </div>
                            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', color: 'var(--deep-violet)', fontWeight: 700, wordBreak: 'break-word', lineHeight: 1.3 }}>
                              {proker.targetOutput}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detail link */}
                      <Link
                        to={`/beranda/program-kerja/${proker.slug}`}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                      >
                        Detail Lengkap & SOP <ArrowRight size={13} />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB 2: MATRIKS REKAPITULASI BAB 6 ── */}
          {viewMode === 'matrix' && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ marginBottom: '1.25rem', background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--pale-lilac)' }}>
                <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>Bab 6 Dokumen Rekap</span>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--deep-violet)', margin: '0 0 0.35rem' }}>
                  Matriks Rekapitulasi Seluruh Program Kerja
                </h2>
                <p style={{ color: 'var(--mid-grey)', fontSize: '0.85rem', margin: 0 }}>
                  Tabel kompilasi komprehensif 23 program kerja resmi OPDIM MAM Unggulan Kota Gorontalo 2026–2027 tanpa ada poin yang dihilangkan.
                </p>
              </div>

              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '16px', border: '1px solid var(--pale-lilac)', boxShadow: '0 4px 20px rgba(45,27,105,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: 'var(--ghost-purple)', borderBottom: '2px solid var(--pale-lilac)' }}>
                      <th style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Unit / Komisi</th>
                      <th style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Nama Program</th>
                      <th style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Jenis / Frekuensi</th>
                      <th style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Inti Kegiatan & Tujuan</th>
                      <th style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-violet)', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
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
                        <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                          <span className="badge" style={{ background: `${item.komisiColor}15`, color: item.komisiColor, fontWeight: 700, fontSize: '0.62rem' }}>
                            {item.komisi}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', wordBreak: 'break-word', minWidth: '160px' }}>
                          <strong style={{ color: 'var(--deep-violet)', fontSize: '0.85rem', fontFamily: 'var(--font-display)' }}>
                            {item.title}
                          </strong>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', fontSize: '0.78rem', color: 'var(--mid-grey)', wordBreak: 'break-word' }}>
                          {item.frekuensi || item.timeline}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', fontSize: '0.78rem', color: 'var(--charcoal)', maxWidth: '280px', lineHeight: 1.45, wordBreak: 'break-word' }}>
                          {item.tujuan || item.description}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                          <StatusBadge status={item.status} />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', textAlign: 'center' }}>
                          <Link
                            to={`/beranda/program-kerja/${item.slug}`}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
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
          )}

          {/* ── TAB 3: BLUEPRINT KOMISI 2 ── */}
          {viewMode === 'blueprint' && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ marginBottom: '1.5rem', background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--pale-lilac)' }}>
                <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>Blueprint Hubungan Eksternal</span>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--deep-violet)', margin: '0 0 0.35rem' }}>
                  Arsitektur Diplomasi Komisi 2 OPDIM VISTARA
                </h2>
                <p style={{ color: 'var(--mid-grey)', fontSize: '0.85rem', maxWidth: '750px', margin: 0 }}>
                  Unit diplomasi strategis yang proaktif membangun hubungan, menginisiasi pertukaran wawasan, dan memfasilitasi kerja nyata antarsekolah di Kota Gorontalo.
                </p>
              </div>

              {/* Blueprint Sub-Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {[
                  { id: 'pilar', label: '3 Pilar Filosofi' },
                  { id: 'tahapan', label: '9 Tahapan Model Jaringan' },
                  { id: 'peran', label: 'Sinergi Komisi 2 vs Komisi 5' },
                  { id: 'protokol', label: 'Protokol Otoritas SOP' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabBlueprint(tab.id as any)}
                    className="badge"
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      background: activeTabBlueprint === tab.id ? 'var(--deep-violet)' : 'white',
                      color: activeTabBlueprint === tab.id ? 'white' : 'var(--charcoal)',
                      border: `1px solid ${activeTabBlueprint === tab.id ? 'transparent' : 'var(--pale-lilac)'}`,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sub-Tab Contents */}
              <div className="card" style={{ padding: '1.5rem', border: '1.5px solid var(--pale-lilac)', minWidth: 0, wordBreak: 'break-word' }}>
                {activeTabBlueprint === 'pilar' && (
                  <div>
                    <h3 style={{ color: 'var(--deep-violet)', marginBottom: '0.875rem', fontSize: '1.15rem' }}>
                      Tiga Pilar Filosofi Diplomasi Komisi 2
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1rem' }}>
                      {komisi2DiplomasiBlueprint.filosofi.map((p, idx) => (
                        <div key={idx} style={{ background: 'var(--ghost-purple)', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid var(--royal-purple)', minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--deep-violet)', marginBottom: '0.2rem' }}>
                            {idx + 1}. {p.pilar}
                          </div>
                          <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.75rem', color: 'var(--vistara-purple)', fontStyle: 'italic', marginBottom: '0.4rem' }}>
                            "{p.slogan}"
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--charcoal)', lineHeight: 1.55, margin: 0 }}>
                            {p.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTabBlueprint === 'tahapan' && (
                  <div>
                    <h3 style={{ color: 'var(--deep-violet)', marginBottom: '0.4rem', fontSize: '1.15rem' }}>
                      Model Jaringan Kolaborasi Aktif (9 Tahapan)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', marginBottom: '1rem' }}>
                      Connect → Exchange → Collaborate → Grow → Maintain
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
                      {komisi2DiplomasiBlueprint.tahapanModel.map((t) => (
                        <div key={t.nomor} style={{ display: 'flex', gap: '0.65rem', background: 'var(--warm-white)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--pale-lilac)', minWidth: 0 }}>
                          <span style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'var(--lavender-mist)', color: 'var(--deep-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                            {t.nomor}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ color: 'var(--deep-violet)', fontSize: '0.85rem', display: 'block' }}>{t.tahap}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--charcoal)', lineHeight: 1.45 }}>{t.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTabBlueprint === 'peran' && (
                  <div>
                    <h3 style={{ color: 'var(--deep-violet)', marginBottom: '0.4rem', fontSize: '1.15rem' }}>
                      Pembagian Peran: Komisi 2 vs Komisi 5 (Relationship ≠ Media)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', marginBottom: '1.25rem', fontStyle: 'italic' }}>
                      "Komisi 2 membangun dan merawat relasi diplomasinya; Komisi 5 mendokumentasikan momentumnya dan mengabarkan keberhasilannya kepada publik luas."
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
                      <div style={{ background: 'var(--ghost-purple)', padding: '1.15rem', borderRadius: '10px', borderLeft: '4px solid var(--royal-purple)', minWidth: 0 }}>
                        <span className="badge" style={{ background: 'var(--royal-purple)', color: 'white', marginBottom: '0.4rem' }}>Komisi 2</span>
                        <h4 style={{ color: 'var(--deep-violet)', margin: '0.2rem 0 0.4rem', fontSize: '0.95rem' }}>{komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi2.gelar}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--charcoal)', lineHeight: 1.55, marginBottom: '0.4rem' }}>
                          <strong>Fokus:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi2.fokus}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--charcoal)', lineHeight: 1.55, marginBottom: '0.4rem' }}>
                          <strong>Kegiatan:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi2.kegiatan}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--mid-grey)', lineHeight: 1.45, margin: 0, fontStyle: 'italic' }}>
                          <strong>Batasan:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi2.batasan}
                        </p>
                      </div>

                      <div style={{ background: 'var(--warm-white)', padding: '1.15rem', borderRadius: '10px', borderLeft: '4px solid var(--gold-accent)', minWidth: 0 }}>
                        <span className="badge" style={{ background: 'var(--gold-accent)', color: 'white', marginBottom: '0.4rem' }}>Komisi 5</span>
                        <h4 style={{ color: 'var(--deep-violet)', margin: '0.2rem 0 0.4rem', fontSize: '0.95rem' }}>{komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi5.gelar}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--charcoal)', lineHeight: 1.55, marginBottom: '0.4rem' }}>
                          <strong>Fokus:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi5.fokus}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--charcoal)', lineHeight: 1.55, marginBottom: '0.4rem' }}>
                          <strong>Kegiatan:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi5.kegiatan}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--mid-grey)', lineHeight: 1.45, margin: 0, fontStyle: 'italic' }}>
                          <strong>Batasan:</strong> {komisi2DiplomasiBlueprint.sinergiKomisi2dan5.komisi5.batasan}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTabBlueprint === 'protokol' && (
                  <div>
                    <h3 style={{ color: 'var(--deep-violet)', marginBottom: '0.4rem', fontSize: '1.15rem' }}>
                      Tata Kelola & Protokol Otoritas SOP
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', marginBottom: '1rem' }}>
                      Pedoman pembagian kewenangan mandiri versus hal yang wajib berkoordinasi dan mengantongi izin resmi Pembina & Kepala Madrasah.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
                      <div style={{ background: 'rgba(46, 125, 50, 0.05)', padding: '1.15rem', borderRadius: '10px', border: '1px solid rgba(46, 125, 50, 0.2)', minWidth: 0 }}>
                        <h4 style={{ color: '#2E7D32', marginBottom: '0.65rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          ✓ Mandiri oleh Komisi 2:
                        </h4>
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--charcoal)' }}>
                          {komisi2DiplomasiBlueprint.protokolOtoritas.mandiri.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ background: 'rgba(230, 81, 0, 0.05)', padding: '1.15rem', borderRadius: '10px', border: '1px solid rgba(230, 81, 0, 0.2)', minWidth: 0 }}>
                        <h4 style={{ color: '#E65100', marginBottom: '0.65rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          ⚠️ Wajib Izin Pembina & Kepala Madrasah:
                        </h4>
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--charcoal)' }}>
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
          )}

        </div>
      </section>
    </div>
  );
}
