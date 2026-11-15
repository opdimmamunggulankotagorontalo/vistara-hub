import { useMemo } from 'react';
import { plainTextToEditableHtml } from '../../utils/richText';

interface RichTextRendererProps {
  content?: string | null;
  compact?: boolean;
  className?: string;
}

export default function RichTextRenderer({
  content,
  compact = false,
  className = '',
}: RichTextRendererProps) {
  const html = useMemo(() => {
    const raw = String(content || '').trim();
    if (!raw) return '';
    return plainTextToEditableHtml(raw);
  }, [content]);

  if (!html) return null;

  return (
    <>
      <style>{`
        .vistara-prose {
          color: var(--charcoal);
          font-size: 0.98rem;
          line-height: 1.85;
          word-break: break-word;
        }
        .vistara-prose-compact {
          font-size: 0.87rem;
          line-height: 1.62;
          color: var(--mid-grey);
        }
        .vistara-prose p {
          margin: 0 0 0.95rem;
        }
        .vistara-prose-compact p {
          margin: 0 0 0.5rem;
        }
        .vistara-prose p:last-child,
        .vistara-prose ul:last-child,
        .vistara-prose ol:last-child,
        .vistara-prose blockquote:last-child {
          margin-bottom: 0;
        }
        .vistara-prose h2 {
          font-family: var(--font-display);
          font-size: 1.32rem;
          font-weight: 800;
          color: var(--deep-violet);
          line-height: 1.3;
          margin: 1.45rem 0 0.6rem;
        }
        .vistara-prose h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--deep-violet);
          line-height: 1.35;
          margin: 1.2rem 0 0.45rem;
        }
        .vistara-prose-compact h2,
        .vistara-prose-compact h3 {
          font-size: 0.95rem;
          margin: 0.65rem 0 0.3rem;
        }
        .vistara-prose ul,
        .vistara-prose ol {
          margin: 0.4rem 0 1rem;
          padding-left: 1.4rem;
        }
        .vistara-prose ul {
          list-style-type: disc;
        }
        .vistara-prose ol {
          list-style-type: decimal;
        }
        .vistara-prose li {
          margin-bottom: 0.32rem;
        }
        .vistara-prose a {
          color: var(--vistara-purple);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .vistara-prose a:hover {
          color: var(--deep-violet);
        }
        .vistara-prose blockquote {
          margin: 1rem 0;
          padding: 0.85rem 1.05rem;
          border-radius: 10px;
          background: #FAF8FF;
          border: 1px solid #E5DDF5;
          color: var(--deep-violet);
          font-style: italic;
        }
        .vistara-prose hr {
          border: none;
          border-top: 1px solid #E5DDF5;
          margin: 1.35rem 0;
        }
      `}</style>
      <div
        className={`vistara-prose ${compact ? 'vistara-prose-compact' : ''} ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
