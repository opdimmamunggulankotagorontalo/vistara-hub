import { useState } from 'react';
import { Share2, MessageCircle, Link2, Check } from 'lucide-react';
import { buildWhatsAppShareUrl, shareContent, type SharePayload } from '../../utils/shareUtils';

interface ShareButtonsProps {
  title: string;
  summary?: string;
  path: string;
  tag?: string;
  compact?: boolean;
}

export default function ShareButtons({
  title,
  summary,
  path,
  tag,
  compact = false,
}: ShareButtonsProps) {
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'shared'>('idle');

  const resolvedUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
      : path;

  const payload: SharePayload = {
    title,
    summary,
    url: resolvedUrl,
    tag,
  };

  const whatsAppHref = buildWhatsAppShareUrl(payload);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedUrl);
        setFeedback('copied');
        setTimeout(() => setFeedback('idle'), 2200);
      }
    } catch {
      // ignore clipboard errors gracefully
    }
  };

  const handleNativeShare = async () => {
    const outcome = await shareContent(payload);
    if (outcome === 'copied') {
      setFeedback('copied');
      setTimeout(() => setFeedback('idle'), 2200);
    } else if (outcome === 'shared') {
      setFeedback('shared');
      setTimeout(() => setFeedback('idle'), 2200);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.55rem',
      }}
    >
      <a
        href={whatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Bagikan "${title}" ke WhatsApp`}
        className="btn btn-sm"
        style={{
          background: '#1E8449',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.12)',
          minHeight: '44px',
          padding: compact ? '0.45rem 0.85rem' : '0.5rem 1rem',
          fontSize: '0.8rem',
        }}
      >
        <MessageCircle size={15} />
        <span>Bagikan ke WhatsApp</span>
      </a>

      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Bagikan tautan halaman ini"
        className="btn btn-outline btn-sm"
        style={{
          minHeight: '44px',
          padding: compact ? '0.45rem 0.85rem' : '0.5rem 1rem',
          fontSize: '0.8rem',
        }}
      >
        {feedback === 'shared' ? <Check size={15} /> : <Share2 size={15} />}
        <span>{feedback === 'shared' ? 'Dibagikan' : 'Bagikan'}</span>
      </button>

      {!compact && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Salin tautan halaman"
          className="btn btn-sm"
          style={{
            minHeight: '44px',
            padding: '0.5rem 0.9rem',
            background: feedback === 'copied' ? '#E8F5E9' : 'var(--ghost-purple)',
            color: feedback === 'copied' ? '#2E7D32' : 'var(--deep-violet)',
            border: '1px solid var(--pale-lilac)',
            fontSize: '0.8rem',
          }}
        >
          {feedback === 'copied' ? <Check size={15} /> : <Link2 size={15} />}
          <span>{feedback === 'copied' ? 'Tautan Tersalin' : 'Salin Tautan'}</span>
        </button>
      )}
    </div>
  );
}
