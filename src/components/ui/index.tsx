import type { ReactNode, CSSProperties } from 'react';

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
  const subColor = dark ? 'rgba(185,154,225,0.8)' : 'var(--mid-grey)';
  const centerStyle: CSSProperties = align === 'center' ? { textAlign: 'center', alignItems: 'center' } : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...centerStyle }}>
      {label && (
        <div className={`section-label ${dark ? 'section-label-light' : ''}`} style={align === 'center' ? { justifyContent: 'center' } : {}}>
          {label}
        </div>
      )}
      <h2 style={{ color: textColor, marginBottom: '0' }}>
        {title}
        {highlight && (
          <span style={{ color: 'var(--vistara-purple)', fontStyle: 'normal' }}> {highlight}</span>
        )}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '1rem', color: subColor, maxWidth: '600px', lineHeight: 1.7, ...(align === 'center' ? { margin: '0 auto' } : {}) }}>
          {subtitle}
        </p>
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
}

export function Card({ children, dark = false, style, onClick, as: Tag = 'div' }: CardProps) {
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
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`btn btn-${variant} ${sizeClass}`}
      style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      {children}
    </button>
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
    <div className="empty-state">
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--mid-grey)', fontWeight: 600 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--light-grey)', maxWidth: '400px' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─── LoadingState ──────────────────────────────────────────────

export function LoadingState() {
  return (
    <div style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', width: '100%', maxWidth: '900px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
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
