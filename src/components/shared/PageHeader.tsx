import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { SplitText } from '../motion/MotionPrimitives';
import CrystalCanvas from '../motion/CrystalCanvas';

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
            style={{
              color: 'rgba(255,255,255,0.58)',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.58)';
            }}
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
                style={{
                  textDecoration: 'none',
                  color: 'rgba(255,255,255,0.58)',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.58)';
                }}
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
      <CrystalCanvas particleCount={18} crystalCount={3} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ marginBottom: '1.25rem' }}
          >
            <Breadcrumb items={breadcrumbs} />
          </motion.div>
        )}

        {badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            style={{ marginBottom: '0.75rem' }}
          >
            <span
              className="badge badge-ghost"
              style={{
                background: 'rgba(185,154,225,0.16)',
                color: 'var(--soft-lilac)',
                border: '1px solid rgba(185,154,225,0.32)',
              }}
            >
              {badge}
            </span>
          </motion.div>
        )}

        <SplitText
          as="h1"
          text={title}
          immediate
          stagger={0.04}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.03em',
            marginBottom: subtitle ? '0.75rem' : '0',
          }}
        />

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: '1rem',
              color: 'rgba(212,191,239,0.9)',
              maxWidth: '640px',
              lineHeight: 1.65,
            }}
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: '1.5rem' }}
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Decorative animated geometric circles */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            border: '1px dashed rgba(185,154,225,0.14)',
            top: '-110px',
            right: '-60px',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: '210px',
            height: '210px',
            borderRadius: '50%',
            border: '1px solid rgba(230,200,117,0.12)',
            top: '-30px',
            right: '60px',
          }}
        />
      </div>
    </section>
  );
}
