import type { ReactNode, CSSProperties } from 'react';
import { motion } from 'motion/react';
import { SplitText, TiltSpotlightCard } from '../motion/MotionPrimitives';

// ─── SectionHeading ────────────────────────────────────────────

interface SectionHeadingProps {
  label?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  dark?: boolean;
  children?: ReactNode;
}

export function SectionHeading({
  label,
  title,
  highlight,
  subtitle,
  align = 'left',
  dark = false,
  children,
}: SectionHeadingProps) {
  const textColor = dark ? 'white' : 'var(--deep-violet)';
  const subColor = dark ? 'rgba(185,154,225,0.85)' : 'var(--mid-grey)';
  const centerStyle: CSSProperties =
    align === 'center' ? { textAlign: 'center', alignItems: 'center' } : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...centerStyle }}>
      {label && (
        <motion.div
          initial={{ opacity: 0, x: align === 'center' ? 0 : -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`section-label ${dark ? 'section-label-light' : ''}`}
          style={align === 'center' ? { justifyContent: 'center' } : {}}
        >
          {label}
        </motion.div>
      )}
      <h2 style={{ color: textColor, marginBottom: '0' }}>
        <SplitText text={title} as="span" stagger={0.04} />
        {highlight && (
          <>
            {' '}
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              style={{
                color: dark ? 'var(--gold-soft)' : 'var(--vistara-purple)',
                fontStyle: 'normal',
                display: 'inline-block',
              }}
            >
              {highlight}
            </motion.span>
          </>
        )}
      </h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: '1rem',
            color: subColor,
            maxWidth: '600px',
            lineHeight: 1.7,
            ...(align === 'center' ? { margin: '0 auto' } : {}),
          }}
        >
          {subtitle}
        </motion.p>
      )}
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'gold' | 'ghost' | 'success' | 'warning' | 'purple' | 'green';
  size?: 'sm' | 'md';
  style?: CSSProperties;
  className?: string;
}

const badgeVariants = {
  primary: { background: 'var(--vistara-purple)', color: 'white' },
  outline: { background: 'transparent', border: '1.5px solid var(--soft-lilac)', color: 'var(--amethyst)' },
  gold: { background: 'rgba(201,168,76,0.15)', border: '1px solid var(--gold-accent)', color: '#8A6812' },
  ghost: { background: 'var(--lavender-mist)', color: 'var(--royal-purple)' },
  purple: { background: 'rgba(107,63,160,0.12)', border: '1px solid var(--soft-lilac)', color: 'var(--royal-purple)' },
  green: { background: 'rgba(46, 125, 50, 0.1)', border: '1px solid rgba(46,125,50,0.3)', color: '#2E7D32' },
  success: { background: 'rgba(46, 125, 50, 0.1)', border: '1px solid rgba(46,125,50,0.3)', color: '#2E7D32' },
  warning: { background: 'rgba(230, 81, 0, 0.1)', border: '1px solid rgba(230,81,0,0.3)', color: '#E65100' },
};

export function Badge({ children, variant = 'ghost', size = 'md', style, className }: BadgeProps) {
  return (
    <span
      className={`badge ${className || ''}`}
      style={{
        ...badgeVariants[variant],
        fontSize: size === 'sm' ? '0.65rem' : '0.7rem',
        padding: size === 'sm' ? '0.2rem 0.6rem' : '0.25rem 0.75rem',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Card ──────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  as?: 'div' | 'article' | 'li';
  interactive?: boolean;
}

export function Card({
  children,
  dark = false,
  style,
  onClick,
  as: Tag = 'div',
  interactive = false,
}: CardProps) {
  if (interactive) {
    return (
      <TiltSpotlightCard dark={dark} style={style} onClick={onClick}>
        {children}
      </TiltSpotlightCard>
    );
  }

  return (
    <Tag
      className={dark ? 'card-dark' : 'card'}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

// ─── Button ────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  id,
  ariaLabel,
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`btn btn-${variant} ${sizeClass}`}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      {children}
    </motion.button>
  );
}

// ─── EmptyState ────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="empty-state"
    >
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--mid-grey)', fontWeight: 600 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--mid-grey)', maxWidth: '400px' }}>
          {description}
        </p>
      )}
      {action}
    </motion.div>
  );
}

// ─── LoadingState ──────────────────────────────────────────────

export function LoadingState() {
  return (
    <div style={{ padding: '3rem 1.25rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', width: '100%', maxWidth: '960px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
        ))}
      </div>
    </div>
  );
}

// ─── StatusBadge ───────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'ghost' }> = {
  ongoing: { label: 'Berlangsung', variant: 'success' },
  planned: { label: 'Direncanakan', variant: 'ghost' },
  completed: { label: 'Selesai', variant: 'warning' },
  upcoming: { label: 'Segera', variant: 'ghost' },
  past: { label: 'Telah Berlalu', variant: 'warning' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, variant: 'ghost' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
