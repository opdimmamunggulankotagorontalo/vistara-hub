import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className="breadcrumb"
        style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap' }}
      >
        <li className="breadcrumb-item">
          <Link
            to="/beranda"
            aria-label="Beranda"
            style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'color var(--transition-fast)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <Home size={13} />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChevronRight size={12} className="breadcrumb-sep" />
            {item.href && index < items.length - 1 ? (
              <Link
                to={item.href}
                className="breadcrumb-item"
                style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', transition: 'color var(--transition-fast)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
              >
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-item active" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ─── PageHeader ────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, badge, children }: PageHeaderProps) {
  return (
    <section className="page-hero" aria-labelledby="page-title">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}

        {badge && (
          <div style={{ marginBottom: '0.75rem' }}>
            <span className="badge badge-ghost" style={{ background: 'rgba(185,154,225,0.15)', color: 'var(--soft-lilac)', border: '1px solid rgba(185,154,225,0.3)' }}>
              {badge}
            </span>
          </div>
        )}

        <h1
          id="page-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.03em',
            marginBottom: subtitle ? '0.75rem' : '0',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p style={{ fontSize: '1rem', color: 'rgba(185,154,225,0.85)', maxWidth: '600px', lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}

        {children && (
          <div style={{ marginTop: '1.5rem' }}>
            {children}
          </div>
        )}
      </div>

      {/* Decorative geometric circles */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(185,154,225,0.08)', top: '-100px', right: '-50px' }} />
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(185,154,225,0.06)', top: '-30px', right: '60px' }} />
      </div>
    </section>
  );
}
