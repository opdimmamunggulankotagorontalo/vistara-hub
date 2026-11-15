// ============================================================
// VISTARA Hub — Rich Text Sanitization, Conversion & Stats
// Supports sanitized editorial HTML + backward-compatible plain text
// ============================================================

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'del',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'a',
]);

export function hasRichMarkup(input: string): boolean {
  return /<\/?(p|br|b|strong|i|em|u|s|del|h2|h3|ul|ol|li|blockquote|hr|a)\b[^>]*>/i.test(input || '');
}

export function isSafeHref(rawHref: string): string | null {
  const trimmed = String(rawHref || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed;
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && /^[\w.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeDomNode(node: Node, doc: Document): Node | null {
  if (node.nodeType === 3) {
    return doc.createTextNode(node.textContent || '');
  }
  if (node.nodeType !== 1) return null;

  const el = node as Element;
  const rawTag = el.tagName.toLowerCase();

  // Drop dangerous blocks completely
  if (['script', 'style', 'iframe', 'object', 'embed', 'svg', 'noscript'].includes(rawTag)) {
    return null;
  }

  // Normalize common div / h1 / span wrappers cleanly
  let tag = rawTag;
  if (tag === 'h1') tag = 'h2';
  if (tag === 'h4' || tag === 'h5' || tag === 'h6') tag = 'h3';
  if (tag === 'div') tag = 'p';

  if (!ALLOWED_TAGS.has(tag)) {
    const frag = doc.createDocumentFragment();
    Array.from(el.childNodes).forEach((child) => {
      const cleaned = sanitizeDomNode(child, doc);
      if (cleaned) frag.appendChild(cleaned);
    });
    return frag;
  }

  const cleanEl = doc.createElement(tag);
  if (tag === 'a') {
    const safeUrl = isSafeHref(el.getAttribute('href') || '');
    if (!safeUrl) {
      const frag = doc.createDocumentFragment();
      Array.from(el.childNodes).forEach((child) => {
        const cleaned = sanitizeDomNode(child, doc);
        if (cleaned) frag.appendChild(cleaned);
      });
      return frag;
    }
    cleanEl.setAttribute('href', safeUrl);
    if (/^https?:/i.test(safeUrl)) {
      cleanEl.setAttribute('target', '_blank');
      cleanEl.setAttribute('rel', 'noopener noreferrer');
    }
  }

  if (tag === 'br' || tag === 'hr') {
    return cleanEl;
  }

  Array.from(el.childNodes).forEach((child) => {
    const cleaned = sanitizeDomNode(child, doc);
    if (cleaned) cleanEl.appendChild(cleaned);
  });

  return cleanEl;
}

function sanitizeFallbackString(raw: string): string {
  const withoutBlocked = raw
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  return withoutBlocked.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (match, tagRaw: string, attrs: string) => {
    let tag = tagRaw.toLowerCase();
    if (tag === 'h1') tag = 'h2';
    if (tag === 'h4' || tag === 'h5' || tag === 'h6') tag = 'h3';
    if (tag === 'div') tag = 'p';
    if (!ALLOWED_TAGS.has(tag)) return '';
    const isClose = match.startsWith('</');
    if (isClose) return `</${tag}>`;
    if (tag === 'br' || tag === 'hr') return `<${tag}>`;
    if (tag === 'a') {
      const hrefMatch = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const safe = isSafeHref(hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || '');
      if (!safe) return '';
      const relAttrs = /^https?:/i.test(safe) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(safe)}"${relAttrs}>`;
    }
    return `<${tag}>`;
  });
}

export function sanitizeRichHtml(raw: string): string {
  const input = String(raw || '').trim();
  if (!input) return '';

  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const parsed = parser.parseFromString(input, 'text/html');
      const outDoc = document.implementation.createHTMLDocument('');
      const container = outDoc.createElement('div');
      Array.from(parsed.body.childNodes).forEach((child) => {
        const cleaned = sanitizeDomNode(child, outDoc);
        if (cleaned) container.appendChild(cleaned);
      });
      const result = container.innerHTML.trim();
      if (result === '<p><br></p>' || result === '<br>') return '';
      return result;
    } catch {
      // fall back to regex sanitizer below
    }
  }

  return sanitizeFallbackString(input).trim();
}

export function plainTextToEditableHtml(raw: string): string {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (hasRichMarkup(value)) {
    return sanitizeRichHtml(value);
  }
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function richTextToPlainText(raw: string): string {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (!hasRichMarkup(value)) return value;

  const normalized = value
    .replace(/<\/(p|h2|h3|blockquote|li|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''))
    .join('\n')
    .trim();
}

export function getRichTextStats(raw: string): {
  words: number;
  chars: number;
  readingMinutes: number;
} {
  const plain = richTextToPlainText(raw);
  if (!plain) {
    return { words: 0, chars: 0, readingMinutes: 0 };
  }
  const words = plain.split(/\s+/).filter(Boolean).length;
  const chars = plain.replace(/\s+/g, ' ').length;
  const readingMinutes = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readingMinutes };
}
