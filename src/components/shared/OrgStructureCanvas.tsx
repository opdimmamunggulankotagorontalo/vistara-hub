import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  ChevronDown,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import { ANGGOTA_UNIT_META } from '../../data/anggotaSeed';
import type { AnggotaOpdim, AnggotaUnit } from '../../types';

export type OrgTreeNodeKey =
  | 'kepala_madrasah'
  | 'pembina'
  | 'inti'
  | 'komisi1'
  | 'komisi2'
  | 'komisi3'
  | 'komisi4'
  | 'komisi5';

interface OrgStructureCanvasProps {
  members: AnggotaOpdim[];
  selectedNode: OrgTreeNodeKey | null;
  onSelectNode: (node: OrgTreeNodeKey) => void;
  onSelectMember?: (member: AnggotaOpdim) => void;
}

const KOMISI_UNITS = ['komisi1', 'komisi2', 'komisi3', 'komisi4', 'komisi5'] as const;
const KOMISI_CENTERS = [77, 244, 410, 576, 743] as const;
const BOARD_WIDTH = 860;
const MIN_SCALE = 0.36;
const MAX_SCALE = 2.2;

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function getTouchDistance(t1: React.Touch, t2: React.Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

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

function getDistributionCenters(count: number, totalWidth = 820): number[] {
  if (count <= 0) return [];
  if (count === 1) return [totalWidth / 2];
  const step = totalWidth / count;
  return Array.from({ length: count }, (_, idx) => Math.round(step * idx + step / 2));
}

interface MemberLeafCardProps {
  member: AnggotaOpdim;
  accentColor: string;
  isLeader?: boolean;
  onClick?: () => void;
}

function MemberLeafCard({ member, accentColor, isLeader = false, onClick }: MemberLeafCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px',
        borderRadius: '11px',
        border: isLeader ? `1.5px solid ${accentColor}` : '1px solid #DFD4F3',
        background: isLeader ? '#FAF6FF' : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 3px 10px rgba(46, 26, 71, 0.04)',
        transition: 'transform 160ms ease, border-color 160ms ease',
      }}
    >
      {member.fotoUrl ? (
        <img
          src={member.fotoUrl}
          alt={member.fullName}
          referrerPolicy="no-referrer"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            objectFit: 'cover',
            objectPosition: 'top',
            flexShrink: 0,
            border: '1px solid #E5DDF5',
          }}
        />
      ) : (
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            background: isLeader ? accentColor : '#F3ECFD',
            color: isLeader ? '#FFFFFF' : 'var(--deep-violet)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getInitials(member.fullName)}
        </div>
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-header)',
            fontSize: '10px',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {member.jabatan}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '12.5px',
            color: 'var(--deep-violet)',
            lineHeight: 1.25,
            marginTop: '1px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {member.fullName}
        </div>
      </div>
    </button>
  );
}

export default function OrgStructureCanvas({
  members,
  selectedNode,
  onSelectNode,
  onSelectMember,
}: OrgStructureCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 12 });
  const [isDragging, setIsDragging] = useState(false);

  const gestureRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
    pinchStartDist: number;
    pinchStartScale: number;
    pinchMidX: number;
    pinchMidY: number;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
    pinchStartDist: 0,
    pinchStartScale: 1,
    pinchMidX: 0,
    pinchMidY: 0,
  });

  const suppressClickUntilRef = useRef(0);

  const computeCenteredReset = (containerWidth: number) => {
    const usableW = Math.max(containerWidth - 24, 260);
    const nextFit = clamp(Number((usableW / BOARD_WIDTH).toFixed(2)), MIN_SCALE, 1);
    const centeredX = Math.round((containerWidth - BOARD_WIDTH * nextFit) / 2);
    return { nextFit, centeredX };
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateFit = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const { nextFit, centeredX } = computeCenteredReset(rect.width);
      setFitScale(nextFit);
      setScale(nextFit);
      setOffset({ x: centeredX, y: 14 });
    };

    updateFit();
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const { nextFit } = computeCenteredReset(rect.width);
      setFitScale(nextFit);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  const intiMembers = useMemo(
    () => members.filter((m) => m.unit === 'inti').sort((a, b) => a.sortOrder - b.sortOrder),
    [members]
  );
  const ketuaOpdim = useMemo(
    () =>
      intiMembers.find(
        (m) =>
          m.jabatan.toLowerCase().includes('ketua') &&
          !m.jabatan.toLowerCase().includes('wakil')
      ) || intiMembers[0],
    [intiMembers]
  );

  const selectedKomisiIndex = useMemo(() => {
    if (!selectedNode) return -1;
    return KOMISI_UNITS.indexOf(selectedNode as (typeof KOMISI_UNITS)[number]);
  }, [selectedNode]);

  const expandedKomisiData = useMemo(() => {
    if (selectedKomisiIndex < 0) return null;
    const unitKey = KOMISI_UNITS[selectedKomisiIndex];
    const meta = ANGGOTA_UNIT_META[unitKey];
    const unitMembers = members
      .filter((m) => m.unit === unitKey)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const leader =
      unitMembers.find((m) => m.peranLevel === 'ketua_komisi') || unitMembers[0] || null;
    const restMembers = leader
      ? unitMembers.filter((m) => m.id !== leader.id)
      : unitMembers;
    return {
      unitKey,
      meta,
      sourceX: KOMISI_CENTERS[selectedKomisiIndex],
      leader,
      restMembers,
      total: unitMembers.length,
    };
  }, [members, selectedKomisiIndex]);

  const handleReset = () => {
    const el = viewportRef.current;
    if (!el) {
      setScale(fitScale);
      setOffset({ x: 0, y: 14 });
      return;
    }
    const { nextFit, centeredX } = computeCenteredReset(el.getBoundingClientRect().width);
    setFitScale(nextFit);
    setScale(nextFit);
    setOffset({ x: centeredX, y: 14 });
  };

  const handleZoomStep = (delta: number) => {
    const el = viewportRef.current;
    const nextScale = clamp(Number((scale + delta).toFixed(2)), MIN_SCALE, MAX_SCALE);
    if (!el) {
      setScale(nextScale);
      return;
    }
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const ratio = nextScale / scale;
    setOffset((prev) => ({
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio,
    }));
    setScale(nextScale);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    gestureRef.current = {
      ...gestureRef.current,
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (g.mode !== 'pan') return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.hypot(dx, dy) > 6) {
      g.moved = true;
    }
    setOffset({
      x: g.origX + dx,
      y: g.origY + dy,
    });
  };

  const handleMouseUp = () => {
    if (gestureRef.current.mode === 'pan' && gestureRef.current.moved) {
      suppressClickUntilRef.current = Date.now() + 180;
    }
    gestureRef.current.mode = 'none';
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      gestureRef.current = {
        ...gestureRef.current,
        mode: 'pan',
        startX: t.clientX,
        startY: t.clientY,
        origX: offset.x,
        origY: offset.y,
        moved: false,
      };
      setIsDragging(true);
    } else if (e.touches.length >= 2) {
      const rect = el.getBoundingClientRect();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = getTouchDistance(t1, t2);
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
      gestureRef.current = {
        ...gestureRef.current,
        mode: 'pinch',
        origX: offset.x,
        origY: offset.y,
        moved: true,
        pinchStartDist: dist || 1,
        pinchStartScale: scale,
        pinchMidX: midX,
        pinchMidY: midY,
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (g.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - g.startX;
      const dy = t.clientY - g.startY;
      if (Math.hypot(dx, dy) > 8) {
        g.moved = true;
      }
      setOffset({
        x: g.origX + dx,
        y: g.origY + dy,
      });
    } else if (e.touches.length >= 2) {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = getTouchDistance(t1, t2);
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
      const startScale = g.pinchStartScale || scale;
      const nextScale = clamp(
        Number((startScale * (dist / (g.pinchStartDist || dist || 1))).toFixed(3)),
        MIN_SCALE,
        MAX_SCALE
      );
      const ratio = nextScale / startScale;
      setScale(nextScale);
      setOffset({
        x: midX - (g.pinchMidX - g.origX) * ratio,
        y: midY - (g.pinchMidY - g.origY) * ratio,
      });
      g.moved = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gestureRef.current.moved) {
      suppressClickUntilRef.current = Date.now() + 200;
    }
    if (e.touches.length === 0) {
      gestureRef.current.mode = 'none';
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      gestureRef.current = {
        ...gestureRef.current,
        mode: 'pan',
        startX: t.clientX,
        startY: t.clientY,
        origX: offset.x,
        origY: offset.y,
        moved: true,
      };
    }
  };

  const handleNodeClick = (node: OrgTreeNodeKey) => {
    if (Date.now() < suppressClickUntilRef.current) return;
    onSelectNode(node);
  };

  const handleMemberCardClick = (member: AnggotaOpdim) => {
    if (Date.now() < suppressClickUntilRef.current) return;
    onSelectMember?.(member);
  };

  const zoomPercent = Math.round(scale * 100);
  const intiCenters = getDistributionCenters(Math.min(intiMembers.length, 5), 820);
  const komisiBranchRowItems = expandedKomisiData?.restMembers.slice(0, 5) || [];
  const komisiExtraItems = expandedKomisiData?.restMembers.slice(5) || [];
  const komisiBranchCenters = getDistributionCenters(komisiBranchRowItems.length, 820);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {/* Top Toolbar: Zoom Controls & Gesture Hint */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.78rem',
            color: 'var(--mid-grey)',
            fontFamily: 'var(--font-header)',
          }}
        >
          <Hand size={14} style={{ color: 'var(--vistara-purple)', flexShrink: 0 }} />
          <span>Cubit 2 jari untuk zoom · Geser kanvas · Ketuk unit untuk menjalar akar anggota</span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#FAF8FF',
            border: '1px solid #E5DDF5',
            borderRadius: '10px',
            padding: '0.2rem',
          }}
        >
          <button
            type="button"
            aria-label="Perkecil bagan struktur"
            onClick={() => handleZoomStep(-0.18)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              color: 'var(--deep-violet)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ZoomOut size={16} />
          </button>
          <span
            className="tabular-nums"
            style={{
              minWidth: '46px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--deep-violet)',
            }}
          >
            {zoomPercent}%
          </span>
          <button
            type="button"
            aria-label="Perbesar bagan struktur"
            onClick={() => handleZoomStep(0.18)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              color: 'var(--deep-violet)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            aria-label="Reset ukuran bagan"
            onClick={handleReset}
            style={{
              height: '36px',
              padding: '0 0.65rem',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              color: 'var(--vistara-purple)',
              fontFamily: 'var(--font-header)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Bounded Pinch-to-Zoom & Pan Viewport */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        role="region"
        aria-label="Kanvas bagan struktur organisasi OPDIM interaktif"
        style={{
          position: 'relative',
          width: '100%',
          height:
            selectedNode === 'kepala_madrasah' || selectedNode === 'pembina'
              ? 'clamp(390px, 62vw, 600px)'
              : selectedNode
                ? 'clamp(420px, 76vw, 780px)'
                : 'clamp(350px, 56vw, 500px)',
          overflow: 'hidden',
          borderRadius: '14px',
          border: '1px solid #E5DDF5',
          backgroundColor: '#FCF9FF',
          backgroundImage: 'radial-gradient(rgba(107, 63, 160, 0.14) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          touchAction: 'none',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Scaled & Panned Diagram Layer */}
        <div
          ref={boardRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${BOARD_WIDTH}px`,
            transformOrigin: '0 0',
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            padding: '18px 20px 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Tier 1: Kepala Madrasah */}
          <button
            type="button"
            onClick={() => handleNodeClick('kepala_madrasah')}
            aria-pressed={selectedNode === 'kepala_madrasah'}
            style={{
              width: '360px',
              textAlign: 'left',
              padding: '13px 16px',
              borderRadius: '14px',
              border:
                selectedNode === 'kepala_madrasah'
                  ? '2px solid #C9A84C'
                  : '1.5px solid rgba(201, 168, 76, 0.55)',
              background:
                selectedNode === 'kepala_madrasah'
                  ? '#FFF6DE'
                  : '#FFFDF7',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(46, 26, 71, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: '#8A6812',
                }}
              >
                Penanggung Jawab Tertinggi · Pimpinan
              </span>
              {selectedNode === 'kepala_madrasah' ? (
                <ChevronDown size={14} style={{ color: '#8A6812' }} />
              ) : (
                <ChevronRight size={14} style={{ color: '#B29237' }} />
              )}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '16px',
                color: 'var(--deep-violet)',
                marginTop: '3px',
              }}
            >
              {kepalaMadrasah?.fullName || 'Hj. Sitti Khasriani, S.S., M.Pd.'}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--charcoal)', marginTop: '2px' }}>
              {kepalaMadrasah?.jabatan || 'Kepala Madrasah'}
            </div>
          </button>

          {/* Expanded Root Detail for Kepala Madrasah */}
          {selectedNode === 'kepala_madrasah' && kepalaMadrasah && (
            <div style={{ width: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div aria-hidden="true" style={{ width: '2px', height: '16px', background: '#C9A84C' }} />
              <div style={{ width: '100%' }}>
                <MemberLeafCard
                  member={kepalaMadrasah}
                  accentColor="#9A7214"
                  isLeader
                  onClick={onSelectMember ? () => handleMemberCardClick(kepalaMadrasah) : undefined}
                />
              </div>
            </div>
          )}

          {/* Vertical Line */}
          <div aria-hidden="true" style={{ width: '2px', height: '22px', background: '#CBB8EB' }} />

          {/* Tier 2: Pembina OPDIM */}
          <button
            type="button"
            onClick={() => handleNodeClick('pembina')}
            aria-pressed={selectedNode === 'pembina'}
            style={{
              width: '360px',
              textAlign: 'left',
              padding: '13px 16px',
              borderRadius: '14px',
              border:
                selectedNode === 'pembina'
                  ? '2px solid var(--royal-purple)'
                  : '1.5px solid #D4BFEF',
              background: selectedNode === 'pembina' ? '#F3ECFD' : '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(46, 26, 71, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: 'var(--royal-purple)',
                }}
              >
                Pembimbing Teknis &amp; Pengarah
              </span>
              {selectedNode === 'pembina' ? (
                <ChevronDown size={14} style={{ color: 'var(--royal-purple)' }} />
              ) : (
                <ChevronRight size={14} style={{ color: 'var(--vistara-purple)' }} />
              )}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '15.5px',
                color: 'var(--deep-violet)',
                marginTop: '3px',
              }}
            >
              {pembinaOpdim?.fullName || 'Selvianingsih Salilama, S.Pd.'}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--charcoal)', marginTop: '2px' }}>
              {pembinaOpdim?.jabatan || 'Pembina OPDIM'}
            </div>
          </button>

          {/* Expanded Root Detail for Pembina */}
          {selectedNode === 'pembina' && pembinaOpdim && (
            <div style={{ width: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div aria-hidden="true" style={{ width: '2px', height: '16px', background: '#7C4DFF' }} />
              <div style={{ width: '100%' }}>
                <MemberLeafCard
                  member={pembinaOpdim}
                  accentColor="#6B3FA0"
                  isLeader
                  onClick={onSelectMember ? () => handleMemberCardClick(pembinaOpdim) : undefined}
                />
              </div>
            </div>
          )}

          {/* Vertical Line */}
          <div aria-hidden="true" style={{ width: '2px', height: '22px', background: '#CBB8EB' }} />

          {/* Tier 3: Pengurus Inti OPDIM */}
          <button
            type="button"
            onClick={() => handleNodeClick('inti')}
            aria-pressed={selectedNode === 'inti'}
            style={{
              width: '450px',
              textAlign: 'left',
              padding: '14px 18px',
              borderRadius: '14px',
              border:
                selectedNode === 'inti'
                  ? '2px solid var(--deep-violet)'
                  : '1.5px solid rgba(46, 26, 71, 0.35)',
              background:
                selectedNode === 'inti'
                  ? 'linear-gradient(135deg, var(--deep-violet), var(--royal-purple))'
                  : '#FFFFFF',
              color: selectedNode === 'inti' ? '#FFFFFF' : 'var(--deep-violet)',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(46, 26, 71, 0.07)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: selectedNode === 'inti' ? 'var(--gold-soft)' : 'var(--vistara-purple)',
                }}
              >
                Pengurus Inti OPDIM · {countsByUnit.inti} Personel
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: selectedNode === 'inti' ? 'var(--gold-soft)' : 'var(--vistara-purple)',
                }}
              >
                <GitBranch size={12} />
                {selectedNode === 'inti' ? 'Tutup Akar' : 'Lihat Akar'}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '16px',
                marginTop: '3px',
              }}
            >
              {ketuaOpdim ? `Ketua: ${ketuaOpdim.fullName}` : 'Dewan Harian OPDIM'}
            </div>
            <div
              style={{
                fontSize: '12px',
                marginTop: '3px',
                color: selectedNode === 'inti' ? 'rgba(255,255,255,0.86)' : 'var(--mid-grey)',
              }}
            >
              Ketua · Wakil Ketua · Sekretaris · Bendahara · Koordinator Lapangan
            </div>
          </button>

          {/* Branching Root Tree for Pengurus Inti when selected */}
          {selectedNode === 'inti' && intiMembers.length > 0 && (
            <div
              data-testid="expanded-root-inti"
              style={{ width: '820px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <svg
                width="820"
                height="28"
                viewBox="0 0 820 28"
                aria-hidden="true"
                style={{ display: 'block', overflow: 'visible' }}
              >
                <line x1="410" y1="0" x2="410" y2="14" stroke="#7C4DFF" strokeWidth="2.2" />
                {intiCenters.length > 1 && (
                  <line
                    x1={intiCenters[0]}
                    y1="14"
                    x2={intiCenters[intiCenters.length - 1]}
                    y2="14"
                    stroke="#7C4DFF"
                    strokeWidth="2.2"
                  />
                )}
                {intiCenters.map((cx) => (
                  <line
                    key={cx}
                    x1={cx}
                    y1="14"
                    x2={cx}
                    y2="28"
                    stroke="#7C4DFF"
                    strokeWidth="2.2"
                  />
                ))}
              </svg>

              <div
                style={{
                  width: '820px',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(intiMembers.length, 5)}, minmax(0, 1fr))`,
                  gap: '10px',
                }}
              >
                {intiMembers.map((member, idx) => (
                  <MemberLeafCard
                    key={member.id}
                    member={member}
                    accentColor="#6B3FA0"
                    isLeader={idx === 0}
                    onClick={onSelectMember ? () => handleMemberCardClick(member) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SVG Connector Tree to 5 Komisi */}
          <svg
            width="820"
            height="34"
            viewBox="0 0 820 34"
            aria-hidden="true"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <line x1="410" y1="0" x2="410" y2="16" stroke="#CBB8EB" strokeWidth="2" />
            <line x1="77" y1="16" x2="743" y2="16" stroke="#CBB8EB" strokeWidth="2" />
            {KOMISI_CENTERS.map((cx, i) => {
              const isHighlighted = selectedKomisiIndex === i;
              return (
                <line
                  key={cx}
                  x1={cx}
                  y1="16"
                  x2={cx}
                  y2="34"
                  stroke={isHighlighted ? '#7C4DFF' : '#CBB8EB'}
                  strokeWidth={isHighlighted ? '2.5' : '2'}
                />
              );
            })}
          </svg>

          {/* Tier 4: 5 Komisi Cards */}
          <div
            style={{
              width: '820px',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: '12px',
            }}
          >
            {KOMISI_UNITS.map((unitKey) => {
              const meta = ANGGOTA_UNIT_META[unitKey];
              const ketua = members.find(
                (m) => m.unit === unitKey && m.peranLevel === 'ketua_komisi'
              );
              const isActive = selectedNode === unitKey;
              return (
                <button
                  key={unitKey}
                  type="button"
                  onClick={() => handleNodeClick(unitKey)}
                  aria-pressed={isActive}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    borderRadius: '12px',
                    border: isActive
                      ? `2px solid ${meta.accentColor}`
                      : '1px solid #DFD4F3',
                    background: isActive ? '#F4EDFF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minHeight: '122px',
                    boxShadow: isActive
                      ? '0 6px 16px rgba(107, 63, 160, 0.14)'
                      : '0 4px 12px rgba(46, 26, 71, 0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-header)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: meta.accentColor,
                      }}
                    >
                      {meta.shortLabel}
                    </span>
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--mid-grey)',
                      }}
                    >
                      {countsByUnit[unitKey]} org
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '13px',
                      color: 'var(--deep-violet)',
                      lineHeight: 1.3,
                    }}
                  >
                    {meta.label.replace(`${meta.shortLabel} — `, '')}
                  </div>
                  {ketua && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--mid-grey)',
                        marginTop: 'auto',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(107,63,160,0.1)',
                        lineHeight: 1.35,
                      }}
                    >
                      Ketua:{' '}
                      <strong style={{ color: 'var(--charcoal)' }}>{ketua.fullName}</strong>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-header)',
                      color: meta.accentColor,
                      marginTop: '2px',
                    }}
                  >
                    <GitBranch size={11} />
                    <span>{isActive ? 'Akar Terbuka' : 'Ketuk Buka Akar'}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tier 5: Branching Root Tree for Selected Komisi */}
          {expandedKomisiData && (
            <div
              data-testid={`expanded-root-${expandedKomisiData.unitKey}`}
              style={{
                width: '820px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Stem from clicked Komisi box horizontally to center */}
              <svg
                width="820"
                height="40"
                viewBox="0 0 820 40"
                aria-hidden="true"
                style={{ display: 'block', overflow: 'visible' }}
              >
                <line
                  x1={expandedKomisiData.sourceX}
                  y1="0"
                  x2={expandedKomisiData.sourceX}
                  y2="20"
                  stroke={expandedKomisiData.meta.accentColor}
                  strokeWidth="2.4"
                />
                {expandedKomisiData.sourceX !== 410 && (
                  <line
                    x1={expandedKomisiData.sourceX}
                    y1="20"
                    x2="410"
                    y2="20"
                    stroke={expandedKomisiData.meta.accentColor}
                    strokeWidth="2.4"
                  />
                )}
                <line
                  x1="410"
                  y1="20"
                  x2="410"
                  y2="40"
                  stroke={expandedKomisiData.meta.accentColor}
                  strokeWidth="2.4"
                />
              </svg>

              {/* Komisi Root Header Pill Label */}
              <div
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: expandedKomisiData.meta.accentColor,
                  marginBottom: '8px',
                }}
              >
                Akar Struktur {expandedKomisiData.meta.shortLabel} · {expandedKomisiData.total} Personel
              </div>

              {/* Leader Root Card */}
              {expandedKomisiData.leader && (
                <div style={{ width: '270px' }}>
                  <MemberLeafCard
                    member={expandedKomisiData.leader}
                    accentColor={expandedKomisiData.meta.accentColor}
                    isLeader
                    onClick={
                      onSelectMember
                        ? () => handleMemberCardClick(expandedKomisiData.leader!)
                        : undefined
                    }
                  />
                </div>
              )}

              {/* Branching SVG Root Lines to Anggota Komisi */}
              {komisiBranchRowItems.length > 0 && (
                <>
                  <svg
                    width="820"
                    height="30"
                    viewBox="0 0 820 30"
                    aria-hidden="true"
                    style={{ display: 'block', overflow: 'visible' }}
                  >
                    <line
                      x1="410"
                      y1="0"
                      x2="410"
                      y2="15"
                      stroke={expandedKomisiData.meta.accentColor}
                      strokeWidth="2.2"
                    />
                    {komisiBranchCenters.length > 1 && (
                      <line
                        x1={komisiBranchCenters[0]}
                        y1="15"
                        x2={komisiBranchCenters[komisiBranchCenters.length - 1]}
                        y2="15"
                        stroke={expandedKomisiData.meta.accentColor}
                        strokeWidth="2.2"
                      />
                    )}
                    {komisiBranchCenters.map((cx) => (
                      <line
                        key={cx}
                        x1={cx}
                        y1="15"
                        x2={cx}
                        y2="30"
                        stroke={expandedKomisiData.meta.accentColor}
                        strokeWidth="2.2"
                      />
                    ))}
                  </svg>

                  <div
                    style={{
                      width: '820px',
                      display: 'grid',
                      gridTemplateColumns: `repeat(${komisiBranchRowItems.length}, minmax(0, 1fr))`,
                      gap: '10px',
                    }}
                  >
                    {komisiBranchRowItems.map((member) => (
                      <MemberLeafCard
                        key={member.id}
                        member={member}
                        accentColor={expandedKomisiData.meta.accentColor}
                        onClick={
                          onSelectMember ? () => handleMemberCardClick(member) : undefined
                        }
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Overflow row if >5 members in a commission */}
              {komisiExtraItems.length > 0 && (
                <div
                  style={{
                    width: '820px',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(komisiExtraItems.length, 5)}, minmax(0, 1fr))`,
                    gap: '10px',
                    marginTop: '10px',
                  }}
                >
                  {komisiExtraItems.map((member) => (
                    <MemberLeafCard
                      key={member.id}
                      member={member}
                      accentColor={expandedKomisiData.meta.accentColor}
                      onClick={
                        onSelectMember ? () => handleMemberCardClick(member) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
