import { useEffect, useRef } from 'react';
import { useMotionSystem } from './MotionProvider';

interface CrystalCanvasProps {
  particleCount?: number;
  crystalCount?: number;
  className?: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Crystal {
  x: number;
  y: number;
  z: number;
  size: number;
  rotX: number;
  rotY: number;
  rotSpeedX: number;
  rotSpeedY: number;
  driftY: number;
  phase: number;
  tint: string;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
  gold: boolean;
}

const OCTA_VERTICES: Point3D[] = [
  { x: 0, y: -1.35, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 0, z: -1 },
  { x: 0, y: 1.35, z: 0 },
];

const OCTA_EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [5, 1], [5, 2], [5, 3], [5, 4],
  [1, 2], [2, 3], [3, 4], [4, 1],
];

export default function CrystalCanvas({
  particleCount = 34,
  crystalCount = 5,
  className,
}: CrystalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { reducedMotion } = useMotionSystem();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isCompactMobile =
      window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
    const effectiveParticles = isCompactMobile ? Math.min(particleCount, 12) : particleCount;
    const effectiveCrystals = isCompactMobile ? Math.min(crystalCount, 3) : crystalCount;

    let rafId = 0;
    let isVisible = true;
    let isTabActive = !document.hidden;
    let width = 0;
    let height = 0;
    let pointerX = 0;
    let pointerY = 0;
    let smoothPX = 0;
    let smoothPY = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = isCompactMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const stars: Star[] = Array.from({ length: effectiveParticles }, (_, i) => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 640),
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.2,
      r: 1 + Math.random() * 1.8,
      alpha: 0.22 + Math.random() * 0.45,
      phase: i * 0.7,
      gold: i % 5 === 0,
    }));

    const crystals: Crystal[] = Array.from({ length: effectiveCrystals }, (_, i) => ({
      x: 0.14 + (i / Math.max(1, effectiveCrystals - 1)) * 0.74,
      y: 0.18 + ((i * 37) % 60) / 100,
      z: 180 + (i % 3) * 80,
      size: (isCompactMobile ? 18 : 22) + (i % 3) * 8,
      rotX: i * 0.6,
      rotY: i * 0.9,
      rotSpeedX: 0.003 + (i % 2) * 0.002,
      rotSpeedY: 0.005 + (i % 3) * 0.002,
      driftY: 8 + (i % 3) * 5,
      phase: i * 1.3,
      tint: i % 2 === 0 ? 'rgba(185, 154, 225, 0.34)' : 'rgba(230, 200, 117, 0.28)',
    }));

    const projectVertex = (v: Point3D, rx: number, ry: number, size: number) => {
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = v.x * cosY - v.z * sinY;
      const z1 = v.z * cosY + v.x * sinY;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = v.y * cosX - z1 * sinX;
      const z2 = z1 * cosX + v.y * sinX;

      const scale = 280 / (280 + z2 * size * 0.35);
      return {
        px: x1 * size * scale,
        py: y2 * size * scale,
      };
    };

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      smoothPX += (pointerX - smoothPX) * 0.06;
      smoothPY += (pointerY - smoothPY) * 0.06;

      // Starlight particles + subtle proximity lines (desktop only)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!reducedMotion) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < 0) s.x = width;
          if (s.x > width) s.x = 0;
          if (s.y < 0) s.y = height;
          if (s.y > height) s.y = 0;
        }

        const px = s.x + smoothPX * (10 + s.r * 5);
        const py = s.y + smoothPY * (8 + s.r * 4);
        const twinkle = 0.65 + 0.35 * Math.sin(time * 0.002 + s.phase);

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? `rgba(230, 200, 117, ${s.alpha * twinkle})`
          : `rgba(212, 191, 239, ${s.alpha * twinkle})`;
        ctx.fill();

        if (!isCompactMobile) {
          for (let j = i + 1; j < stars.length; j++) {
            const s2 = stars[j];
            const dx = s.x - s2.x;
            const dy = s.y - s2.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 11000) {
              const lineAlpha = (1 - distSq / 11000) * 0.1;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(s2.x + smoothPX * (10 + s2.r * 5), s2.y + smoothPY * (8 + s2.r * 4));
              ctx.strokeStyle = `rgba(185, 154, 225, ${lineAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }

      // 3D wireframe octahedron crystals
      for (const c of crystals) {
        if (!reducedMotion) {
          c.rotX += c.rotSpeedX;
          c.rotY += c.rotSpeedY;
        }
        const cx = c.x * width + smoothPX * (c.size * 0.65);
        const cy =
          c.y * height +
          Math.sin(time * 0.0012 + c.phase) * c.driftY +
          smoothPY * (c.size * 0.5);

        const projected = OCTA_VERTICES.map((v) =>
          projectVertex(v, c.rotX + smoothPY * 0.25, c.rotY + smoothPX * 0.3, c.size)
        );

        ctx.strokeStyle = c.tint;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const [a, b] of OCTA_EDGES) {
          ctx.moveTo(cx + projected[a].px, cy + projected[a].py);
          ctx.lineTo(cx + projected[b].px, cy + projected[b].py);
        }
        ctx.stroke();

        // Subtle inner facet glow
        ctx.fillStyle = 'rgba(185, 154, 225, 0.04)';
        ctx.beginPath();
        ctx.moveTo(cx + projected[0].px, cy + projected[0].py);
        ctx.lineTo(cx + projected[1].px, cy + projected[1].py);
        ctx.lineTo(cx + projected[2].px, cy + projected[2].py);
        ctx.closePath();
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      if (isVisible && isTabActive) {
        drawFrame(time);
      }
      if (!reducedMotion) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isCompactMobile) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
    };

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (reducedMotion) {
      drawFrame(0);
    } else {
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [particleCount, crystalCount, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
