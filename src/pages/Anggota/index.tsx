import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  Network,
  ArrowRight,
  X,
  Building2,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PageHeader } from '../../components/shared/PageHeader';
import OrgStructureCanvas, { type OrgTreeNodeKey } from '../../components/shared/OrgStructureCanvas';
import { EmptyState, LoadingState } from '../../components/ui';
import { AnimatedCounter, ScrollReveal } from '../../components/motion/MotionPrimitives';
import { useMotionSystem } from '../../components/motion/MotionProvider';
import { ANGGOTA_LEVEL_LABELS, ANGGOTA_UNIT_META } from '../../data/anggotaSeed';
import { fetchAnggotaOpdim, subscribeToTableChanges } from '../../services/dataClient';
import type { AnggotaOpdim, AnggotaUnit } from '../../types';

const UNIT_ORDER: AnggotaUnit[] = [
  'pimpinan',
  'inti',
  'komisi1',
  'komisi2',
  'komisi3',
  'komisi4',
  'komisi5',
];

function getInitials(name: string): string {
  const cleaned = name
    .replace(/\b(Hj\.|Dr\.|Drs\.|H\.|Moh\.|Muhamad|Muhammad)\b/gi, '')
    .replace(/,.*$/, '')
    .trim();
  const source = cleaned || name.replace(/,.*$/, '').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'OP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Anggota() {
  const { reducedMotion } = useMotionSystem();
  const [members, setMembers] = useState<AnggotaOpdim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<'all' | AnggotaUnit>('all');
  const [focusedTreeNode, setFocusedTreeNode] = useState<OrgTreeNodeKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<AnggotaOpdim | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      void fetchAnggotaOpdim()
        .then((records) => {
          if (!active) return;
          const activeMembers = records
            .filter((item) => item.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setMembers(activeMembers);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    };
    load();
    const unsub = subscribeToTableChanges('anggota_opdim', load);
    return () => {
      active = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!selectedMember) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedMember(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedMember]);

  const countsByUnit = useMemo(() => {
    const map: Record<AnggotaUnit, number> = {
      pimpinan: 0,
      inti: 0,
      komisi1: 0,
      komisi2: 0,
      komisi3: 0,
      komisi4: 0,
      komisi5: 0,
    };
    for (const m of members) {
      map[m.unit] = (map[m.unit] || 0) + 1;
    }
    return map;
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      const unitMatch = selectedUnit === 'all' || member.unit === selectedUnit;
      if (!unitMatch) return false;
      if (focusedTreeNode === 'kepala_madrasah') {
        return member.peranLevel === 'kepala_madrasah';
      }
      if (focusedTreeNode === 'pembina') {
        return member.peranLevel === 'pembina';
      }
      if (!q) return true;
      return (
        member.fullName.toLowerCase().includes(q) ||
        member.jabatan.toLowerCase().includes(q) ||
        (member.tugasUtama || '').toLowerCase().includes(q) ||
        ANGGOTA_UNIT_META[member.unit].label.toLowerCase().includes(q)
      );
    });
  }, [members, selectedUnit, focusedTreeNode, searchQuery]);

  const groupedUnits = useMemo(() => {
    const orderToShow =
      selectedUnit === 'all' ? UNIT_ORDER : UNIT_ORDER.filter((u) => u === selectedUnit);
    return orderToShow
      .map((unitKey) => ({
        meta: ANGGOTA_UNIT_META[unitKey],
        items: filteredMembers.filter((m) => m.unit === unitKey),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredMembers, selectedUnit]);

  const handleSelectTreeNode = (node: OrgTreeNodeKey) => {
    if (focusedTreeNode === node) {
      setFocusedTreeNode(null);
      setSelectedUnit('all');
      return;
    }
    setFocusedTreeNode(node);
    if (node === 'kepala_madrasah' || node === 'pembina') {
      setSelectedUnit('pimpinan');
    } else {
      setSelectedUnit(node);
    }
  };

  const resetFilter = () => {
    setFocusedTreeNode(null);
    setSelectedUnit('all');
    setSearchQuery('');
  };

  const activeInspectionUnit: AnggotaUnit | null =
    selectedUnit !== 'all' ? selectedUnit : null;

  return (
    <div className="anggota-public-page">
      <style>{`
        .anggota-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .anggota-unit-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .anggota-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(225px, 1fr));
          gap: 1.15rem;
        }
        .anggota-card-portrait {
          aspect-ratio: 4 / 3;
        }
        .anggota-card-initials {
          width: 64px;
          height: 64px;
          font-size: 1.3rem;
        }
        .anggota-card-body {
          padding: 0.95rem 1rem 1.05rem;
        }
        .anggota-card-name {
          font-size: 0.98rem;
        }
        .anggota-card-desc {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 767px) {
          .anggota-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.65rem;
            margin-bottom: 1.25rem;
          }
          .anggota-kpi-card {
            padding: 0.85rem 0.9rem !important;
          }
          .anggota-kpi-num {
            font-size: 1.55rem !important;
          }
          .anggota-kpi-sub {
            display: none;
          }
          .anggota-unit-tabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding-bottom: 0.15rem;
          }
          .anggota-unit-tabs::-webkit-scrollbar {
            display: none;
          }
          .anggota-unit-tab-btn {
            flex-shrink: 0;
            white-space: nowrap;
          }
          .anggota-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.7rem;
          }
          .anggota-card-portrait {
            aspect-ratio: 1 / 1;
          }
          .anggota-card-initials {
            width: 52px;
            height: 52px;
            font-size: 1.05rem;
          }
          .anggota-card-body {
            padding: 0.72rem 0.75rem 0.82rem;
            gap: 0.22rem !important;
          }
          .anggota-card-name {
            font-size: 0.88rem;
            line-height: 1.25 !important;
          }
          .anggota-card-desc {
            display: none;
          }
        }
      `}</style>

      <PageHeader
        title="Struktur & Anggota OPDIM"
        subtitle="Susunan resmi Kepala Madrasah, Pembina, Pengurus Inti, dan 5 Komisi Pelaksana OPDIM VISTARA periode 2026–2027."
        badge="Direktori Kepengurusan Resmi"
        breadcrumbs={[
          { label: 'Beranda', href: '/beranda' },
          { label: 'Anggota OPDIM' },
        ]}
      />

      <section className="section-padding" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          {/* ── Compact KPI Strip (2x2 on Mobile, 4 Columns on Desktop) ── */}
          <div className="anggota-kpi-grid">
            {[
              {
                label: 'Total Personel',
                value: members.length,
                detail: 'Terdaftar pada struktur resmi',
                accent: 'var(--deep-violet)',
              },
              {
                label: 'Pimpinan & Pembina',
                value: countsByUnit.pimpinan,
                detail: 'Kepala Madrasah & Pembina',
                accent: 'var(--gold-accent)',
              },
              {
                label: 'Pengurus Inti',
                value: countsByUnit.inti,
                detail: 'Ketua, Wakil, Sekr, Bend, Korlap',
                accent: 'var(--royal-purple)',
              },
              {
                label: 'Komisi Pelaksana',
                value: 5,
                detail: `${members.length - countsByUnit.pimpinan - countsByUnit.inti} personel di 5 komisi`,
                accent: 'var(--vistara-purple)',
              },
            ].map((stat, idx) => (
              <ScrollReveal key={stat.label} preset="fadeUp" delay={idx * 0.04}>
                <div
                  className="anggota-kpi-card"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--pale-lilac)',
                    borderRadius: '14px',
                    padding: '1.15rem 1.25rem',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: 'var(--mid-grey)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    className="anggota-kpi-num"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.9rem',
                      lineHeight: 1.1,
                      color: stat.accent,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <AnimatedCounter target={stat.value} />
                  </div>
                  <div
                    className="anggota-kpi-sub"
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--mid-grey)',
                      marginTop: '0.3rem',
                    }}
                  >
                    {stat.detail}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* ── Interactive Pinch-to-Zoom & Pan Organizational Diagram ── */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--pale-lilac)',
              borderRadius: '16px',
              padding: 'clamp(1rem, 2.5vw, 1.5rem)',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.65rem',
                paddingBottom: '0.85rem',
                borderBottom: '1px solid var(--pale-lilac)',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    color: 'var(--vistara-purple)',
                    marginBottom: '0.2rem',
                  }}
                >
                  <Network size={14} /> Visualisasi Struktur Interaktif
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                    color: 'var(--deep-violet)',
                    margin: 0,
                  }}
                >
                  Garis Koordinasi OPDIM VISTARA 2026–2027
                </h2>
              </div>

              {(selectedUnit !== 'all' || focusedTreeNode || searchQuery) && (
                <button
                  type="button"
                  onClick={resetFilter}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minHeight: '40px' }}
                >
                  <RotateCcw size={14} /> Reset ({members.length})
                </button>
              )}
            </div>

            <OrgStructureCanvas
              members={members}
              selectedNode={
                focusedTreeNode ??
                (selectedUnit === 'all'
                  ? null
                  : selectedUnit === 'pimpinan'
                    ? 'kepala_madrasah'
                    : selectedUnit)
              }
              onSelectNode={handleSelectTreeNode}
            />

            {/* Active Unit Summary Callout */}
            {activeInspectionUnit && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.95rem 1.1rem',
                  borderRadius: '12px',
                  background: 'var(--ghost-purple)',
                  border: '1px solid var(--pale-lilac)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: '1 1 260px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: ANGGOTA_UNIT_META[activeInspectionUnit].accentColor,
                    }}
                  >
                    Fokus Unit Terpilih · {filteredMembers.length} Personel
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '0.98rem',
                      color: 'var(--deep-violet)',
                      marginTop: '0.15rem',
                    }}
                  >
                    {ANGGOTA_UNIT_META[activeInspectionUnit].label}
                  </div>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--charcoal)',
                      margin: '0.2rem 0 0',
                      lineHeight: 1.5,
                    }}
                  >
                    {ANGGOTA_UNIT_META[activeInspectionUnit].description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFilter}
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '40px' }}
                >
                  Tampilkan Semua
                </button>
              </div>
            )}
          </div>

          {/* ── Searchbar & Single-Line Scrollable Unit Filter Bar ── */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--pale-lilac)',
              borderRadius: '14px',
              padding: '0.95rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--mid-grey)',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama anggota, jabatan, atau komisi..."
                  aria-label="Cari anggota OPDIM"
                  style={{
                    width: '100%',
                    padding: searchQuery ? '0.6rem 2.6rem 0.6rem 2.45rem' : '0.6rem 0.9rem 0.6rem 2.45rem',
                    borderRadius: '10px',
                    border: '1px solid var(--pale-lilac)',
                    fontSize: '0.9rem',
                    color: 'var(--deep-violet)',
                    background: 'var(--warm-white)',
                    minHeight: '44px',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Hapus pencarian"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '0.3rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--mid-grey)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--mid-grey)',
                  fontFamily: 'var(--font-header)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {filteredMembers.length} dari {members.length} personel
              </div>
            </div>

            <div className="anggota-unit-tabs" role="tablist" aria-label="Filter Unit OPDIM">
              <button
                type="button"
                role="tab"
                aria-selected={selectedUnit === 'all' && !focusedTreeNode}
                onClick={() => {
                  setFocusedTreeNode(null);
                  setSelectedUnit('all');
                }}
                className="anggota-unit-tab-btn"
                style={{
                  padding: '0.45rem 0.85rem',
                  minHeight: '40px',
                  borderRadius: '8px',
                  border:
                    selectedUnit === 'all' && !focusedTreeNode
                      ? '1px solid var(--deep-violet)'
                      : '1px solid var(--pale-lilac)',
                  background:
                    selectedUnit === 'all' && !focusedTreeNode ? 'var(--deep-violet)' : '#FFFFFF',
                  color: selectedUnit === 'all' && !focusedTreeNode ? '#FFFFFF' : 'var(--charcoal)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Semua ({members.length})
              </button>
              {UNIT_ORDER.map((unitKey) => {
                const meta = ANGGOTA_UNIT_META[unitKey];
                const isActive = selectedUnit === unitKey && !focusedTreeNode;
                return (
                  <button
                    key={unitKey}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setFocusedTreeNode(null);
                      setSelectedUnit(unitKey);
                    }}
                    className="anggota-unit-tab-btn"
                    style={{
                      padding: '0.45rem 0.85rem',
                      minHeight: '40px',
                      borderRadius: '8px',
                      border: isActive
                        ? `1px solid ${meta.accentColor}`
                        : '1px solid var(--pale-lilac)',
                      background: isActive ? meta.accentColor : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : 'var(--charcoal)',
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {meta.shortLabel} ({countsByUnit[unitKey]})
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Member Photo Cards Directory (2-Column Compact on Mobile) ── */}
          {isLoading ? (
            <LoadingState />
          ) : groupedUnits.length === 0 ? (
            <EmptyState
              icon={<Users size={36} />}
              title="Personel tidak ditemukan"
              description="Tidak ada data pengurus yang sesuai dengan filter atau kata kunci pencarian saat ini."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {groupedUnits.map(({ meta, items }) => (
                <section key={meta.unit} aria-labelledby={`unit-heading-${meta.unit}`}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: '0.4rem',
                      paddingBottom: '0.6rem',
                      borderBottom: '1px solid var(--pale-lilac)',
                      marginBottom: '0.95rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-header)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.09em',
                          textTransform: 'uppercase',
                          color: meta.accentColor,
                        }}
                      >
                        {meta.shortLabel} · {items.length} Personel
                      </div>
                      <h3
                        id={`unit-heading-${meta.unit}`}
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: 'clamp(1.08rem, 2.5vw, 1.28rem)',
                          color: 'var(--deep-violet)',
                          margin: '0.15rem 0 0',
                        }}
                      >
                        {meta.label}
                      </h3>
                    </div>
                  </div>

                  <div className="anggota-card-grid">
                    {items.map((member) => (
                      <motion.button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        whileHover={reducedMotion ? undefined : { y: -3 }}
                        style={{
                          textAlign: 'left',
                          background: '#FFFFFF',
                          border: '1px solid var(--pale-lilac)',
                          borderRadius: '13px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: 0,
                          transition: 'border-color 160ms ease, box-shadow 160ms ease',
                        }}
                      >
                        {/* Portrait Frame */}
                        <div
                          className="anggota-card-portrait"
                          style={{
                            position: 'relative',
                            width: '100%',
                            background:
                              'linear-gradient(145deg, rgba(107, 63, 160, 0.08) 0%, rgba(201, 168, 76, 0.08) 100%)',
                            borderBottom: '1px solid var(--pale-lilac)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {member.fotoUrl ? (
                            <img
                              src={member.fotoUrl}
                              alt={`Foto ${member.fullName}`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'top center',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                padding: '0.5rem',
                              }}
                            >
                              <div
                                className="anggota-card-initials"
                                style={{
                                  borderRadius: '50%',
                                  background: '#FFFFFF',
                                  border: `1.5px solid ${meta.accentColor}55`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 800,
                                  color: meta.accentColor,
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {getInitials(member.fullName)}
                              </div>
                              <span
                                style={{
                                  fontFamily: 'var(--font-header)',
                                  fontSize: '0.62rem',
                                  letterSpacing: '0.07em',
                                  textTransform: 'uppercase',
                                  color: 'var(--mid-grey)',
                                }}
                              >
                                VISTARA
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Text Content */}
                        <div
                          className="anggota-card-body"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.3rem',
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'var(--font-header)',
                              fontSize: '0.64rem',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: meta.accentColor,
                            }}
                          >
                            {meta.shortLabel} · {ANGGOTA_LEVEL_LABELS[member.peranLevel]}
                          </div>

                          <div
                            className="anggota-card-name"
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 800,
                              lineHeight: 1.28,
                              color: 'var(--deep-violet)',
                            }}
                          >
                            {member.fullName}
                          </div>

                          <div
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              color: 'var(--charcoal)',
                              lineHeight: 1.35,
                            }}
                          >
                            {member.jabatan}
                          </div>

                          {member.tugasUtama && (
                            <p
                              className="anggota-card-desc"
                              style={{
                                fontSize: '0.76rem',
                                color: 'var(--mid-grey)',
                                lineHeight: 1.48,
                                margin: '0.2rem 0 0',
                              }}
                            >
                              {member.tugasUtama}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Bottom Cross-Link */}
          <div
            style={{
              marginTop: '2.5rem',
              padding: '1.25rem 1.35rem',
              borderRadius: '14px',
              background: 'var(--ghost-purple)',
              border: '1px solid var(--pale-lilac)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.9rem',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: 'var(--deep-violet)',
                }}
              >
                Ingin mengenal program kerja tiap komisi?
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--mid-grey)', margin: '0.2rem 0 0' }}>
                Jelajahi daftar lengkap program kerja harian, mingguan, bulanan, hingga tahunan OPDIM VISTARA.
              </p>
            </div>
            <Link
              to="/beranda/program-kerja"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', minHeight: '44px' }}
            >
              Lihat Program Kerja <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Member Detail Modal ── */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 80,
              background: 'rgba(18, 9, 34, 0.65)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="member-modal-title"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '500px',
                background: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid var(--pale-lilac)',
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(15, 8, 34, 0.35)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 10',
                  background:
                    'linear-gradient(145deg, rgba(107, 63, 160, 0.1) 0%, rgba(201, 168, 76, 0.12) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid var(--pale-lilac)',
                }}
              >
                {selectedMember.fotoUrl ? (
                  <img
                    src={selectedMember.fotoUrl}
                    alt={`Foto ${selectedMember.fullName}`}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top center',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      border: `2px solid ${ANGGOTA_UNIT_META[selectedMember.unit].accentColor}55`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.8rem',
                      color: ANGGOTA_UNIT_META[selectedMember.unit].accentColor,
                    }}
                  >
                    {getInitials(selectedMember.fullName)}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  aria-label="Tutup detail anggota"
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.94)',
                    border: '1px solid var(--pale-lilac)',
                    color: 'var(--deep-violet)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '1.35rem 1.4rem 1.5rem' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    color: ANGGOTA_UNIT_META[selectedMember.unit].accentColor,
                  }}
                >
                  {ANGGOTA_UNIT_META[selectedMember.unit].label}
                </div>

                <h3
                  id="member-modal-title"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.3rem',
                    color: 'var(--deep-violet)',
                    margin: '0.25rem 0 0',
                  }}
                >
                  {selectedMember.fullName}
                </h3>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.8rem',
                    marginTop: '0.6rem',
                    paddingBottom: '0.85rem',
                    borderBottom: '1px solid var(--pale-lilac)',
                    fontSize: '0.83rem',
                    color: 'var(--charcoal)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <UserCheck size={15} style={{ color: 'var(--vistara-purple)' }} />
                    {selectedMember.jabatan}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 size={15} style={{ color: 'var(--gold-accent)' }} />
                    {ANGGOTA_LEVEL_LABELS[selectedMember.peranLevel]}
                  </span>
                </div>

                <div style={{ marginTop: '0.85rem' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--mid-grey)',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Tugas Pokok & Amanah
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--charcoal)', lineHeight: 1.65, margin: 0 }}>
                    {selectedMember.tugasUtama ||
                      ANGGOTA_UNIT_META[selectedMember.unit].description}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
