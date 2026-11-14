export interface SharePayload {
  title: string;
  summary?: string;
  url: string;
  tag?: string;
}

export function formatShareMessage({ title, summary, url, tag }: SharePayload): string {
  const header = tag ? `[${tag}] *${title}*` : `*${title}*`;
  const parts = [header];
  if (summary && summary.trim()) {
    parts.push(summary.trim());
  }
  parts.push(`Baca selengkapnya di VISTARA Hub:\n${url}`);
  return parts.join('\n\n');
}

export function buildWhatsAppShareUrl(payload: SharePayload): string {
  const message = formatShareMessage(payload);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export type ShareActionOutcome = 'shared' | 'copied' | 'unavailable';

export async function shareContent(payload: SharePayload): Promise<ShareActionOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.summary || payload.title,
        url: payload.url,
      });
      return 'shared';
    } catch (err) {
      // If user dismissed native share sheet, treat cleanly without noisy fallback error
      if (err instanceof Error && err.name === 'AbortError') {
        return 'shared';
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(payload.url);
      return 'copied';
    } catch {
      return 'unavailable';
    }
  }

  return 'unavailable';
}
