import { useRef, useState } from 'react';
import { Upload, Link2, CheckCircle2, X, Image as ImageIcon, FileText } from 'lucide-react';
import { uploadOptimizedMedia } from '../../services/dataClient';

interface MediaUploadFieldProps {
  label: string;
  folder: 'berita' | 'galeri' | 'events' | 'arsip' | 'anggota' | 'prestasi';
  mode?: 'image' | 'document';
  value: string;
  onChange: (url: string, meta?: { sizeText?: string }) => void;
  placeholder?: string;
}

export default function MediaUploadField({
  label,
  folder,
  mode = 'image',
  value,
  onChange,
  placeholder = 'https://...',
}: MediaUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [optimizationNote, setOptimizationNote] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setOptimizationNote('');
    setIsUploading(true);
    try {
      const result = await uploadOptimizedMedia(file, folder);
      onChange(result.url, { sizeText: result.sizeText });
      if (result.isWebpOptimized) {
        const dim = result.width && result.height ? ` · ${result.width}×${result.height}` : '';
        const orig = result.originalSizeText ? ` (dari ${result.originalSizeText})` : '';
        setOptimizationNote(`WebP 1080p${dim} · ${result.sizeText}${orig}`);
      } else {
        setOptimizationNote(`Berkas tersimpan · ${result.sizeText}`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses berkas.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label
          style={{
            fontFamily: 'var(--font-header)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--deep-violet)',
            letterSpacing: '0.03em',
          }}
        >
          {label}
        </label>

        <div
          style={{
            display: 'inline-flex',
            background: '#F5F0FC',
            padding: '2px',
            borderRadius: '8px',
            border: '1px solid #E5DDF5',
          }}
        >
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              minHeight: '32px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-header)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: inputMode === 'upload' ? 'white' : 'transparent',
              color: inputMode === 'upload' ? 'var(--deep-violet)' : 'var(--mid-grey)',
            }}
          >
            <Upload size={13} /> Upload
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              minHeight: '32px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-header)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: inputMode === 'url' ? 'white' : 'transparent',
              color: inputMode === 'url' ? 'var(--deep-violet)' : 'var(--mid-grey)',
            }}
          >
            <Link2 size={13} /> Tempel URL
          </button>
        </div>
      </div>

      {inputMode === 'upload' ? (
        <div
          style={{
            border: '1.5px dashed #CBB8EC',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            background: '#FAF8FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={
              mode === 'image'
                ? 'image/*'
                : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*'
            }
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: '1 1 200px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'white',
                border: '1px solid #E5DDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--vistara-purple)',
                flexShrink: 0,
              }}
            >
              {mode === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--deep-violet)' }}>
                {isUploading
                  ? 'Mengoptimalkan & mengunggah...'
                  : mode === 'image'
                    ? 'Pilih gambar (otomatis max 1080p WebP)'
                    : 'Pilih dokumen PDF/Office atau gambar'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--mid-grey)' }}>
                {mode === 'image'
                  ? 'JPG/PNG/HEIC otomatis dikompres ke WebP maksimal 1920×1080.'
                  : 'Gambar dikonversi ke 1080p WebP; PDF/dokumen disimpan langsung.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline btn-sm"
            style={{ minHeight: '40px', background: 'white' }}
          >
            <Upload size={14} />
            <span>{isUploading ? 'Memproses...' : 'Pilih Berkas'}</span>
          </button>
        </div>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => {
            setOptimizationNote('');
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '0.6rem 0.85rem',
            borderRadius: '10px',
            border: '1px solid #D4BFEF',
            fontFamily: 'var(--font-body)',
            fontSize: '0.88rem',
            color: 'var(--ink)',
            background: 'white',
            outline: 'none',
          }}
        />
      )}

      {optimizationNote && (
        <div
          className="tabular-nums"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: '#2E7D32',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={14} />
          <span>{optimizationNote}</span>
        </div>
      )}

      {errorMsg && (
        <div role="alert" style={{ fontSize: '0.78rem', color: '#C62828', fontWeight: 500 }}>
          {errorMsg}
        </div>
      )}

      {value && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '10px',
            border: '1px solid #E5DDF5',
            background: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            {mode === 'image' ? (
              <img
                src={value}
                alt="Pratinjau media"
                referrerPolicy="no-referrer"
                style={{
                  width: '48px',
                  height: '36px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: '1px solid #E5DDF5',
                  flexShrink: 0,
                }}
              />
            ) : (
              <FileText size={18} style={{ color: 'var(--vistara-purple)', flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: '0.76rem',
                color: 'var(--mid-grey)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value.startsWith('data:') ? 'Berkas siap disimpan (WebP teroptimasi)' : value}
            </span>
          </div>
          <button
            type="button"
            aria-label="Hapus media"
            onClick={() => {
              setOptimizationNote('');
              onChange('');
            }}
            style={{
              background: '#F5F0FC',
              border: 'none',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--mid-grey)',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
