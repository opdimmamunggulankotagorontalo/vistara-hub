import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Eye, FileEdit, Info, Save } from 'lucide-react';

interface EditorialWorkspaceShellProps {
  docTypeLabel: string;
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  saveLabel: string;
  error?: string;
  onBack: () => void;
  onSave: () => void;
  documentColumn: ReactNode;
  settingsColumn: ReactNode;
  previewNode: ReactNode;
}

type DesktopMode = 'write' | 'preview';
type MobileTab = 'write' | 'settings' | 'preview';

export default function EditorialWorkspaceShell({
  docTypeLabel,
  isEditing,
  isDirty,
  isSaving,
  saveLabel,
  error,
  onBack,
  onSave,
  documentColumn,
  settingsColumn,
  previewNode,
}: EditorialWorkspaceShellProps) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [desktopMode, setDesktopMode] = useState<DesktopMode>('write');
  const [mobileTab, setMobileTab] = useState<MobileTab>('write');
  const [confirmExit, setConfirmExit] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  const handleBackRequest = () => {
    if (isDirty && !confirmExit) {
      setConfirmExit(true);
      return;
    }
    setConfirmExit(false);
    onBack();
  };

  return (
    <div className="editorial-studio-root">
      <style>{`
        .editorial-studio-root {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .editorial-topbar {
          background: #FFFFFF;
          border: 1px solid #E5DDF5;
          border-radius: 14px;
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .editorial-desktop-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 318px;
          gap: 1.25rem;
          align-items: start;
        }
        .editorial-mobile-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.3rem;
          padding: 0.25rem;
          background: #F5F0FC;
          border: 1px solid #E5DDF5;
          border-radius: 12px;
        }
        .editorial-mobile-tab-btn {
          min-height: 44px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: var(--mid-grey);
          font-family: var(--font-header);
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .editorial-mobile-tab-btn[aria-selected='true'] {
          background: #FFFFFF;
          color: var(--deep-violet);
          box-shadow: 0 2px 8px rgba(45, 27, 105, 0.08);
        }
        .editorial-paper-card {
          background: #FFFFFF;
          border: 1px solid #E5DDF5;
          border-radius: 16px;
          padding: 1rem;
          box-shadow: 0 8px 26px rgba(45, 27, 105, 0.04);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        .editorial-inspector-card {
          background: #FFFFFF;
          border: 1px solid #E5DDF5;
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        @media (min-width: 1024px) {
          .editorial-paper-card {
            padding: 1.5rem 1.75rem;
          }
          .editorial-inspector-card {
            position: sticky;
            top: 86px;
            padding: 1.15rem;
          }
        }
      `}</style>

      {/* Studio Header Bar */}
      <div className="editorial-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: '1 1 200px' }}>
          <button
            type="button"
            onClick={handleBackRequest}
            className="btn btn-outline btn-sm"
            style={{ minHeight: '44px', padding: '0 0.75rem', flexShrink: 0 }}
          >
            <ArrowLeft size={15} />
            <span>Kembali</span>
          </button>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '0.69rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--vistara-purple)',
              }}
            >
              Studio Editorial · {docTypeLabel}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '0.94rem',
                color: 'var(--deep-violet)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isEditing ? `Sunting ${docTypeLabel}` : `${docTypeLabel} Baru`}
              {isDirty ? ' · Draf diubah' : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          {isDesktop && (
            <div
              style={{
                display: 'inline-flex',
                padding: '0.2rem',
                background: '#F5F0FC',
                border: '1px solid #E5DDF5',
                borderRadius: '10px',
                gap: '0.2rem',
              }}
              role="tablist"
              aria-label="Mode studio editorial"
            >
              <button
                type="button"
                role="tab"
                aria-selected={desktopMode === 'write'}
                onClick={() => setDesktopMode('write')}
                style={{
                  minHeight: '36px',
                  padding: '0 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: desktopMode === 'write' ? '#FFFFFF' : 'transparent',
                  color: desktopMode === 'write' ? 'var(--deep-violet)' : 'var(--mid-grey)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                }}
              >
                <FileEdit size={14} /> Tulis
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={desktopMode === 'preview'}
                onClick={() => setDesktopMode('preview')}
                style={{
                  minHeight: '36px',
                  padding: '0 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: desktopMode === 'preview' ? '#FFFFFF' : 'transparent',
                  color: desktopMode === 'preview' ? 'var(--deep-violet)' : 'var(--mid-grey)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                }}
              >
                <Eye size={14} /> Pratinjau
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={onSave}
            className="btn btn-primary btn-sm"
            style={{ minHeight: '44px', padding: '0 1rem' }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Menyimpan...' : saveLabel}</span>
          </button>
        </div>
      </div>

      {/* Inline Unsaved Confirmation Strip */}
      {confirmExit && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 0.95rem',
            borderRadius: '12px',
            background: '#FFF8E1',
            border: '1px solid #FFE082',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#6D4C00' }}>
            Ada perubahan draf yang belum disimpan. Yakin ingin keluar dari studio?
          </span>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setConfirmExit(false)}
              className="btn btn-outline btn-sm"
              style={{ minHeight: '42px' }}
            >
              Lanjut Menulis
            </button>
            <button
              type="button"
              onClick={onBack}
              style={{
                minHeight: '42px',
                padding: '0 0.85rem',
                borderRadius: '9px',
                border: '1px solid #FFCDD2',
                background: '#FFF5F5',
                color: '#C62828',
                fontFamily: 'var(--font-header)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Keluar Tanpa Simpan
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '0.7rem 0.95rem',
            borderRadius: '11px',
            background: '#FFF5F5',
            border: '1px solid #FFCDD2',
            color: '#C62828',
            fontSize: '0.84rem',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* Single-Mount Responsive Studio */}
      {isDesktop ? (
        <div className="editorial-desktop-grid">
          <div className="editorial-paper-card">
            {desktopMode === 'write' ? documentColumn : previewNode}
          </div>
          <aside className="editorial-inspector-card" aria-label={`Pengaturan ${docTypeLabel}`}>
            <div
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '0.73rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--vistara-purple)',
              }}
            >
              Info, Kategori &amp; Media
            </div>
            {settingsColumn}
          </aside>
        </div>
      ) : (
        <>
          <div className="editorial-mobile-tabs" role="tablist" aria-label="Navigasi editor mobile">
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'write'}
              className="editorial-mobile-tab-btn"
              onClick={() => setMobileTab('write')}
            >
              <FileEdit size={15} /> Tulis
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'settings'}
              className="editorial-mobile-tab-btn"
              onClick={() => setMobileTab('settings')}
            >
              <Info size={15} /> Info &amp; Foto
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'preview'}
              className="editorial-mobile-tab-btn"
              onClick={() => setMobileTab('preview')}
            >
              <Eye size={15} /> Pratinjau
            </button>
          </div>

          {mobileTab === 'write' && (
            <div className="editorial-paper-card">{documentColumn}</div>
          )}
          {mobileTab === 'settings' && (
            <div className="editorial-inspector-card">{settingsColumn}</div>
          )}
          {mobileTab === 'preview' && (
            <div className="editorial-paper-card">{previewNode}</div>
          )}
        </>
      )}
    </div>
  );
}
