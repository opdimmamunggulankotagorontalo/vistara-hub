import type { BeritaItem, CustomNotificationItem, EventItem } from '../types';

export const TARA_NOTIF_ICON = '/tara-notif-icon.png';
export const TARA_NOTIF_BADGE = '/pwa-192x192.png';

const TARA_VAPID_PUBLIC_KEY =
  'BF51xr9J70q_iPwZvrQk9pbaO_xmR1orkiomC1NwkTneVqZng_wbgb9BntjCaTVQ37jtr563UbqZO6nstQcW-Dc';

function base64UrlToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

async function callTaraPushApi(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<unknown> {
  const baseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\\/+$/, '');
  const apiKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!baseUrl || !apiKey) {
    throw new Error('Konfigurasi layanan notifikasi VISTARA belum tersedia.');
  }

  const response = await fetch(`${baseUrl}/functions/v1/tara-push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const result = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(result.error || 'Layanan notifikasi TARA tidak dapat dihubungi.');
  }
  return result;
}

/**
 * Registers this browser/PWA installation with the Web Push service.
 * Must be called after the user has granted Notification permission.
 */
export async function ensureTaraPushSubscription(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const applicationServerKey = base64UrlToUint8Array(TARA_VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });
  }

  await callTaraPushApi('subscribe', { subscription: subscription.toJSON() });
  return true;
}

export async function unsubscribeTaraPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await callTaraPushApi('unsubscribe', { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}

const STORAGE_KEYS = {
  lastDailyDate: 'vistara_tara_last_daily_date_v1',
  lastDailyIndex: 'vistara_tara_last_daily_idx_v1',
  lastHolidayDate: 'vistara_tara_last_holiday_date_v1',
  shownCustomIds: 'vistara_tara_shown_custom_ids_v1',
  seenEventIds: 'vistara_tara_seen_event_ids_v1',
  seenBeritaIds: 'vistara_tara_seen_berita_ids_v1',
  notifOptOut: 'vistara_tara_notif_banner_dismissed_v1',
};

const DAILY_MOTIVATIONS: Array<{ title: string; body: string }> = [
  {
    title: 'Semangat Pagi dari TARA!',
    body: 'Awali harimu di madrasah dengan niat tulus dan senyum. Satu langkah kecil hari ini mendekatkanmu pada mimpi besar.',
  },
  {
    title: 'Pesan Penyemangat TARA',
    body: 'Belajar bukan soal siapa yang paling cepat, tapi siapa yang terus bertahan dan bertumbuh. Semangat terus, sobat VISTARA!',
  },
  {
    title: 'Catatan Harian TARA',
    body: 'Jangan ragu menyuarakan ide baikmu di Kotak Aspirasi. Satu gagasan darimu bisa membawa perubahan untuk seluruh siswa.',
  },
  {
    title: 'TARA Mengingatkanmu',
    body: 'Jaga fokus belajarmu, selipkan doa sebelum ujian atau tugas, dan jangan lupa saling menyemangati dengan teman sekelas!',
  },
  {
    title: 'Inspirasi Hari Ini · TARA',
    body: 'Kesuksesan dibangun dari kebiasaan baik yang diulang setiap hari. Tetap disiplin, rendah hati, dan penuh semangat!',
  },
  {
    title: 'Halo Pejuang Ilmu!',
    body: 'Lelah itu wajar, menyerah jangan. Ambil jeda sebentar, minum air putih, lalu lanjutkan lagi dengan hati yang tenang.',
  },
  {
    title: 'Semangat Berkarya · OPDIM VISTARA',
    body: 'Setiap prestasi dimulai dari keberanian mencoba. Cek agenda event dan kompetisi terbaru di aplikasi OPDIM VISTARA!',
  },
  {
    title: 'Sapaan Hangat TARA',
    body: 'Ilmu yang bermanfaat lahir dari adab yang baik dan hati yang bersih. Semoga harimu penuh keberkahan dan kemudahan.',
  },
];

const HOLIDAY_MESSAGES: Array<{ title: string; body: string }> = [
  {
    title: 'Selamat Hari Libur dari TARA!',
    body: 'Gunakan waktu liburmu sebaik-baiknya untuk beristirahat cukup, berkumpul bersama keluarga, dan menyegarkan pikiran.',
  },
  {
    title: 'Waktunya Istirahat Berkualitas',
    body: 'Hari libur tiba! Kurangi begadang, jaga kesehatan, dan manfaatkan waktu luangmu untuk hal positif yang membuatmu bahagia.',
  },
  {
    title: 'Pesan Akhir Pekan TARA',
    body: 'Setelah sepekan penuh belajar, tubuh dan pikiranmu berhak beristirahat. Nikmati hari liburmu dengan kegiatan bermanfaat!',
  },
];

// Curated Indonesian national & madrasah holiday dates (YYYY-MM-DD) for 2026–2027
const HOLIDAY_DATES = new Set<string>([
  '2026-01-01',
  '2026-01-16',
  '2026-02-17',
  '2026-03-19',
  '2026-03-20',
  '2026-03-21',
  '2026-04-03',
  '2026-05-01',
  '2026-05-14',
  '2026-05-27',
  '2026-05-31',
  '2026-06-01',
  '2026-06-16',
  '2026-08-17',
  '2026-08-25',
  '2026-12-25',
  '2027-01-01',
  '2027-01-05',
  '2027-02-06',
  '2027-03-09',
  '2027-03-10',
  '2027-03-26',
  '2027-05-01',
  '2027-05-06',
  '2027-05-17',
  '2027-05-20',
  '2027-06-01',
  '2027-06-06',
  '2027-08-14',
  '2027-08-17',
  '2027-12-25',
]);

function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isHolidayToday(date = new Date()): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true;
  return HOLIDAY_DATES.has(getLocalDateKey(date));
}

function readStringSet(key: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : null;
  } catch {
    return null;
  }
}

function writeStringSet(key: string, values: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(values).slice(-250)));
  } catch {
    // ignore storage errors
  }
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestTaraNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await ensureTaraPushSubscription();
  }
  return result;
}

export interface ShowTaraNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  targetPath?: string;
}

export async function showTaraNotification(payload: ShowTaraNotificationPayload): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const targetPath = payload.targetPath || '/beranda';
  const options: NotificationOptions = {
    body: payload.body,
    icon: TARA_NOTIF_ICON,
    badge: TARA_NOTIF_BADGE,
    tag: payload.tag || `tara-${Date.now()}`,
    data: { url: targetPath },
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
      ]);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(payload.title, options);
        return true;
      }
    }
  } catch {
    // fall through to window Notification
  }

  try {
    const notif = new Notification(payload.title, options);
    notif.onclick = () => {
      window.focus();
      if (targetPath && window.location.pathname !== targetPath) {
        window.location.assign(targetPath);
      }
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}

export async function evaluateDailyAndHolidayNotification(): Promise<void> {
  if (getNotificationPermissionState() !== 'granted') return;
  const now = new Date();
  const todayKey = getLocalDateKey(now);

  try {
    if (isHolidayToday(now)) {
      const lastHoliday = localStorage.getItem(STORAGE_KEYS.lastHolidayDate);
      if (lastHoliday === todayKey) return;
      const pick = HOLIDAY_MESSAGES[Math.floor(Math.random() * HOLIDAY_MESSAGES.length)];
      const sent = await showTaraNotification({
        title: pick.title,
        body: pick.body,
        tag: `tara-holiday-${todayKey}`,
        targetPath: '/beranda',
      });
      if (sent) {
        localStorage.setItem(STORAGE_KEYS.lastHolidayDate, todayKey);
      }
      return;
    }

    const lastDaily = localStorage.getItem(STORAGE_KEYS.lastDailyDate);
    if (lastDaily === todayKey) return;
    const prevIdx = Number(localStorage.getItem(STORAGE_KEYS.lastDailyIndex) ?? -1);
    let nextIdx = Math.floor(Math.random() * DAILY_MOTIVATIONS.length);
    if (DAILY_MOTIVATIONS.length > 1 && nextIdx === prevIdx) {
      nextIdx = (nextIdx + 1) % DAILY_MOTIVATIONS.length;
    }
    const pick = DAILY_MOTIVATIONS[nextIdx];
    const sent = await showTaraNotification({
      title: pick.title,
      body: pick.body,
      tag: `tara-daily-${todayKey}`,
      targetPath: '/beranda',
    });
    if (sent) {
      localStorage.setItem(STORAGE_KEYS.lastDailyDate, todayKey);
      localStorage.setItem(STORAGE_KEYS.lastDailyIndex, String(nextIdx));
    }
  } catch {
    // ignore storage errors
  }
}

export async function syncCustomTaraNotifications(items: CustomNotificationItem[]): Promise<void> {
  if (getNotificationPermissionState() !== 'granted') return;
  const shown = readStringSet(STORAGE_KEYS.shownCustomIds) ?? new Set<string>();
  const todayIso = getLocalDateKey();
  let changed = false;

  for (const item of items) {
    if (!item.isActive) continue;
    if (item.expiresAt && item.expiresAt < todayIso) continue;
    if (shown.has(item.id)) continue;

    const sent = await showTaraNotification({
      title: item.title,
      body: item.message,
      tag: `tara-custom-${item.id}`,
      targetPath: item.targetPath || '/beranda',
    });
    if (sent) {
      shown.add(item.id);
      changed = true;
    }
  }

  if (changed) {
    writeStringSet(STORAGE_KEYS.shownCustomIds, shown);
  }
}

export async function syncNewContentNotifications(params: {
  events: EventItem[];
  berita: BeritaItem[];
}): Promise<void> {
  const seenEvents = readStringSet(STORAGE_KEYS.seenEventIds);
  const seenBerita = readStringSet(STORAGE_KEYS.seenBeritaIds);

  // First run: record baseline IDs without flooding old items
  if (!seenEvents) {
    writeStringSet(STORAGE_KEYS.seenEventIds, new Set(params.events.map((e) => e.id)));
  } else {
    const newEvents = params.events.filter((e) => !seenEvents.has(e.id));
    if (newEvents.length > 0) {
      if (getNotificationPermissionState() === 'granted') {
        const latest = newEvents[0];
        await showTaraNotification({
          title: `Event Baru: ${latest.title}`,
          body: `${latest.date} · ${latest.location}. Ketuk untuk lihat detail agenda OPDIM!`,
          tag: `tara-event-${latest.id}`,
          targetPath: '/beranda/event',
        });
      }
      for (const e of newEvents) seenEvents.add(e.id);
      writeStringSet(STORAGE_KEYS.seenEventIds, seenEvents);
    }
  }

  if (!seenBerita) {
    writeStringSet(STORAGE_KEYS.seenBeritaIds, new Set(params.berita.map((b) => b.id)));
  } else {
    const newBerita = params.berita.filter((b) => !seenBerita.has(b.id));
    if (newBerita.length > 0) {
      if (getNotificationPermissionState() === 'granted') {
        const latest = newBerita[0];
        await showTaraNotification({
          title: `Berita Baru: ${latest.title}`,
          body: latest.excerpt || 'Kabar terbaru dari OPDIM VISTARA telah terbit. Yuk baca sekarang!',
          tag: `tara-berita-${latest.id}`,
          targetPath: `/beranda/berita/${latest.slug}`,
        });
      }
      for (const b of newBerita) seenBerita.add(b.id);
      writeStringSet(STORAGE_KEYS.seenBeritaIds, seenBerita);
    }
  }
}

export function isNotifBannerDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.notifOptOut) === '1';
  } catch {
    return false;
  }
}

export function setNotifBannerDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.notifOptOut, '1');
  } catch {
    // ignore
  }
}
