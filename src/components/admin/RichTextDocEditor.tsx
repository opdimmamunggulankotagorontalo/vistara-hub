import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Unlink,
  RemoveFormatting,
  Undo2,
  Redo2,
  Keyboard,
  Check,
  X,
} from 'lucide-react';
import {
  getRichTextStats,
  isSafeHref,
  plainTextToEditableHtml,
  sanitizeRichHtml,
} from '../../utils/richText';

interface RichTextDocEditorProps {
  value: string;
  onChange: (nextHtml: string) => void;
  placeholder?: string;
  minHeight?: number;
  label?: string;
  onShortcutSave?: () => void;
  ariaLabel?: string;
}

type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  block: 'p' | 'h2' | 'h3' | 'blockquote';
  link: boolean;
};

const DEFAULT_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ul: false,
  ol: false,
  block: 'p',
  link: false,
};

const SHORTCUT_ITEMS: Array<{ keys: string; desc: string }> = [
  { keys: 'Ctrl/Cmd + B', desc: 'Tebal (Bold)' },
  { keys: 'Ctrl/Cmd + I', desc: 'Miring (Italic)' },
  { keys: 'Ctrl/Cmd + U', desc: 'Garis Bawah' },
  { keys: 'Ctrl/Cmd + Shift + X', desc: 'Coret Teks' },
  { keys: 'Ctrl/Cmd + K', desc: 'Sisipkan / Sunting Tautan' },
  { keys: 'Ctrl/Cmd + Alt + 1 / 2 / 0', desc: 'H2 / H3 / Paragraf' },
  { keys: 'Ctrl/Cmd + Shift + 8 / 7', desc: 'Daftar Poin / Nomor' },
  { keys: 'Ctrl/Cmd + Shift + 9', desc: 'Blok Kutipan' },
  { keys: 'Ctrl/Cmd + \\', desc: 'Hapus Format' },
  { keys: 'Ctrl/Cmd + Z / Y', desc: 'Undo / Redo' },
  { keys: 'Ctrl/Cmd + S', desc: 'Simpan Dokumen' },
];

const MARKDOWN_TRIGGERS: Array<{ trigger: string; desc: string }> = [
  { trigger: '# + Spasi', desc: 'Subjudul (H2)' },
  { trigger: '## + Spasi', desc: 'Bagian (H3)' },
  { trigger: '- atau * + Spasi', desc: 'Daftar Poin' },
  { trigger: '1. + Spasi', desc: 'Daftar Bernomor' },
  { trigger: '> + Spasi', desc: 'Blok Kutipan' },
];

function getClosestTagName(node: Node | null, root: HTMLElement | null, tagNames: string[]): string | null {
  let curr: Node | null = node;
  while (curr && curr !== root) {
    if (curr.nodeType === 1) {
      const tag = (curr as Element).tagName.toLowerCase();
      if (tagNames.includes(tag)) return tag;
    }
    curr = curr.parentNode;
  }
  return null;
}

export default function RichTextDocEditor({
  value,
  onChange,
  placeholder = 'Mulai menulis isi naskah di sini... Ketik "# " untuk subjudul, "- " untuk daftar poin, atau gunakan Ctrl+B / Ctrl+I / Ctrl+K.',
  minHeight = 320,
  label,
  onShortcutSave,
  ariaLabel = 'Editor naskah dokumen',
}: RichTextDocEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastEmittedRef = useRef<string>('');
  const savedRangeRef = useRef<Range | null>(null);

  const [formats, setFormats] = useState<ActiveFormats>(DEFAULT_FORMATS);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkError, setLinkError] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isEmpty, setIsEmpty] = useState(() => !value.trim());

  const stats = useMemo(() => getRichTextStats(value), [value]);

  const syncFromDom = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const rawHtml = el.innerHTML;
    const cleaned = sanitizeRichHtml(rawHtml);
    const hasText = el.innerText.replace(/\u200B/g, '').trim().length > 0;
    setIsEmpty(!hasText && !/<hr\b/i.test(cleaned));
    lastEmittedRef.current = cleaned;
    onChange(cleaned);
  }, [onChange]);

  const refreshActiveFormats = useCallback(() => {
    const el = editorRef.current;
    if (!el || typeof document === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode;
    if (!anchor || !el.contains(anchor)) return;

    const blockTag = getClosestTagName(anchor, el, ['h2', 'h3', 'blockquote', 'p']);
    const anchorTag = getClosestTagName(anchor, el, ['a']);

    let bold = false;
    let italic = false;
    let underline = false;
    let strike = false;
    let ul = false;
    let ol = false;

    try {
      bold = document.queryCommandState('bold');
      italic = document.queryCommandState('italic');
      underline = document.queryCommandState('underline');
      strike = document.queryCommandState('strikeThrough');
      ul = document.queryCommandState('insertUnorderedList');
      ol = document.queryCommandState('insertOrderedList');
    } catch {
      // ignore unsupported state queries
    }

    setFormats({
      bold,
      italic,
      underline,
      strike,
      ul,
      ol,
      block:
        blockTag === 'h2' || blockTag === 'h3' || blockTag === 'blockquote'
          ? blockTag
          : 'p',
      link: Boolean(anchorTag),
    });
  }, []);

  // Sync external prop changes (e.g., loading another item to edit) without fighting cursor
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const normalizedIncoming = plainTextToEditableHtml(value);
    const normalizedLastEmitted = plainTextToEditableHtml(lastEmittedRef.current);
    if (
      value === lastEmittedRef.current ||
      normalizedIncoming === lastEmittedRef.current ||
      normalizedIncoming === normalizedLastEmitted
    ) {
      return;
    }
    el.innerHTML = normalizedIncoming;
    lastEmittedRef.current = normalizedIncoming;
    setIsEmpty(!normalizedIncoming.trim());
  }, [value]);

  useEffect(() => {
    const onSelectionChange = () => {
      refreshActiveFormats();
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [refreshActiveFormats]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const execCmd = (command: string, val?: string) => {
    focusEditor();
    try {
      document.execCommand(command, false, val);
    } catch {
      // ignore
    }
    syncFromDom();
    refreshActiveFormats();
  };

  const setBlockType = (tag: 'p' | 'h2' | 'h3' | 'blockquote') => {
    focusEditor();
    const sel = window.getSelection();
    const el = editorRef.current;
    if (sel && sel.rangeCount > 0 && el) {
      const currentBlock = getClosestTagName(sel.anchorNode, el, ['h2', 'h3', 'blockquote']);
      if (tag === 'blockquote' && currentBlock === 'blockquote') {
        document.execCommand('formatBlock', false, 'p');
        syncFromDom();
        refreshActiveFormats();
        return;
      }
      if ((tag === 'h2' || tag === 'h3') && currentBlock === tag) {
        document.execCommand('formatBlock', false, 'p');
        syncFromDom();
        refreshActiveFormats();
        return;
      }
    }
    document.execCommand('formatBlock', false, tag);
    syncFromDom();
    refreshActiveFormats();
  };

  const handleClearFormatting = () => {
    focusEditor();
    try {
      document.execCommand('removeFormat');
      document.execCommand('unlink');
      document.execCommand('formatBlock', false, 'p');
    } catch {
      // ignore
    }
    syncFromDom();
    refreshActiveFormats();
  };

  const openLinkPopover = () => {
    setShowShortcuts(false);
    setLinkError('');
    const el = editorRef.current;
    const sel = window.getSelection();
    let existingHref = '';
    let selectedStr = '';

    if (sel && sel.rangeCount > 0 && el && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0).cloneRange();
      savedRangeRef.current = range;
      selectedStr = sel.toString().trim();
      let curr: Node | null = sel.anchorNode;
      while (curr && curr !== el) {
        if (curr.nodeType === 1 && (curr as Element).tagName.toLowerCase() === 'a') {
          existingHref = (curr as HTMLAnchorElement).getAttribute('href') || '';
          if (!selectedStr) selectedStr = (curr as HTMLElement).innerText.trim();
          break;
        }
        curr = curr.parentNode;
      }
    } else {
      savedRangeRef.current = null;
    }

    setLinkUrl(existingHref || 'https://');
    setLinkText(selectedStr);
    setShowLinkPopover((prev) => !prev || Boolean(existingHref));
  };

  const applyLink = () => {
    const safeUrl = isSafeHref(linkUrl);
    if (!safeUrl) {
      setLinkError('Masukkan URL valid (contoh: https://... atau /beranda/...)');
      return;
    }

    focusEditor();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    const currentSelText = sel?.toString().trim() || '';
    if (!currentSelText) {
      const displayLabel = linkText.trim() || safeUrl;
      const anchor = document.createElement('a');
      anchor.href = safeUrl;
      anchor.textContent = displayLabel;
      if (/^https?:/i.test(safeUrl)) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      if (sel && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        r.deleteContents();
        r.insertNode(anchor);
        const spaceNode = document.createTextNode(' ');
        if (anchor.nextSibling) {
          anchor.parentNode?.insertBefore(spaceNode, anchor.nextSibling);
        } else {
          anchor.parentNode?.appendChild(spaceNode);
        }
        r.setStartAfter(spaceNode);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    } else {
      document.execCommand('createLink', false, safeUrl);
    }

    setShowLinkPopover(false);
    setLinkError('');
    syncFromDom();
    refreshActiveFormats();
  };

  const removeLink = () => {
    focusEditor();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand('unlink');
    setShowLinkPopover(false);
    setLinkError('');
    syncFromDom();
    refreshActiveFormats();
  };

  const tryMarkdownSpaceTrigger = (): boolean => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== 3) return false;

    const textBefore = (node.textContent || '').slice(0, range.startOffset);
    let action: 'h2' | 'h3' | 'ul' | 'ol' | 'blockquote' | null = null;
    if (textBefore === '#') action = 'h2';
    else if (textBefore === '##') action = 'h3';
    else if (textBefore === '-' || textBefore === '*') action = 'ul';
    else if (textBefore === '1.') action = 'ol';
    else if (textBefore === '>') action = 'blockquote';

    if (!action) return false;

    // Ensure the text node is at the start of its block container
    const blockParent = node.parentElement;
    if (blockParent && blockParent !== el) {
      const fullBlockPrefix = (blockParent.textContent || '').slice(0, textBefore.length);
      if (fullBlockPrefix !== textBefore) return false;
    }

    const delRange = document.createRange();
    delRange.setStart(node, 0);
    delRange.setEnd(node, range.startOffset);
    sel.removeAllRanges();
    sel.addRange(delRange);
    document.execCommand('delete');

    if (action === 'h2' || action === 'h3' || action === 'blockquote') {
      document.execCommand('formatBlock', false, action);
    } else if (action === 'ul') {
      document.execCommand('insertUnorderedList');
    } else if (action === 'ol') {
      document.execCommand('insertOrderedList');
    }

    syncFromDom();
    refreshActiveFormats();
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (mod && key === 's') {
      e.preventDefault();
      syncFromDom();
      onShortcutSave?.();
      return;
    }

    if (mod && !e.altKey && !e.shiftKey) {
      if (key === 'b') {
        e.preventDefault();
        execCmd('bold');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        execCmd('italic');
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        execCmd('underline');
        return;
      }
      if (key === 'k') {
        e.preventDefault();
        openLinkPopover();
        return;
      }
      if (key === '\\') {
        e.preventDefault();
        handleClearFormatting();
        return;
      }
      if (key === 'z') {
        e.preventDefault();
        execCmd('undo');
        return;
      }
      if (key === 'y') {
        e.preventDefault();
        execCmd('redo');
        return;
      }
    }

    if (mod && e.shiftKey) {
      if (key === 'z') {
        e.preventDefault();
        execCmd('redo');
        return;
      }
      if (key === 'x') {
        e.preventDefault();
        execCmd('strikeThrough');
        return;
      }
      if (e.code === 'Digit7' || key === '7') {
        e.preventDefault();
        execCmd('insertOrderedList');
        return;
      }
      if (e.code === 'Digit8' || key === '8') {
        e.preventDefault();
        execCmd('insertUnorderedList');
        return;
      }
      if (e.code === 'Digit9' || key === '9') {
        e.preventDefault();
        setBlockType('blockquote');
        return;
      }
    }

    if (mod && e.altKey) {
      if (e.code === 'Digit1' || key === '1') {
        e.preventDefault();
        setBlockType('h2');
        return;
      }
      if (e.code === 'Digit2' || key === '2') {
        e.preventDefault();
        setBlockType('h3');
        return;
      }
      if (e.code === 'Digit0' || key === '0') {
        e.preventDefault();
        setBlockType('p');
        return;
      }
    }

    if (e.key === ' ' && !mod && !e.altKey) {
      if (tryMarkdownSpaceTrigger()) {
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const htmlData = e.clipboardData.getData('text/html');
    const plainData = e.clipboardData.getData('text/plain');
    if (!htmlData && !plainData) return;

    e.preventDefault();
    const insertable = htmlData
      ? sanitizeRichHtml(htmlData)
      : plainTextToEditableHtml(plainData);
    if (!insertable) return;

    try {
      document.execCommand('insertHTML', false, insertable);
    } catch {
      document.execCommand('insertText', false, plainData);
    }
    syncFromDom();
    refreshActiveFormats();
  };

  return (
    <div className="vistara-doc-editor-wrap">
      <style>{`
        .vistara-doc-editor-wrap {
          display: flex;
          flex-direction: column;
          border: 1px solid #DFD4F3;
          border-radius: 14px;
          background: #FFFFFF;
          overflow: hidden;
        }
        .vistara-doc-toolbar {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.45rem 0.65rem;
          background: #FAF8FF;
          border-bottom: 1px solid #E5DDF5;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .vistara-doc-toolbar::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 900px) {
          .vistara-doc-toolbar {
            flex-wrap: wrap;
            overflow-x: visible;
          }
        }
        .vistara-tb-sep {
          width: 1px;
          height: 22px;
          background: #E2D9F3;
          margin: 0 0.2rem;
          flex-shrink: 0;
        }
        .vistara-tb-btn {
          min-width: 38px;
          height: 38px;
          padding: 0 0.5rem;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--charcoal);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          cursor: pointer;
          flex-shrink: 0;
          white-space: nowrap;
          font-family: var(--font-header);
          font-size: 0.78rem;
          font-weight: 600;
          transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
        }
        @media (max-width: 767px) {
          .vistara-tb-btn {
            min-width: 40px;
            height: 40px;
          }
        }
        .vistara-tb-btn:hover {
          background: #EDE6F8;
          color: var(--deep-violet);
        }
        .vistara-tb-btn[aria-pressed='true'] {
          background: #EBE2FA;
          border-color: #C7B2EA;
          color: var(--deep-violet);
        }
        .vistara-tb-select {
          height: 38px;
          padding: 0 0.55rem;
          border-radius: 8px;
          border: 1px solid #DFD4F3;
          background: #FFFFFF;
          color: var(--deep-violet);
          font-family: var(--font-header);
          font-size: 0.78rem;
          font-weight: 700;
          flex-shrink: 0;
          cursor: pointer;
        }
        .vistara-doc-surface-box {
          position: relative;
          background: #FFFFFF;
        }
        .vistara-doc-placeholder {
          position: absolute;
          top: 1.15rem;
          left: 1.25rem;
          right: 1.25rem;
          pointer-events: none;
          color: #9A90B0;
          font-size: 0.96rem;
          line-height: 1.75;
          user-select: none;
        }
        .vistara-doc-editable {
          width: 100%;
          padding: 1.15rem 1.25rem 1.75rem;
          outline: none;
          color: var(--charcoal);
          font-family: var(--font-body);
          font-size: 0.98rem;
          line-height: 1.85;
          word-break: break-word;
        }
        .vistara-doc-editable p {
          margin: 0 0 0.9rem;
        }
        .vistara-doc-editable h2 {
          font-family: var(--font-display);
          font-size: 1.32rem;
          font-weight: 800;
          color: var(--deep-violet);
          line-height: 1.3;
          margin: 1.35rem 0 0.55rem;
        }
        .vistara-doc-editable h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--deep-violet);
          line-height: 1.35;
          margin: 1.1rem 0 0.45rem;
        }
        .vistara-doc-editable ul,
        .vistara-doc-editable ol {
          margin: 0.4rem 0 0.95rem;
          padding-left: 1.45rem;
        }
        .vistara-doc-editable ul {
          list-style-type: disc;
        }
        .vistara-doc-editable ol {
          list-style-type: decimal;
        }
        .vistara-doc-editable li {
          margin-bottom: 0.3rem;
        }
        .vistara-doc-editable blockquote {
          margin: 0.95rem 0;
          padding: 0.85rem 1.05rem;
          border-radius: 10px;
          background: #FAF8FF;
          border: 1px solid #E5DDF5;
          color: var(--deep-violet);
          font-style: italic;
        }
        .vistara-doc-editable a {
          color: var(--vistara-purple);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .vistara-doc-editable hr {
          border: none;
          border-top: 1px solid #E5DDF5;
          margin: 1.25rem 0;
        }
        .vistara-doc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.55rem 0.95rem;
          background: #FAF8FF;
          border-top: 1px solid #EDE6F8;
          font-family: var(--font-header);
          font-size: 0.74rem;
          color: var(--mid-grey);
        }
      `}</style>

      {label && (
        <div
          style={{
            padding: '0.55rem 0.9rem 0',
            fontFamily: 'var(--font-header)',
            fontSize: '0.73rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'var(--vistara-purple)',
            background: '#FAF8FF',
          }}
        >
          {label}
        </div>
      )}

      {/* Calm Docs-Inspired Toolbar */}
      <div className="vistara-doc-toolbar" role="toolbar" aria-label="Alat pemformatan teks">
        <select
          aria-label="Gaya blok teks"
          className="vistara-tb-select"
          value={formats.block === 'blockquote' ? 'p' : formats.block}
          onChange={(e) => setBlockType(e.target.value as 'p' | 'h2' | 'h3')}
        >
          <option value="p">Paragraf</option>
          <option value="h2">Subjudul H2</option>
          <option value="h3">Bagian H3</option>
        </select>

        <span className="vistara-tb-sep" aria-hidden="true" />

        <button
          type="button"
          className="vistara-tb-btn"
          title="Tebal (Ctrl+B)"
          aria-label="Tebal (Ctrl+B)"
          aria-pressed={formats.bold}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('bold')}
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Miring (Ctrl+I)"
          aria-label="Miring (Ctrl+I)"
          aria-pressed={formats.italic}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('italic')}
        >
          <Italic size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Garis Bawah (Ctrl+U)"
          aria-label="Garis Bawah (Ctrl+U)"
          aria-pressed={formats.underline}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('underline')}
        >
          <Underline size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Coret (Ctrl+Shift+X)"
          aria-label="Coret (Ctrl+Shift+X)"
          aria-pressed={formats.strike}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('strikeThrough')}
        >
          <Strikethrough size={16} />
        </button>

        <span className="vistara-tb-sep" aria-hidden="true" />

        <button
          type="button"
          className="vistara-tb-btn"
          title="Daftar Poin (Ctrl+Shift+8)"
          aria-label="Daftar Poin (Ctrl+Shift+8)"
          aria-pressed={formats.ul}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('insertUnorderedList')}
        >
          <List size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Daftar Bernomor (Ctrl+Shift+7)"
          aria-label="Daftar Bernomor (Ctrl+Shift+7)"
          aria-pressed={formats.ol}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('insertOrderedList')}
        >
          <ListOrdered size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Kutipan (Ctrl+Shift+9)"
          aria-label="Kutipan (Ctrl+Shift+9)"
          aria-pressed={formats.block === 'blockquote'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setBlockType('blockquote')}
        >
          <Quote size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Garis Pemisah"
          aria-label="Garis Pemisah"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('insertHorizontalRule')}
        >
          <Minus size={16} />
        </button>

        <span className="vistara-tb-sep" aria-hidden="true" />

        <button
          type="button"
          className="vistara-tb-btn"
          title="Sisipkan Tautan (Ctrl+K)"
          aria-label="Sisipkan Tautan (Ctrl+K)"
          aria-pressed={formats.link || showLinkPopover}
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkPopover}
        >
          <Link2 size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Hapus Format (Ctrl+\)"
          aria-label="Hapus Format (Ctrl+\)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearFormatting}
        >
          <RemoveFormatting size={16} />
        </button>

        <span className="vistara-tb-sep" aria-hidden="true" />

        <button
          type="button"
          className="vistara-tb-btn"
          title="Undo (Ctrl+Z)"
          aria-label="Undo (Ctrl+Z)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('undo')}
        >
          <Undo2 size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          aria-label="Redo (Ctrl+Y)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCmd('redo')}
        >
          <Redo2 size={16} />
        </button>

        <button
          type="button"
          className="vistara-tb-btn"
          title="Daftar Pintasan Keyboard"
          aria-label="Daftar Pintasan Keyboard"
          aria-pressed={showShortcuts}
          onClick={() => {
            setShowLinkPopover(false);
            setShowShortcuts((v) => !v);
          }}
        >
          <Keyboard size={16} />
          <span style={{ fontSize: '0.73rem' }}>Pintasan</span>
        </button>
      </div>

      {/* Inline Link Popover (Never window.prompt) */}
      {showLinkPopover && (
        <div
          role="region"
          aria-label="Sisipkan atau sunting tautan"
          style={{
            padding: '0.75rem 0.9rem',
            background: '#F5F0FC',
            borderBottom: '1px solid #DFD4F3',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: '0.55rem',
          }}
        >
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.2rem' }}>
              URL Tautan
            </label>
            <input
              type="url"
              placeholder="https://vistara.sch.id atau /beranda/aspirasi"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                setLinkError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                } else if (e.key === 'Escape') {
                  setShowLinkPopover(false);
                }
              }}
              style={{
                width: '100%',
                minHeight: '40px',
                padding: '0.4rem 0.7rem',
                borderRadius: '8px',
                border: '1px solid #CBB8EB',
                background: '#FFFFFF',
                fontSize: '0.84rem',
              }}
            />
          </div>

          {!linkText && (
            <div style={{ flex: '1 1 150px', minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.2rem' }}>
                Teks Tampilan
              </label>
              <input
                type="text"
                placeholder="Klik di sini"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '40px',
                  padding: '0.4rem 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid #CBB8EB',
                  background: '#FFFFFF',
                  fontSize: '0.84rem',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={applyLink}
              className="btn btn-primary btn-sm"
              style={{ minHeight: '40px' }}
            >
              <Check size={14} /> Terapkan
            </button>
            {formats.link && (
              <button
                type="button"
                onClick={removeLink}
                className="btn btn-outline btn-sm"
                style={{ minHeight: '40px' }}
              >
                <Unlink size={14} /> Lepas
              </button>
            )}
            <button
              type="button"
              aria-label="Tutup panel tautan"
              onClick={() => setShowLinkPopover(false)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid #D4BFEF',
                background: '#FFFFFF',
                color: 'var(--mid-grey)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {linkError && (
            <div style={{ width: '100%', fontSize: '0.76rem', color: '#C62828', fontWeight: 600 }}>
              {linkError}
            </div>
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Reference Panel */}
      {showShortcuts && (
        <div
          role="region"
          aria-label="Panduan pintasan keyboard editor"
          style={{
            padding: '0.85rem 1rem',
            background: '#FAF8FF',
            borderBottom: '1px solid #E5DDF5',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(265px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--vistara-purple)', marginBottom: '0.45rem' }}>
              Pintasan Word / Google Docs
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {SHORTCUT_ITEMS.map((item) => (
                <div key={item.keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', fontSize: '0.76rem', color: 'var(--charcoal)' }}>
                  <span style={{ minWidth: 0, lineHeight: 1.35 }}>{item.desc}</span>
                  <kbd style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.69rem', lineHeight: 1.25, padding: '0.16rem 0.42rem', borderRadius: '5px', background: '#FFFFFF', border: '1px solid #DFD4F3', color: 'var(--deep-violet)', whiteSpace: 'nowrap' }}>
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--vistara-purple)' }}>
                Format Cepat Awal Baris
              </span>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                aria-label="Tutup panduan pintasan"
                style={{ border: 'none', background: 'transparent', color: 'var(--mid-grey)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {MARKDOWN_TRIGGERS.map((item) => (
                <div key={item.trigger} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', fontSize: '0.76rem', color: 'var(--charcoal)' }}>
                  <span style={{ minWidth: 0, lineHeight: 1.35 }}>{item.desc}</span>
                  <kbd style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.69rem', lineHeight: 1.25, padding: '0.16rem 0.42rem', borderRadius: '5px', background: '#FFFFFF', border: '1px solid #DFD4F3', color: 'var(--deep-violet)', whiteSpace: 'nowrap' }}>
                    {item.trigger}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Editable Sheet */}
      <div className="vistara-doc-surface-box">
        {isEmpty && (
          <div className="vistara-doc-placeholder" aria-hidden="true">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          contentEditable
          suppressContentEditableWarning
          className="vistara-doc-editable"
          style={{ minHeight: `${minHeight}px` }}
          onInput={() => {
            syncFromDom();
            refreshActiveFormats();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={syncFromDom}
        />
      </div>

      {/* Live Document Stats Bar */}
      <div className="vistara-doc-footer">
        <div className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span><strong style={{ color: 'var(--deep-violet)' }}>{stats.words}</strong> kata</span>
          <span>·</span>
          <span><strong style={{ color: 'var(--deep-violet)' }}>{stats.chars}</strong> karakter</span>
          {stats.words > 0 && (
            <>
              <span>·</span>
              <span>~{stats.readingMinutes} menit baca</span>
            </>
          )}
        </div>
        <div style={{ fontSize: '0.71rem', color: 'var(--mid-grey)' }}>
          Ctrl+B Tebal · Ctrl+I Miring · Ctrl+K Link · Ctrl+S Simpan
        </div>
      </div>
    </div>
  );
}
