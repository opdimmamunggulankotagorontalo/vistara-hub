import { useEffect, useMemo, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Hand } from 'lucide-react';
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
}

const KOMISI_UNITS = ['komisi1', 'komisi2', 'komisi3', 'komisi4', 'komisi5'] as const;
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

export default function OrgStructureCanvas({
  members,
  selectedNode,
  onSelectNode,
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
  const ketuaOpdim = useMemo(
    () =>
      members.find(
        (m) =>
          m.unit === 'inti' &&
          m.jabatan.toLowerCase().includes('ketua') &&
          !m.jabatan.toLowerCase().includes('wakil')
      ),
    [members]
  );

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

  // Mouse pan handlers (touch uses onTouch* for reliable 2-finger pinch + 1-finger pan)
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

  // Touch handlers supporting both 1-finger pan & 2-finger pinch-to-zoom
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

  const zoomPercent = Math.round(scale * 100);

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
          <span>Cubit 2 jari untuk zoom · Geser bagan · Ketuk kotak untuk filter unit</span>
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
          height: 'clamp(340px, 54vw, 490px)',
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
            padding: '18px 20px 26px',
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
              width: '340px',
              textAlign: 'left',
              padding: '14px 18px',
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
                fontFamily: 'var(--font-header)',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.09em',
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

          {/* Vertical Line */}
          <div aria-hidden="true" style={{ width: '2px', height: '24px', background: '#CBB8EB' }} />

          {/* Tier 2: Pembina OPDIM */}
          <button
            type="button"
            onClick={() => handleNodeClick('pembina')}
            aria-pressed={selectedNode === 'pembina'}
            style={{
              width: '340px',
              textAlign: 'left',
              padding: '13px 18px',
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
                fontFamily: 'var(--font-header)',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.09em',
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

          {/* Vertical Line */}
          <div aria-hidden="true" style={{ width: '2px', height: '24px', background: '#CBB8EB' }} />

          {/* Tier 3: Pengurus Inti OPDIM */}
          <button
            type="button"
            onClick={() => handleNodeClick('inti')}
            aria-pressed={selectedNode === 'inti'}
            style={{
              width: '440px',
              textAlign: 'left',
              padding: '15px 18px',
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
                fontFamily: 'var(--font-header)',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: selectedNode === 'inti' ? 'var(--gold-soft)' : 'var(--vistara-purple)',
              }}
            >
              Pengurus Inti OPDIM · {countsByUnit.inti} Personel
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

          {/* SVG Connector Tree to 5 Komisi */}
          <svg
            width="820"
            height="34"
            viewBox="0 0 820 34"
            aria-hidden="true"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <line x1="410" y1="0" x2="410" y2="16" stroke="#CBB8EB" strokeWidth="2" />
            <line x1="82" y1="16" x2="738" y2="16" stroke="#CBB8EB" strokeWidth="2" />
            <line x1="82" y1="16" x2="82" y2="34" stroke="#CBB8EB" strokeWidth="2" />
            <line x1="246" y1="16" x2="246" y2="34" stroke="#CBB8EB" strokeWidth="2" />
            <line x1="410" y1="16" x2="410" y2="34" stroke="#CBB8EB" strokeWidth="2" />
            <line x1="574" y1="16" x2="574" y2="34" stroke="#CBB8EB" strokeWidth="2" />
            <line x1="738" y1="16" x2="738" y2="34" stroke="#CBB8EB" strokeWidth="2" />
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
                    background: isActive ? '#F5F0FC' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minHeight: '120px',
                    boxShadow: '0 4px 12px rgba(46, 26, 71, 0.04)',
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
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
