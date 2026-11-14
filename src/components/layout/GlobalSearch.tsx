import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  X,
  Newspaper,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  searchGlobalContent,
  type SearchCategory,
  type SearchResultItem,
} from '../../utils/globalSearch';

interface GlobalSearchProps {
  mode?: 'desktop' | 'mobile-button' | 'drawer';
  onNavigate?: () => void;
}

const CATEGORY_TABS: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'berita', label: 'Berita' },
  { id: 'event', label: 'Event' },
  { id: 'program', label: 'Program' },
];

function getTypeIcon(type: SearchResultItem['type']) {
  switch (type) {
    case 'berita':
      return <Newspaper size={15} />;
    case 'event':
      return <Calendar size={15} />;
    case 'program':
      return <Zap size={15} />;
  }
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (terms.length === 0) return <>{text}</>;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        terms.some((t) => part.toLowerCase() === t) ? (
          <mark
            key={i}
            style={{
              background: 'rgba(230, 200, 117, 0.28)',
              color: '#FFE699',
              padding: '0 2px',
              borderRadius: '3px',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function GlobalSearch({ mode = 'desktop', onNavigate }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

  const searchResponse = useMemo(
    () => searchGlobalContent(query, category, 6),
    [query, category]
  );

  const results = searchResponse.results;
  const clampedActiveIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  // Global keyboard shortcut: Cmd/Ctrl + K opens search
  useEffect(() => {
    if (mode !== 'desktop') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => {
          desktopInputRef.current?.focus();
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Close popover on outside click (desktop)
  useEffect(() => {
    if (!open || mode !== 'desktop') return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, mode]);

  // Focus modal input on mobile open
  useEffect(() => {
    if (open && mode !== 'desktop') {
      const timer = setTimeout(() => {
        modalInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [open, mode]);

  const handleSelectItem = (item: SearchResultItem) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    onNavigate?.();
    navigate(item.href);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      desktopInputRef.current?.blur();
      return;
    }

    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[clampedActiveIndex];
      if (target) {
        handleSelectItem(target);
      }
    }
  };

  const renderPanelContent = () => (
    <>
      {/* Minimal Filter Strip */}
      <div
        role="tablist"
        aria-label="Filter hasil pencarian"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.5rem 0.65rem',
          borderBottom: '1px solid rgba(185, 154, 225, 0.12)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = category === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setCategory(tab.id);
                setActiveIndex(0);
              }}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '7px',
                border: 'none',
                background: isActive ? 'rgba(132, 92, 188, 0.38)' : 'transparent',
                color: isActive ? 'white' : 'rgba(212, 191, 239, 0.68)',
                fontFamily: 'var(--font-header)',
                fontSize: '0.73rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'background 140ms ease, color 140ms ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Subtle Section Status */}
      <div
        style={{
          padding: '0.45rem 0.85rem 0.15rem',
          fontFamily: 'var(--font-header)',
          fontSize: '0.68rem',
          color: 'rgba(185, 154, 225, 0.58)',
        }}
      >
        {query.trim() ? `${results.length} hasil` : 'Populer'}
      </div>

      {/* Clean Compact Results List */}
      <div
        role="listbox"
        aria-label="Hasil pencarian global"
        style={{
          maxHeight: mode === 'desktop' ? '300px' : '55vh',
          overflowY: 'auto',
          padding: '0.25rem 0.45rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.15rem',
        }}
      >
        {results.length === 0 ? (
          <div
            style={{
              padding: '1.5rem 1rem',
              textAlign: 'center',
              color: 'rgba(212, 191, 239, 0.72)',
              fontSize: '0.82rem',
            }}
          >
            Tidak ada hasil untuk &ldquo;{query}&rdquo;
          </div>
        ) : (
          results.map((item, idx) => {
            const isSelected = idx === clampedActiveIndex;
            const shortType = item.type === 'program' ? 'Program' : item.typeLabel;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleSelectItem(item)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.52rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected ? 'rgba(107, 63, 160, 0.34)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                }}
              >
                <span
                  style={{
                    color: item.type === 'event' ? 'var(--gold-soft)' : 'rgba(185, 154, 225, 0.75)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getTypeIcon(item.type)}
                </span>

                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: '0.83rem',
                    color: 'rgba(255, 255, 255, 0.94)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <HighlightText text={item.title} query={query} />
                </span>

                <span
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.68rem',
                    color: item.type === 'event' ? 'var(--gold-soft)' : 'rgba(185, 154, 225, 0.62)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {shortType}
                </span>
              </button>
            );
          })
        )}
      </div>
    </>
  );

  // ── Desktop Navbar Inline Search Input + Floating Popover ──
  if (mode === 'desktop') {
    return (
      <div
        ref={containerRef}
        role="search"
        className="desktop-global-search"
        style={{ position: 'relative', flexShrink: 0 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            height: '38px',
            width: open ? '255px' : '212px',
            padding: '0 0.65rem',
            borderRadius: '10px',
            background: open ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.08)',
            border: open
              ? '1px solid rgba(185, 154, 225, 0.55)'
              : '1px solid rgba(185, 154, 225, 0.2)',
            boxShadow: open ? '0 0 0 3px rgba(155, 114, 204, 0.22)' : 'none',
            transition: 'width 220ms cubic-bezier(0.16, 1, 0.3, 1), background 160ms ease, border-color 160ms ease',
          }}
        >
          <Search size={15} style={{ color: 'var(--soft-lilac)', flexShrink: 0 }} />
          <input
            ref={desktopInputRef}
            id="global-nav-search"
            type="search"
            value={query}
            placeholder="Cari berita, event..."
            aria-label="Cari berita, event, atau program kerja"
            aria-expanded={open}
            aria-controls="global-search-results"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onKeyDown={handleInputKeyDown}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
            }}
          />
          {query ? (
            <button
              type="button"
              aria-label="Hapus kata kunci pencarian"
              onClick={() => {
                setQuery('');
                setActiveIndex(0);
                desktopInputRef.current?.focus();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(212, 191, 239, 0.8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <kbd
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '0.62rem',
                fontWeight: 600,
                color: 'rgba(212, 191, 239, 0.72)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(185, 154, 225, 0.2)',
                borderRadius: '5px',
                padding: '0.1rem 0.35rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              ⌘K
            </kbd>
          )}
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              id="global-search-results"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                right: 0,
                width: 'min(390px, calc(100vw - 2rem))',
                background: 'rgba(22, 12, 44, 0.96)',
                border: '1px solid rgba(185, 154, 225, 0.22)',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 16px 40px rgba(10, 5, 24, 0.5)',
                overflow: 'hidden',
                zIndex: 120,
              }}
            >
              {renderPanelContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Mobile Trigger + Responsive Search Modal ──
  return (
    <>
      {mode === 'mobile-button' ? (
        <button
          type="button"
          id="mobile-search-btn"
          aria-label="Cari berita, event, atau program kerja"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(185,154,225,0.22)',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          <Search size={19} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(185, 154, 225, 0.22)',
            color: 'rgba(237, 230, 248, 0.85)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.84rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Search size={16} style={{ color: 'var(--soft-lilac)', flexShrink: 0 }} />
          <span>Cari berita, event, program...</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Pencarian global VISTARA Hub"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 140,
              background: 'rgba(15, 10, 30, 0.78)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '1rem',
              paddingTop: '4.5rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: '540px',
                background: 'rgba(26, 15, 51, 0.98)',
                border: '1px solid rgba(185, 154, 225, 0.3)',
                borderRadius: '16px',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
                overflow: 'hidden',
              }}
            >
              {/* Input Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid rgba(185, 154, 225, 0.15)',
                }}
              >
                <Search size={18} style={{ color: 'var(--soft-lilac)', flexShrink: 0 }} />
                <input
                  ref={modalInputRef}
                  type="search"
                  value={query}
                  placeholder="Cari berita, event, atau program kerja..."
                  aria-label="Cari berita, event, atau program kerja"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleInputKeyDown}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'white',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                  }}
                />
                <button
                  type="button"
                  aria-label="Tutup pencarian"
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    minWidth: '36px',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {renderPanelContent()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
