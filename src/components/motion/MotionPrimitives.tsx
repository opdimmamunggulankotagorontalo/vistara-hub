import { useEffect, useRef, useState } from 'react';
import type { ReactNode, CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  animate,
} from 'motion/react';
import { useMotionSystem } from './MotionProvider';

const EXPO_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── SplitText: Word-by-word masked / blur-to-focus reveal ─────────────────

interface SplitTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  delay?: number;
  stagger?: number;
  immediate?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SplitText({
  text,
  as = 'div',
  delay = 0,
  stagger = 0.045,
  immediate = false,
  className,
  style,
}: SplitTextProps) {
  const { reducedMotion } = useMotionSystem();
  const words = text.split(' ');
  const Tag = motion[as];

  if (reducedMotion) {
    const PlainTag = as;
    return (
      <PlainTag className={className} style={style}>
        {text}
      </PlainTag>
    );
  }

  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      animate={immediate ? 'visible' : undefined}
      whileInView={immediate ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
    >
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}
        >
          <motion.span
            style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
            variants={{
              hidden: { y: '105%', opacity: 0, filter: 'blur(4px)' },
              visible: {
                y: '0%',
                opacity: 1,
                filter: 'blur(0px)',
                transition: { duration: 0.55, ease: EXPO_EASE },
              },
            }}
          >
            {word}
          </motion.span>
          {idx < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Tag>
  );
}

// ─── AnimatedCounter: Smooth rolling numeric count-up ──────────────────────

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  style?: CSSProperties;
  className?: string;
}

export function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 1.3,
  style,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const { reducedMotion } = useMotionSystem();
  const [display, setDisplay] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (reducedMotion || !inView) return;

    const controls = animate(0, target, {
      duration,
      ease: EXPO_EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, target, duration, reducedMotion]);

  const shown = reducedMotion ? target : display;

  return (
    <span ref={ref} className={`tabular-nums ${className || ''}`} style={style}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

// ─── ScrollReveal: Varied entrance choreography presets ────────────────────

type RevealPreset = 'fadeUp' | 'blurIn' | 'scaleIn' | 'slideLeft' | 'slideRight' | 'clipUp';

interface ScrollRevealProps {
  children: ReactNode;
  preset?: RevealPreset;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

const presetMap: Record<
  RevealPreset,
  {
    initial: { opacity: number; y?: number; x?: number; scale?: number; filter?: string; clipPath?: string };
    visible: { opacity: number; y?: number; x?: number; scale?: number; filter?: string; clipPath?: string };
  }
> = {
  fadeUp: {
    initial: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  blurIn: {
    initial: { opacity: 0, y: 16, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.93 },
    visible: { opacity: 1, scale: 1 },
  },
  slideLeft: {
    initial: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    initial: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
  clipUp: {
    initial: { opacity: 0, y: 20, clipPath: 'inset(0 0 18% 0)' },
    visible: { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' },
  },
};

export function ScrollReveal({
  children,
  preset = 'fadeUp',
  delay = 0,
  duration = 0.55,
  className,
  style,
}: ScrollRevealProps) {
  const { reducedMotion } = useMotionSystem();

  if (reducedMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const config = presetMap[preset];

  return (
    <motion.div
      className={className}
      style={style}
      initial={config.initial}
      whileInView={config.visible}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration, delay, ease: EXPO_EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── TiltSpotlightCard: 3D perspective tilt + mouse spotlight glow ──────────

interface TiltSpotlightCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  dark?: boolean;
  maxTilt?: number;
  spotlightColor?: string;
  onClick?: () => void;
  cursorLabel?: string;
}

export function TiltSpotlightCard({
  children,
  className = '',
  style,
  dark = false,
  maxTilt = 6,
  spotlightColor,
  onClick,
  cursorLabel,
}: TiltSpotlightCardProps) {
  const { reducedMotion } = useMotionSystem();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const rotateX = useSpring(0, { stiffness: 260, damping: 24 });
  const rotateY = useSpring(0, { stiffness: 260, damping: 24 });
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);
  const spotOpacity = useSpring(0, { stiffness: 240, damping: 26 });

  const resolvedSpotlight =
    spotlightColor ||
    (dark ? 'rgba(185, 154, 225, 0.22)' : 'rgba(107, 63, 160, 0.10)');

  const spotlightBg = useMotionTemplate`radial-gradient(360px circle at ${spotX}% ${spotY}%, ${resolvedSpotlight}, transparent 70%)`;

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    spotX.set(relX * 100);
    spotY.set(relY * 100);
    spotOpacity.set(1);

    rotateX.set((0.5 - relY) * 2 * maxTilt);
    rotateY.set((relX - 0.5) * 2 * maxTilt);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    spotOpacity.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-cursor={cursorLabel ? 'view' : undefined}
      data-cursor-label={cursorLabel}
      className={`${dark ? 'card-dark' : 'card'} ${className}`.trim()}
      style={{
        position: 'relative',
        transformPerspective: 900,
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
        transformStyle: 'preserve-3d',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      whileTap={onClick && !reducedMotion ? { scale: 0.985 } : undefined}
    >
      {/* Dynamic spotlight layer */}
      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: spotlightBg,
            opacity: spotOpacity,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </motion.div>
  );
}

// ─── MagneticWrapper: Subtle cursor pull for CTAs & key buttons ────────────

interface MagneticWrapperProps {
  children: ReactNode;
  strength?: number;
  style?: CSSProperties;
  className?: string;
}

export function MagneticWrapper({
  children,
  strength = 0.24,
  style,
  className,
}: MagneticWrapperProps) {
  const { reducedMotion } = useMotionSystem();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useSpring(0, { stiffness: 280, damping: 22 });
  const y = useSpring(0, { stiffness: 280, damping: 22 });

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-block',
        x: reducedMotion ? 0 : x,
        y: reducedMotion ? 0 : y,
        ...style,
      }}
      whileTap={reducedMotion ? undefined : { scale: 0.96 }}
    >
      {children}
    </motion.div>
  );
}

// ─── InfiniteMarquee: Seamless horizontal ticker ───────────────────────────

interface InfiniteMarqueeProps {
  items: string[];
  accentColor?: string;
}

export function InfiniteMarquee({ items }: InfiniteMarqueeProps) {
  const duplicated = [...items, ...items];

  return (
    <div
      className="marquee-wrapper"
      aria-label="Sorotan identitas VISTARA"
      style={{
        overflow: 'hidden',
        borderTop: '1px solid rgba(185, 154, 225, 0.14)',
        borderBottom: '1px solid rgba(185, 154, 225, 0.14)',
        background: 'rgba(20, 11, 42, 0.88)',
        padding: '0.85rem 0',
      }}
    >
      <div className="marquee-track">
        {duplicated.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1.25rem',
              paddingRight: '1.25rem',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-header)',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: idx % 2 === 0 ? 'rgba(237, 230, 248, 0.88)' : 'var(--gold-soft)',
            }}
          >
            <span>{item}</span>
            <span
              aria-hidden="true"
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '1px',
                transform: 'rotate(45deg)',
                background: 'var(--soft-lilac)',
                opacity: 0.6,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PageTransition: Route-level entrance transition ───────────────────────

export function PageTransition({
  children,
  routeKey,
}: {
  children: ReactNode;
  routeKey: string;
}) {
  const { reducedMotion } = useMotionSystem();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EXPO_EASE }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
}
