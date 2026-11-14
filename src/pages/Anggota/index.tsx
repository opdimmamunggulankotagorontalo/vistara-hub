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

const KOMISI_UNITS = ['komisi1', 'komisi2', 'komisi3', 'komisi4', 'komisi5'] as const;

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
  const [focusedTreeNode, setFocusedTreeNode] = useState<
    'kepala_madrasah' | 'pembina' | 'inti' | 'komisi1' | 'komisi2' | 'komisi3' | 'komisi4' | 'komisi5' | null
  >(null);
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

  const kepalaMadrasah = useMemo(
    () => members.find((m) => m.peranLevel === 'kepala_madrasah'),
    [members]
  );
  const pembinaOpdim = useMemo(
    () => members.find((m) => m.peranLevel === 'pembina'),
    [members]
  );
  const ketuaOpdim = useMemo(
    () => members.find((m) => m.unit === 'inti' && m.jabatan.toLowerCase().includes('ketua') && !m.jabatan.toLowerCase().includes('wakil')),
    [members]
  );

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

  const handleSelectTreeNode = (
    node:
      | 'kepala_madrasah'
      | 'pembina'
      | 'inti'
      | 'komisi1'
      | 'komisi2'
      | 'komisi3'
      | 'komisi4'
      | 'komisi5'
  ) => {
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
    <div>
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
          {/* ── KPI Strip ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            {[
              {
                label: 'Total Personel Aktif',
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
                detail: 'Ketua, Wakil, Sekretaris, Bendahara, Korlap',
                accent: 'var(--royal-purple)',
              },
              {
                label: 'Komisi Pelaksana',
                value: 5,
                detail: `${members.length - countsByUnit.pimpinan - countsByUnit.inti} personel di 5 komisi`,
                accent: 'var(--vistara-purple)',
              },
            ].map((stat, idx) => (
              <ScrollReveal key={stat.label} preset="fadeUp" delay={idx * 0.05}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--pale-lilac)',
                    borderRadius: '14px',
                    padding: '1.25rem 1.35rem',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--mid-grey)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '2rem',
                      lineHeight: 1.1,
                      color: stat.accent,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <AnimatedCounter target={stat.value} />
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--mid-grey)',
                      marginTop: '0.35rem',
                    }}
                  >
                    {stat.detail}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* ── Interactive Organizational Structure Diagram ── */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--pale-lilac)',
              borderRadius: '18px',
              padding: '1.5rem',
              marginBottom: '2.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--pale-lilac)',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--vistara-purple)',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Network size={14} /> Visualisasi Struktur Interaktif
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.35rem',
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RotateCcw size={14} /> Tampilkan Semua ({members.length})
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--mid-grey)', margin: '0 0 1.5rem' }}>
              Klik salah satu kotak jabatan atau komisi pada bagan di bawah untuk menyaring daftar kartu anggota serta membaca tugas pokok unit terkait.
            </p>

            {/* Hierarchical Flow Canvas */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0',
              }}
            >
              {/* Tier 1: Kepala Madrasah */}
              <button
                type="button"
                onClick={() => handleSelectTreeNode('kepala_madrasah')}
                aria-pressed={focusedTreeNode === 'kepala_madrasah'}
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  textAlign: 'left',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  border:
                    focusedTreeNode === 'kepala_madrasah'
                      ? '2px solid #C9A84C'
                      : '1px solid rgba(201, 168, 76, 0.45)',
                  background:
                    focusedTreeNode === 'kepala_madrasah'
                      ? 'rgba(201, 168, 76, 0.14)'
                      : 'rgba(201, 168, 76, 0.06)',
                  cursor: 'pointer',
                  transition: 'transform 160ms ease, border-color 160ms ease, background 160ms ease',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#8A6812',
                  }}
                >
                  Penanggung Jawab Tertinggi · Pimpinan Lembaga
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    color: 'var(--deep-violet)',
                    marginTop: '0.2rem',
                  }}
                >
                  {kepalaMadrasah?.fullName || 'Hj. Sitti Khasriani, S.S., M.Pd.'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)', marginTop: '0.15rem' }}>
                  {kepalaMadrasah?.jabatan || 'Kepala Madrasah'}
                </div>
              </button>

              {/* Vertical connector */}
              <div
                aria-hidden="true"
                style={{ width: '2px', height: '24px', background: 'var(--soft-lilac)' }}
              />

              {/* Tier 2: Pembina OPDIM */}
              <button
                type="button"
                onClick={() => handleSelectTreeNode('pembina')}
                aria-pressed={focusedTreeNode === 'pembina'}
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  textAlign: 'left',
                  padding: '0.95rem 1.25rem',
                  borderRadius: '14px',
                  border:
                    focusedTreeNode === 'pembina'
                      ? '2px solid var(--royal-purple)'
                      : '1px solid var(--pale-lilac)',
                  background:
                    focusedTreeNode === 'pembina' ? 'var(--ghost-purple)' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'transform 160ms ease, border-color 160ms ease, background 160ms ease',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--royal-purple)',
                  }}
                >
                  Pembimbing Teknis & Pengarah
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--deep-violet)',
                    marginTop: '0.2rem',
                  }}
                >
                  {pembinaOpdim?.fullName || 'Selvianingsih Salilama, S.Pd.'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)', marginTop: '0.15rem' }}>
                  {pembinaOpdim?.jabatan || 'Pembina OPDIM'}
                </div>
              </button>

              {/* Vertical connector */}
              <div
                aria-hidden="true"
                style={{ width: '2px', height: '24px', background: 'var(--soft-lilac)' }}
              />

              {/* Tier 3: Pengurus Inti OPDIM */}
              <button
                type="button"
                onClick={() => handleSelectTreeNode('inti')}
                aria-pressed={focusedTreeNode === 'inti' || (selectedUnit === 'inti' && !focusedTreeNode)}
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  textAlign: 'left',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  border:
                    selectedUnit === 'inti'
                      ? '2px solid var(--deep-violet)'
                      : '1px solid rgba(46, 26, 71, 0.25)',
                  background:
                    selectedUnit === 'inti'
                      ? 'linear-gradient(135deg, var(--deep-violet), var(--royal-purple))'
                      : 'var(--ghost-purple)',
                  color: selectedUnit === 'inti' ? '#FFFFFF' : 'var(--deep-violet)',
                  cursor: 'pointer',
                  transition: 'all 160ms ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: selectedUnit === 'inti' ? 'var(--gold-soft)' : 'var(--vistara-purple)',
                    }}
                  >
                    Pengurus Inti OPDIM · {countsByUnit.inti} Personel
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    marginTop: '0.2rem',
                  }}
                >
                  {ketuaOpdim ? `Ketua: ${ketuaOpdim.fullName}` : 'Dewan Harian OPDIM'}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    marginTop: '0.2rem',
                    color: selectedUnit === 'inti' ? 'rgba(255,255,255,0.84)' : 'var(--mid-grey)',
                  }}
                >
                  Ketua · Wakil Ketua · Sekretaris · Bendahara · Koordinator Lapangan
                </div>
              </button>

              {/* Branch connector to 5 Komisi */}
              <div
                aria-hidden="true"
                style={{ width: '2px', height: '22px', background: 'var(--soft-lilac)' }}
              />
              <div
                aria-hidden="true"
                className="org-branch-bar"
                style={{
                  width: '82%',
                  height: '2px',
                  background: 'var(--soft-lilac)',
                  marginBottom: '0.9rem',
                }}
              />

              {/* Tier 4: 5 Komisi Cards */}
              <div
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {KOMISI_UNITS.map((unitKey) => {
                  const meta = ANGGOTA_UNIT_META[unitKey];
                  const ketua = members.find(
                    (m) => m.unit === unitKey && m.peranLevel === 'ketua_komisi'
                  );
                  const isActive = selectedUnit === unitKey;
                  return (
                    <button
                      key={unitKey}
                      type="button"
                      onClick={() => handleSelectTreeNode(unitKey)}
                      aria-pressed={isActive}
                      style={{
                        textAlign: 'left',
                        padding: '0.95rem 1rem',
                        borderRadius: '12px',
                        border: isActive
                          ? `2px solid ${meta.accentColor}`
                          : '1px solid var(--pale-lilac)',
                        background: isActive ? `${meta.accentColor}12` : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        minHeight: '108px',
                        transition: 'all 160ms ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-header)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: meta.accentColor,
                          }}
                        >
                          {meta.shortLabel}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--mid-grey)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {countsByUnit[unitKey]} org
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          color: 'var(--deep-violet)',
                          lineHeight: 1.3,
                        }}
                      >
                        {meta.label.replace(`${meta.shortLabel} — `, '')}
                      </div>
                      {ketua && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--mid-grey)',
                            marginTop: 'auto',
                            paddingTop: '0.35rem',
                            borderTop: '1px solid rgba(107,63,160,0.08)',
                          }}
                        >
                          Ketua: <strong style={{ color: 'var(--charcoal)' }}>{ketua.fullName}</strong>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Unit Summary Callout */}
            {activeInspectionUnit && (
              <div
                style={{
                  marginTop: '1.35rem',
                  padding: '1rem 1.15rem',
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
                <div style={{ flex: '1 1 320px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: ANGGOTA_UNIT_META[activeInspectionUnit].accentColor,
                    }}
                  >
                    Fokus Unit Terpilih · {filteredMembers.length} Personel Ditampilkan
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: 'var(--deep-violet)',
                      marginTop: '0.15rem',
                    }}
                  >
                    {ANGGOTA_UNIT_META[activeInspectionUnit].label}
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--charcoal)', margin: '0.25rem 0 0', lineHeight: 1.55 }}>
                    {ANGGOTA_UNIT_META[activeInspectionUnit].description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFilter}
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '40px' }}
                >
                  Lihat Semua Unit
                </button>
              </div>
            )}
          </div>

          {/* ── Filter & Search Bar ── */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--pale-lilac)',
              borderRadius: '16px',
              padding: '1.1rem 1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 260px' }}>
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--mid-grey)',
                  }}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pengurus, jabatan, atau bidang komisi..."
                  aria-label="Cari anggota OPDIM"
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem 0.7rem 2.5rem',
                    borderRadius: '10px',
                    border: '1px solid var(--pale-lilac)',
                    fontSize: '0.9rem',
                    color: 'var(--deep-violet)',
                    background: 'var(--warm-white)',
                    minHeight: '44px',
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--mid-grey)',
                  fontFamily: 'var(--font-header)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Menampilkan {filteredMembers.length} dari {members.length} personel
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={() => {
                  setFocusedTreeNode(null);
                  setSelectedUnit('all');
                }}
                style={{
                  padding: '0.45rem 0.9rem',
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
                    onClick={() => {
                      setFocusedTreeNode(null);
                      setSelectedUnit(unitKey);
                    }}
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

          {/* ── Member Photo Cards Directory ── */}
          {isLoading ? (
            <LoadingState />
          ) : groupedUnits.length === 0 ? (
            <EmptyState
              icon={<Users size={36} />}
              title="Personel tidak ditemukan"
              description="Tidak ada data pengurus yang sesuai dengan filter atau kata kunci pencarian saat ini."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.75rem' }}>
              {groupedUnits.map(({ meta, items }) => (
                <section key={meta.unit} aria-labelledby={`unit-heading-${meta.unit}`}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--pale-lilac)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-header)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
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
                          fontSize: '1.3rem',
                          color: 'var(--deep-violet)',
                          margin: '0.2rem 0 0',
                        }}
                      >
                        {meta.label}
                      </h3>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(235px, 1fr))',
                      gap: '1.25rem',
                    }}
                  >
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
                          borderRadius: '14px',
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
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '4 / 3',
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
                                gap: '0.45rem',
                                padding: '1rem',
                              }}
                            >
                              <div
                                style={{
                                  width: '68px',
                                  height: '68px',
                                  borderRadius: '50%',
                                  background: '#FFFFFF',
                                  border: `1.5px solid ${meta.accentColor}55`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 800,
                                  fontSize: '1.35rem',
                                  color: meta.accentColor,
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {getInitials(member.fullName)}
                              </div>
                              <span
                                style={{
                                  fontFamily: 'var(--font-header)',
                                  fontSize: '0.66rem',
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  color: 'var(--mid-grey)',
                                }}
                              >
                                OPDIM VISTARA
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Text Content */}
                        <div
                          style={{
                            padding: '1rem 1.05rem 1.15rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'var(--font-header)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              letterSpacing: '0.07em',
                              textTransform: 'uppercase',
                              color: meta.accentColor,
                            }}
                          >
                            {meta.shortLabel} · {ANGGOTA_LEVEL_LABELS[member.peranLevel]}
                          </div>

                          <div
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 800,
                              fontSize: '1rem',
                              lineHeight: 1.3,
                              color: 'var(--deep-violet)',
                            }}
                          >
                            {member.fullName}
                          </div>

                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--charcoal)',
                            }}
                          >
                            {member.jabatan}
                          </div>

                          {member.tugasUtama && (
                            <p
                              style={{
                                fontSize: '0.78rem',
                                color: 'var(--mid-grey)',
                                lineHeight: 1.5,
                                margin: '0.25rem 0 0',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
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
              marginTop: '3rem',
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'var(--ghost-purple)',
              border: '1px solid var(--pale-lilac)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: 'var(--deep-violet)',
                }}
              >
                Ingin mengenal program kerja tiap komisi?
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--mid-grey)', margin: '0.25rem 0 0' }}>
                Jelajahi daftar lengkap program kerja harian, mingguan, bulanan, hingga tahunan OPDIM VISTARA.
              </p>
            </div>
            <Link
              to="/beranda/program-kerja"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
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
                maxWidth: '520px',
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
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      border: `2px solid ${ANGGOTA_UNIT_META[selectedMember.unit].accentColor}55`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.9rem',
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
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.92)',
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

              <div style={{ padding: '1.4rem 1.5rem 1.6rem' }}>
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
                    fontSize: '1.35rem',
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
                    gap: '0.9rem',
                    marginTop: '0.65rem',
                    paddingBottom: '0.9rem',
                    borderBottom: '1px solid var(--pale-lilac)',
                    fontSize: '0.84rem',
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

                <div style={{ marginTop: '0.9rem' }}>
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
                  <p style={{ fontSize: '0.9rem', color: 'var(--charcoal)', lineHeight: 1.65, margin: 0 }}>
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
