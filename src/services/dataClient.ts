import {
  initialAspirasiData,
  initialPollingData,
  eventData,
  galeriData,
  beritaData,
} from '../data';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  AspirasiRecord,
  BeritaItem,
  EventItem,
  GaleriItem,
  PollingTopic,
} from '../types';

const ASPIRASI_CACHE_KEY = 'vistara_aspirasi_records_v1';
const POLLING_CACHE_KEY = 'vistara_polling_topics_v1';
const POLLING_VOTED_KEY = 'vistara_polling_voted_v1';
const REMINDER_CACHE_KEY = 'vistara_saved_events_v1';
const CLIENT_ID_KEY = 'vistara_client_id_v1';
const SYNC_CHANNEL_NAME = 'vistara_realtime_sync_v1';

export type SyncableTable =
  | 'aspirasi'
  | 'polling_topics'
  | 'polling_options'
  | 'events'
  | 'gallery'
  | 'berita';

export interface CreateAspirasiInput {
  jenis: AspirasiRecord['jenis'];
  kategori: string;
  judul: string;
  isi: string;
  isAnonim: boolean;
  namaPengirim?: string;
  kelasPengirim?: string;
}

function broadcastLocalSync(table: SyncableTable): void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
  try {
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.postMessage({ table, timestamp: Date.now() });
    channel.close();
  } catch {
    // ignore channel errors
  }
}

export function subscribeToTableChanges(
  table: SyncableTable | SyncableTable[],
  onChange: () => void
): () => void {
  const tables = Array.isArray(table) ? table : [table];
  const unsubscribers: Array<() => void> = [];

  if (supabase) {
    const channelName = `realtime:${tables.join('-')}:${Math.random().toString(36).slice(2, 8)}`;
    let channel = supabase.channel(channelName);
    for (const t of tables) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: t },
        () => {
          onChange();
        }
      );
    }
    channel.subscribe();

    unsubscribers.push(() => {
      supabase?.removeChannel(channel);
    });
  }

  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
    const handler = (event: MessageEvent<{ table?: SyncableTable }>) => {
      if (!event.data?.table || tables.includes(event.data.table)) {
        onChange();
      }
    };
    bc.addEventListener('message', handler);
    unsubscribers.push(() => {
      bc.removeEventListener('message', handler);
      bc.close();
    });
  }

  return () => {
    for (const unsub of unsubscribers) {
      unsub();
    }
  };
}

export function getReminderClientKey(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const created =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    return 'vistara-browser-session';
  }
}

function readAspirasiCache(): AspirasiRecord[] {
  try {
    const raw = localStorage.getItem(ASPIRASI_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore storage read error
  }
  return initialAspirasiData;
}

function writeAspirasiCache(records: AspirasiRecord[]): void {
  try {
    localStorage.setItem(ASPIRASI_CACHE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage write error
  }
}

function readPollingCache(): PollingTopic[] {
  try {
    const raw = localStorage.getItem(POLLING_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return initialPollingData;
}

function writePollingCache(polls: PollingTopic[]): void {
  try {
    localStorage.setItem(POLLING_CACHE_KEY, JSON.stringify(polls));
  } catch {
    // ignore
  }
}

export function getVotedPollMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(POLLING_VOTED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveVotedPollChoice(pollId: string, optionId: string): void {
  try {
    const map = getVotedPollMap();
    map[pollId] = optionId;
    localStorage.setItem(POLLING_VOTED_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function readReminderCache(): string[] {
  try {
    const raw = localStorage.getItem(REMINDER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function writeReminderCache(ids: string[]): void {
  try {
    localStorage.setItem(REMINDER_CACHE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

interface SupabaseAspirasiRow {
  id: string;
  kode_lacak: string;
  jenis: AspirasiRecord['jenis'];
  kategori: string;
  judul: string;
  isi: string;
  is_anonim: boolean;
  nama_pengirim?: string | null;
  kelas_pengirim?: string | null;
  tanggal: string;
  status: AspirasiRecord['status'];
  tanggapan_resmi?: string | null;
  penindaklanjut?: string | null;
  riwayat_status?: AspirasiRecord['riwayatStatus'];
}

function mapSupabaseAspirasiRow(row: SupabaseAspirasiRow): AspirasiRecord {
  return {
    id: row.id,
    kodeLacak: row.kode_lacak,
    jenis: row.jenis,
    kategori: row.kategori,
    judul: row.judul,
    isi: row.isi,
    isAnonim: Boolean(row.is_anonim),
    namaPengirim: row.nama_pengirim ?? undefined,
    kelasPengirim: row.kelas_pengirim ?? undefined,
    tanggal: row.tanggal,
    status: row.status,
    tanggapanResmi: row.tanggapan_resmi ?? undefined,
    penindaklanjut: row.penindaklanjut ?? undefined,
    riwayatStatus: Array.isArray(row.riwayat_status) ? row.riwayat_status : [],
  };
}

// ─── Aspirasi Operations ───────────────────────────────────────

export async function fetchAspirasi(): Promise<AspirasiRecord[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('aspirasi')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = (data as SupabaseAspirasiRow[]).map(mapSupabaseAspirasiRow);
        writeAspirasiCache(mapped);
        return mapped;
      }
    } catch {
      // fall through to Express API
    }
  }

  try {
    const res = await fetch('/api/aspirasi');
    if (res.ok) {
      const data = (await res.json()) as { records?: AspirasiRecord[] };
      if (Array.isArray(data.records)) {
        writeAspirasiCache(data.records);
        return data.records;
      }
    }
  } catch {
    // offline fallback
  }

  return readAspirasiCache();
}

export async function trackAspirasi(code: string): Promise<AspirasiRecord | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('aspirasi')
        .select('*')
        .ilike('kode_lacak', `%${cleanCode}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data[0]) {
        return mapSupabaseAspirasiRow(data[0] as SupabaseAspirasiRow);
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch(`/api/aspirasi/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = (await res.json()) as { record?: AspirasiRecord };
      if (data.record) return data.record;
    } else if (res.status === 404) {
      return null;
    }
  } catch {
    // offline fallback
  }

  const cached = readAspirasiCache();
  return (
    cached.find(
      (a) => a.kodeLacak.toUpperCase() === cleanCode || a.kodeLacak.toUpperCase().includes(cleanCode)
    ) ?? null
  );
}

export async function submitAspirasi(input: CreateAspirasiInput): Promise<AspirasiRecord> {
  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  if (supabase && isSupabaseConfigured) {
    try {
      const kodeLacak = `ASP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        id: `asp-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        kode_lacak: kodeLacak,
        jenis: input.jenis,
        kategori: input.kategori,
        judul: input.judul,
        isi: input.isi,
        is_anonim: input.isAnonim,
        nama_pengirim: input.isAnonim ? null : input.namaPengirim || 'Siswa MAM',
        kelas_pengirim: input.isAnonim ? null : input.kelasPengirim || '-',
        tanggal: todayStr,
        status: 'Diterima',
        tanggapan_resmi:
          'Aspirasi telah masuk ke sistem dan akan diverifikasi oleh Komisi 4 Aspirasi Siswa.',
        penindaklanjut: 'Komisi 4 OPDIM',
        riwayat_status: [
          {
            status: 'Diterima',
            waktu: todayStr,
            keterangan: 'Aspirasi berhasil dikirim dan tersimpan.',
          },
        ],
      };

      const { data, error } = await supabase
        .from('aspirasi')
        .insert(payload)
        .select('*')
        .single();

      if (!error && data) {
        const created = mapSupabaseAspirasiRow(data as SupabaseAspirasiRow);
        const current = readAspirasiCache();
        writeAspirasiCache([created, ...current.filter((item) => item.id !== created.id)]);
        broadcastLocalSync('aspirasi');
        return created;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/aspirasi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = (await res.json()) as { record: AspirasiRecord };
      const current = readAspirasiCache();
      writeAspirasiCache([data.record, ...current.filter((item) => item.id !== data.record.id)]);
      broadcastLocalSync('aspirasi');
      return data.record;
    }
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    if (errBody?.error) {
      throw new Error(errBody.error);
    }
  } catch (err) {
    if (err instanceof Error && err.message && !err.message.includes('fetch')) {
      throw err;
    }
  }

  const fallbackRecord: AspirasiRecord = {
    id: `asp-${Date.now()}`,
    kodeLacak: `ASP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    jenis: input.jenis,
    kategori: input.kategori,
    judul: input.judul,
    isi: input.isi,
    isAnonim: input.isAnonim,
    namaPengirim: input.isAnonim ? undefined : input.namaPengirim || 'Siswa MAM',
    kelasPengirim: input.isAnonim ? undefined : input.kelasPengirim || '-',
    tanggal: todayStr,
    status: 'Diterima',
    tanggapanResmi: 'Aspirasi telah masuk ke sistem dan akan diverifikasi oleh Komisi 4 Aspirasi Siswa.',
    penindaklanjut: 'Komisi 4 OPDIM',
    riwayatStatus: [
      {
        status: 'Diterima',
        waktu: todayStr,
        keterangan: 'Aspirasi berhasil dikirim melalui portal digital VISTARA Hub.',
      },
    ],
  };

  const current = readAspirasiCache();
  writeAspirasiCache([fallbackRecord, ...current]);
  broadcastLocalSync('aspirasi');
  return fallbackRecord;
}

export async function updateAspirasiStatus(
  kodeLacak: string,
  status: AspirasiRecord['status'],
  keterangan?: string
): Promise<AspirasiRecord> {
  const cleanCode = kodeLacak.trim().toUpperCase();
  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  if (supabase && isSupabaseConfigured) {
    try {
      const { data: existingRow } = await supabase
        .from('aspirasi')
        .select('*')
        .ilike('kode_lacak', cleanCode)
        .limit(1)
        .single();

      if (existingRow) {
        const mapped = mapSupabaseAspirasiRow(existingRow as SupabaseAspirasiRow);
        const updatedHistory = [
          ...(mapped.riwayatStatus || []),
          {
            status,
            waktu: todayStr,
            keterangan: keterangan || `Status diperbarui menjadi ${status} oleh pengurus Komisi 4.`,
          },
        ];

        const { data: updatedRow, error } = await supabase
          .from('aspirasi')
          .update({ status, riwayat_status: updatedHistory })
          .eq('id', mapped.id)
          .select('*')
          .single();

        if (!error && updatedRow) {
          const result = mapSupabaseAspirasiRow(updatedRow as SupabaseAspirasiRow);
          const current = readAspirasiCache();
          writeAspirasiCache(
            current.map((item) => (item.kodeLacak.toUpperCase() === cleanCode ? result : item))
          );
          broadcastLocalSync('aspirasi');
          return result;
        }
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch(`/api/aspirasi/${encodeURIComponent(cleanCode)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, keterangan }),
    });
    if (res.ok) {
      const data = (await res.json()) as { record: AspirasiRecord };
      const current = readAspirasiCache();
      writeAspirasiCache(
        current.map((item) =>
          item.kodeLacak.toUpperCase() === cleanCode ? data.record : item
        )
      );
      broadcastLocalSync('aspirasi');
      return data.record;
    }
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    if (errBody?.error) {
      throw new Error(errBody.error);
    }
  } catch (err) {
    if (err instanceof Error && err.message && !err.message.includes('fetch')) {
      throw err;
    }
  }

  const cached = readAspirasiCache();
  const existing = cached.find((item) => item.kodeLacak.toUpperCase() === cleanCode);
  if (!existing) {
    throw new Error('Aspirasi tidak ditemukan.');
  }

  const updated: AspirasiRecord = {
    ...existing,
    status,
    riwayatStatus: [
      ...(existing.riwayatStatus || []),
      {
        status,
        waktu: todayStr,
        keterangan: keterangan || `Status diperbarui menjadi ${status} oleh pengurus Komisi 4.`,
      },
    ],
  };

  writeAspirasiCache(
    cached.map((item) => (item.kodeLacak.toUpperCase() === cleanCode ? updated : item))
  );
  broadcastLocalSync('aspirasi');
  return updated;
}

// ─── Polling Operations ────────────────────────────────────────

interface SupabasePollingTopicRow {
  id: string;
  slug: string;
  question: string;
  description: string;
  category: string;
  status: 'active' | 'closed';
  closes_at: string;
}

interface SupabasePollingOptionRow {
  id: string;
  poll_id: string;
  label: string;
  votes: number;
  sort_order: number;
}

export async function fetchPolls(): Promise<PollingTopic[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const [{ data: topics, error: tErr }, { data: options, error: oErr }] = await Promise.all([
        supabase.from('polling_topics').select('*').order('created_at', { ascending: false }),
        supabase.from('polling_options').select('*').order('sort_order', { ascending: true }),
      ]);

      if (!tErr && !oErr && Array.isArray(topics) && topics.length > 0 && Array.isArray(options)) {
        const hydrated: PollingTopic[] = (topics as SupabasePollingTopicRow[]).map((t) => ({
          id: t.id,
          slug: t.slug,
          question: t.question,
          description: t.description,
          category: t.category,
          status: t.status,
          closesAt: t.closes_at,
          options: (options as SupabasePollingOptionRow[])
            .filter((o) => o.poll_id === t.id)
            .map((o) => ({ id: o.id, label: o.label, votes: Number(o.votes) })),
        }));
        writePollingCache(hydrated);
        return hydrated;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/polling');
    if (res.ok) {
      const data = (await res.json()) as { polls?: PollingTopic[] };
      if (Array.isArray(data.polls) && data.polls.length > 0) {
        writePollingCache(data.polls);
        return data.polls;
      }
    }
  } catch {
    // offline fallback
  }

  return readPollingCache();
}

export async function voteOnPoll(pollId: string, optionId: string): Promise<PollingTopic[]> {
  saveVotedPollChoice(pollId, optionId);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.rpc('cast_poll_vote', {
        p_poll_id: pollId,
        p_option_id: optionId,
      });
      if (!error) {
        const updated = await fetchPolls();
        broadcastLocalSync('polling_options');
        return updated;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch(`/api/polling/${encodeURIComponent(pollId)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) {
      const data = (await res.json()) as { polls?: PollingTopic[] };
      if (Array.isArray(data.polls)) {
        writePollingCache(data.polls);
        broadcastLocalSync('polling_options');
        return data.polls;
      }
    }
  } catch {
    // offline fallback
  }

  const current = readPollingCache();
  const next = current.map((poll) =>
    poll.id !== pollId
      ? poll
      : {
          ...poll,
          options: poll.options.map((opt) =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          ),
        }
  );
  writePollingCache(next);
  broadcastLocalSync('polling_options');
  return next;
}

// ─── Events, Gallery & Berita Supabase Sync ────────────────────

export async function fetchEvents(): Promise<EventItem[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as EventItem[];
      }
    } catch {
      // fall back to local data
    }
  }
  return eventData;
}

export async function fetchGaleri(): Promise<GaleriItem[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as Array<Record<string, unknown>>).map((row) => ({
          id: String(row.id),
          slug: String(row.slug),
          title: String(row.title),
          description: String(row.description),
          category: String(row.category),
          date: String(row.date),
          coverImage: String(row.cover_image ?? row.coverImage ?? ''),
          imageCount: Number(row.image_count ?? row.imageCount ?? 0),
        }));
      }
    } catch {
      // fall back to local data
    }
  }
  return galeriData;
}

export async function fetchGaleriBySlug(slug: string): Promise<GaleriItem | undefined> {
  const list = await fetchGaleri();
  return list.find((g) => g.slug === slug);
}

export async function fetchBerita(): Promise<BeritaItem[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .order('date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as BeritaItem[];
      }
    } catch {
      // fall back to local data
    }
  }
  return beritaData;
}

export async function fetchBeritaBySlug(slug: string): Promise<BeritaItem | undefined> {
  const list = await fetchBerita();
  return list.find((b) => b.slug === slug);
}

// ─── Event Reminders Operations ────────────────────────────────

export async function fetchSavedEventIds(): Promise<string[]> {
  const clientKey = getReminderClientKey();

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('event_reminders')
        .select('event_id')
        .eq('client_key', clientKey);

      if (!error && Array.isArray(data)) {
        const ids = (data as Array<{ event_id: string }>).map((r) => r.event_id);
        writeReminderCache(ids);
        return ids;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch(`/api/reminders?clientKey=${encodeURIComponent(clientKey)}`);
    if (res.ok) {
      const data = (await res.json()) as { eventIds?: string[] };
      if (Array.isArray(data.eventIds)) {
        writeReminderCache(data.eventIds);
        return data.eventIds;
      }
    }
  } catch {
    // offline fallback
  }

  return readReminderCache();
}

export async function toggleSavedEventId(
  eventId: string,
  currentlySaved: boolean
): Promise<string[]> {
  const clientKey = getReminderClientKey();

  if (supabase && isSupabaseConfigured) {
    try {
      if (currentlySaved) {
        await supabase
          .from('event_reminders')
          .delete()
          .eq('client_key', clientKey)
          .eq('event_id', eventId);
      } else {
        await supabase
          .from('event_reminders')
          .upsert({ client_key: clientKey, event_id: eventId });
      }
      return await fetchSavedEventIds();
    } catch {
      // fall through
    }
  }

  try {
    const res = currentlySaved
      ? await fetch(
          `/api/reminders/${encodeURIComponent(eventId)}?clientKey=${encodeURIComponent(clientKey)}`,
          { method: 'DELETE' }
        )
      : await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientKey, eventId }),
        });

    if (res.ok) {
      const data = (await res.json()) as { eventIds?: string[] };
      if (Array.isArray(data.eventIds)) {
        writeReminderCache(data.eventIds);
        return data.eventIds;
      }
    }
  } catch {
    // offline fallback
  }

  const cached = readReminderCache();
  const next = currentlySaved
    ? cached.filter((id) => id !== eventId)
    : Array.from(new Set([...cached, eventId]));
  writeReminderCache(next);
  return next;
}
