import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useMotionSystem } from './MotionProvider';

type CursorVariant = 'default' | 'pointer' | 'view' | 'search';

export default function CustomCursor() {
  const { reducedMotion } = useMotionSystem();
  const [pointerMatched, setPointerMatched] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches;
  });
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>('default');
  const [label, setLabel] = useState('');
  const [pressed, setPressed] = useState(false);
  const visibleRef = useRef(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const ringX = useSpring(mouseX, { stiffness: 320, damping: 28, mass: 0.45 });
  const ringY = useSpring(mouseY, { stiffness: 320, damping: 28, mass: 0.45 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine) and (min-width: 1024px)');
    const sync = () => setPointerMatched(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const enabled = pointerMatched && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;

    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorEl = target.closest('[data-cursor]') as HTMLElement | null;
      const interactiveEl = target.closest('a, button, [role="button"], input, select, textarea') as HTMLElement | null;

      if (cursorEl) {
        const mode = cursorEl.getAttribute('data-cursor') as CursorVariant | null;
        const customLabel = cursorEl.getAttribute('data-cursor-label') || '';
        setVariant(mode || 'view');
        setLabel(customLabel);
      } else if (interactiveEl) {
        const tag = interactiveEl.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          setVariant('search');
          setLabel('');
        } else {
          setVariant('pointer');
          setLabel('');
        }
      } else {
        setVariant('default');
        setLabel('');
      }
    };

    const handleLeave = () => {
      visibleRef.current = false;
      setVisible(false);
    };
    const handleDown = () => setPressed(true);
    const handleUp = () => setPressed(false);

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    window.addEventListener('mousedown', handleDown, { passive: true });
    window.addEventListener('mouseup', handleUp, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [enabled, mouseX, mouseY]);

  if (!enabled || !visible) return null;

  const ringSize =
    variant === 'view' && label ? 58 : variant === 'pointer' ? 40 : variant === 'search' ? 24 : 30;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* Outer spring halo */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          width: ringSize,
          height: ringSize,
          borderRadius: '9999px',
          border:
            variant === 'pointer' || variant === 'view'
              ? '1.5px solid rgba(185, 154, 225, 0.85)'
              : '1.5px solid rgba(132, 92, 188, 0.5)',
          background:
            variant === 'view' && label
              ? 'rgba(45, 27, 105, 0.88)'
              : variant === 'pointer'
                ? 'rgba(185, 154, 225, 0.14)'
                : 'transparent',
          backdropFilter: variant === 'view' && label ? 'blur(8px)' : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'var(--font-header)',
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow:
            variant === 'pointer' ? '0 0 18px rgba(155, 114, 204, 0.35)' : 'none',
        }}
        animate={{
          scale: pressed ? 0.82 : 1,
          opacity: variant === 'search' ? 0.3 : 1,
        }}
        transition={{ duration: 0.15 }}
      >
        {variant === 'view' && label ? label : null}
      </motion.div>

      {/* Crisp inner center dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          width: 6,
          height: 6,
          borderRadius: '9999px',
          background: 'var(--gold-soft)',
          boxShadow: '0 0 10px rgba(230, 200, 117, 0.75)',
        }}
        animate={{
          scale: pressed ? 1.5 : variant === 'view' && label ? 0 : 1,
          opacity: variant === 'search' ? 0 : 1,
        }}
        transition={{ duration: 0.12 }}
      />
    </div>
  );
}
