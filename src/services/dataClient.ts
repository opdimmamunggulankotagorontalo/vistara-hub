import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  AdminAccount,
  AdminRole,
  AdminSession,
  AnggotaLevel,
  AnggotaOpdim,
  AnggotaUnit,
  ArsipItem,
  AspirasiRecord,
  BeritaItem,
  EventItem,
  GaleriItem,
  PollingTopic,
  PrestasiItem,
} from '../types';
import { INITIAL_ANGGOTA_OPDIM } from '../data/anggotaSeed';
import {
  ADMIN_ROLES_META,
  formatBytesReadable,
  normalizeUsername,
  slugifyText,
} from '../utils/adminAuth';
import { blobToDataUrl, convertImageToWebp1080p } from '../utils/imageOptimizer';

const ASPIRASI_CACHE_KEY = 'vistara_aspirasi_records_v3';
const POLLING_CACHE_KEY = 'vistara_polling_topics_v3';
const EVENTS_CACHE_KEY = 'vistara_events_v2';
const GALLERY_CACHE_KEY = 'vistara_gallery_v2';
const BERITA_CACHE_KEY = 'vistara_berita_v2';
const ARSIP_CACHE_KEY = 'vistara_arsip_v2';
const PRESTASI_CACHE_KEY = 'vistara_prestasi_v1';
const ANGGOTA_CACHE_KEY = 'vistara_anggota_opdim_v1';

const POLLING_VOTED_KEY = 'vistara_polling_voted_v2';
const REMINDER_CACHE_KEY = 'vistara_saved_events_v2';
const CLIENT_ID_KEY = 'vistara_client_id_v1';
const ADMIN_SESSION_KEY = 'vistara_admin_session_v2';
const ADMIN_AUTH_PROVIDER_KEY = 'vistara_admin_auth_provider_v2';
const SYNC_CHANNEL_NAME = 'vistara_realtime_sync_v1';

const LEGACY_DUMMY_ASPIRASI_IDS = new Set(['asp-1', 'asp-2', 'asp-3', 'asp-4']);
const LEGACY_DUMMY_POLL_IDS = new Set(['poll-1', 'poll-2']);

// Purge legacy dummy-seeded caches and old PIN sessions if present
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('vistara_aspirasi_records_v1');
    window.localStorage.removeItem('vistara_aspirasi_records_v2');
    window.localStorage.removeItem('vistara_polling_topics_v1');
    window.localStorage.removeItem('vistara_polling_topics_v2');
    window.sessionStorage.removeItem('vistara_admin_session_v1');
  } catch {
    // ignore storage access issues
  }
}

export type SyncableTable =
  | 'aspirasi'
  | 'polling_topics'
  | 'polling_options'
  | 'events'
  | 'gallery'
  | 'berita'
  | 'arsip'
  | 'prestasi'
  | 'anggota_opdim';

export interface CreateAspirasiInput {
  jenis: AspirasiRecord['jenis'];
  kategori: string;
  judul: string;
  isi: string;
  isAnonim: boolean;
  namaPengirim?: string;
  kelasPengirim?: string;
}

export interface CreateAdminAccountInput {
  username: string;
  fullName: string;
  jabatan: string;
  role: AdminRole;
  password: string;
  mustChangePassword?: boolean;
}

export interface UpdateAdminAccountInput {
  username?: string;
  fullName?: string;
  jabatan?: string;
  role?: AdminRole;
  isActive?: boolean;
  newPassword?: string;
  mustChangePassword?: boolean;
}

export interface UploadedMediaResult {
  url: string;
  sizeText: string;
  isWebpOptimized: boolean;
  width?: number;
  height?: number;
  originalSizeText?: string;
}

function readCacheArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch {
    // ignore cache error
  }
  return [];
}

function writeCacheArray<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore cache error
  }
}

const FALLBACK_TABLES_KEY = 'vistara_local_fallback_tables_v1';

function isLocalFallbackTable(table: SyncableTable): boolean {
  try {
    const raw = localStorage.getItem(FALLBACK_TABLES_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.includes(table);
  } catch {
    return false;
  }
}

function markLocalFallbackTable(table: SyncableTable, active: boolean): void {
  try {
    const raw = localStorage.getItem(FALLBACK_TABLES_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    const set = new Set(Array.isArray(parsed) ? parsed : []);
    if (active) set.add(table);
    else set.delete(table);
    localStorage.setItem(FALLBACK_TABLES_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore storage errors
  }
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

// ─── Admin Account Session & RBAC Authentication ──────────────

type AuthProvider = 'supabase' | 'express';

export type AdminAuthBackendMode =
  | 'supabase-ready'
  | 'supabase-missing-rpc'
  | 'supabase-unreachable'
  | 'local-only';

export interface AdminAuthDiagnostics {
  mode: AdminAuthBackendMode;
  supabaseConfigured: boolean;
  activeProvider: AuthProvider | 'none';
  title: string;
  detail: string;
}

function getStoredAuthProvider(): AuthProvider {
  try {
    const val = sessionStorage.getItem(ADMIN_AUTH_PROVIDER_KEY);
    return val === 'supabase' ? 'supabase' : 'express';
  } catch {
    return 'express';
  }
}

export function getStoredAuthProviderMode(): AuthProvider {
  return getStoredAuthProvider();
}

function saveAuthProvider(provider: AuthProvider): void {
  try {
    sessionStorage.setItem(ADMIN_AUTH_PROVIDER_KEY, provider);
  } catch {
    // ignore
  }
}

export function getStoredAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.role || !parsed?.token || !parsed?.accountId || !parsed?.username) return null;
    if (Date.now() - parsed.loggedInAt > 1000 * 60 * 60 * 12) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_AUTH_PROVIDER_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAdminSession(session: AdminSession): void {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_PROVIDER_KEY);
  } catch {
    // ignore
  }
}

function adminHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const resolvedToken = token || getStoredAdminSession()?.token;
  if (resolvedToken) {
    headers['X-Admin-Token'] = resolvedToken;
  }
  return headers;
}

function isSupabaseRpcMissing(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  const code = String(err.code || '').toUpperCase();
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    msg.includes('could not find the function') ||
    msg.includes('does not exist')
  );
}

function isSupabaseNetworkError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed');
}

export async function checkAdminBackendDiagnostics(): Promise<AdminAuthDiagnostics> {
  const hasSession = Boolean(getStoredAdminSession());
  const storedProvider: AuthProvider | 'none' = hasSession ? getStoredAuthProvider() : 'none';

  if (!supabase || !isSupabaseConfigured) {
    return {
      mode: 'local-only',
      supabaseConfigured: false,
      activeProvider: storedProvider,
      title: 'Supabase Belum Terkonfigurasi (Mode Lokal)',
      detail:
        'Variabel VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY tidak aktif pada build ini. Akun lokal SQLite tidak dapat digunakan di Vercel — pasang kedua env tersebut di Vercel Project Settings lalu Redeploy.',
    };
  }

  try {
    const { error } = await supabase.rpc('admin_validate_session', { p_token: '__probe__' });
    if (!error || (!isSupabaseRpcMissing(error) && !isSupabaseNetworkError(error))) {
      return {
        mode: 'supabase-ready',
        supabaseConfigured: true,
        activeProvider: hasSession ? storedProvider : 'supabase',
        title: 'Supabase Cloud Terhubung',
        detail:
          'Autentikasi dan pengelolaan akun terhubung langsung ke Supabase Cloud sehingga tersinkron di AI Studio maupun Vercel.',
      };
    }

    if (isSupabaseRpcMissing(error)) {
      return {
        mode: 'supabase-missing-rpc',
        supabaseConfigured: true,
        activeProvider: storedProvider,
        title: 'Skema RPC Admin Supabase Belum Terpasang',
        detail:
          'Project Supabase terhubung, tetapi fungsi RPC admin_login & admin_create_account belum ditemukan. Jalankan isi file supabase/schema.sql di Supabase SQL Editor.',
      };
    }

    return {
      mode: 'supabase-unreachable',
      supabaseConfigured: true,
      activeProvider: storedProvider,
      title: 'Server Supabase Tidak Dapat Dijangkau',
      detail:
        'Gagal menghubungi server Supabase. Periksa koneksi internet atau konfigurasi URL project Supabase.',
    };
  } catch {
    return {
      mode: 'supabase-unreachable',
      supabaseConfigured: true,
      activeProvider: storedProvider,
      title: 'Server Supabase Tidak Dapat Dijangkau',
      detail:
        'Gagal menghubungi server Supabase. Periksa koneksi internet atau konfigurasi URL project Supabase.',
    };
  }
}

function mapSupabaseAccountRow(row: Record<string, unknown>): AdminAccount {
  return {
    id: String(row.id),
    username: String(row.username),
    fullName: String(row.full_name ?? row.fullName ?? ''),
    jabatan: String(row.jabatan ?? ''),
    role: String(row.role) as AdminRole,
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
    mustChangePassword: Boolean(row.must_change_password ?? row.mustChangePassword ?? false),
    createdAt: (row.created_at ?? row.createdAt ?? '') as number | string,
    updatedAt: (row.updated_at ?? row.updatedAt ?? '') as number | string,
    lastLoginAt: (row.last_login_at ?? row.lastLoginAt ?? null) as number | string | null,
  };
}

export async function loginAdminAccount(username: string, password: string): Promise<AdminSession> {
  const cleanUser = normalizeUsername(username);
  if (!cleanUser || !password) {
    throw new Error('Username dan password wajib diisi.');
  }

  if (supabase && isSupabaseConfigured) {
    let data: unknown = null;
    let error: { code?: string; message?: string } | null = null;
    try {
      const rpcRes = await supabase.rpc('admin_login', {
        p_username: cleanUser,
        p_password: password,
      });
      data = rpcRes.data;
      error = rpcRes.error;
    } catch (err) {
      throw new Error(
        err instanceof Error && !isSupabaseNetworkError(err)
          ? err.message
          : 'Gagal menghubungi server autentikasi Supabase. Periksa koneksi internet Anda.'
      );
    }

    if (error) {
      if (isSupabaseRpcMissing(error)) {
        throw new Error(
          'Fungsi autentikasi Supabase (admin_login) belum terpasang. Jalankan file supabase/schema.sql di Supabase SQL Editor agar akun tersinkron ke Vercel.'
        );
      }
      if (isSupabaseNetworkError(error)) {
        throw new Error('Gagal menghubungi server autentikasi Supabase. Periksa koneksi internet Anda.');
      }
      throw new Error(error.message || 'Username atau password tidak sesuai.');
    }

    const rows = Array.isArray(data) ? data : [];
    const row = rows[0] as
      | {
          account_id: string;
          username: string;
          full_name: string;
          jabatan: string;
          role: AdminRole;
          token: string;
          must_change_password: boolean;
        }
      | undefined;

    if (!row) {
      throw new Error('Username atau password tidak sesuai.');
    }

    const session: AdminSession = {
      accountId: row.account_id,
      username: row.username,
      fullName: row.full_name,
      jabatan: row.jabatan,
      role: row.role,
      roleLabel: ADMIN_ROLES_META[row.role]?.label || 'Pengurus OPDIM',
      token: row.token,
      mustChangePassword: Boolean(row.must_change_password),
      loggedInAt: Date.now(),
    };
    saveAuthProvider('supabase');
    saveAdminSession(session);
    return session;
  }

  const res = await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: cleanUser, password }),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Server login lokal tidak tersedia di hosting statis Vercel. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di Vercel Environment Variables lalu Redeploy.'
    );
  }
  const body = (await res.json().catch(() => null)) as { session?: AdminSession; error?: string } | null;
  if (!res.ok || !body?.session) {
    throw new Error(body?.error || 'Username atau password tidak sesuai.');
  }
  saveAuthProvider('express');
  saveAdminSession(body.session);
  return body.session;
}

export async function verifyAdminSession(): Promise<AdminSession | null> {
  const stored = getStoredAdminSession();
  if (!stored) return null;
  const provider = getStoredAuthProvider();

  if (supabase && isSupabaseConfigured) {
    if (provider !== 'supabase') {
      clearAdminSession();
      return null;
    }
    try {
      const { data, error } = await supabase.rpc('admin_validate_session', {
        p_token: stored.token,
      });
      if (!error && Array.isArray(data)) {
        if (!data[0]) {
          clearAdminSession();
          return null;
        }
        const row = data[0] as {
          account_id: string;
          username: string;
          full_name: string;
          jabatan: string;
          role: AdminRole;
          must_change_password: boolean;
        };
        const refreshed: AdminSession = {
          ...stored,
          accountId: row.account_id,
          username: row.username,
          fullName: row.full_name,
          jabatan: row.jabatan,
          role: row.role,
          roleLabel: ADMIN_ROLES_META[row.role]?.label || stored.roleLabel,
          mustChangePassword: Boolean(row.must_change_password),
        };
        saveAdminSession(refreshed);
        return refreshed;
      }
    } catch {
      return stored;
    }
    return stored;
  }

  try {
    const res = await fetch('/api/admin/auth/session', {
      headers: adminHeaders(stored.token),
    });
    if (res.status === 401 || res.status === 403) {
      clearAdminSession();
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = (await res.json()) as { session?: AdminSession };
      if (data.session) {
        saveAdminSession(data.session);
        return data.session;
      }
    }
  } catch {
    // keep session if offline transiently
  }

  return stored;
}

export async function logoutAdminSession(): Promise<void> {
  const stored = getStoredAdminSession();
  const provider = getStoredAuthProvider();
  if (stored?.token) {
    if (provider === 'supabase' && supabase && isSupabaseConfigured) {
      try {
        await supabase.rpc('admin_logout', { p_token: stored.token });
      } catch {
        // ignore
      }
    } else {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: adminHeaders(stored.token),
        });
      } catch {
        // ignore
      }
    }
  }
  clearAdminSession();
}

export async function changeOwnAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<AdminSession> {
  const stored = getStoredAdminSession();
  if (!stored) {
    throw new Error('Sesi admin tidak ditemukan. Silakan masuk kembali.');
  }

  if (supabase && isSupabaseConfigured) {
    if (getStoredAuthProvider() !== 'supabase') {
      throw new Error('Sesi bukan berasal dari Supabase Cloud. Silakan keluar dan masuk kembali.');
    }
    const { data, error } = await supabase.rpc('admin_change_own_password', {
      p_token: stored.token,
      p_current_password: currentPassword,
      p_new_password: newPassword,
    });
    if (error) {
      throw new Error(error.message || 'Gagal memperbarui password akun.');
    }
    const row = Array.isArray(data) ? (data[0] as { token?: string } | undefined) : undefined;
    if (!row?.token) {
      throw new Error('Gagal memperbarui token sesi setelah ganti password.');
    }
    const updated: AdminSession = {
      ...stored,
      token: row.token,
      mustChangePassword: false,
      loggedInAt: Date.now(),
    };
    saveAdminSession(updated);
    return updated;
  }

  const res = await fetch('/api/admin/auth/change-password', {
    method: 'POST',
    headers: adminHeaders(stored.token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const body = (await res.json().catch(() => null)) as { session?: AdminSession; error?: string } | null;
  if (!res.ok || !body?.session) {
    throw new Error(body?.error || 'Gagal memperbarui password akun.');
  }
  saveAdminSession(body.session);
  return body.session;
}

export async function fetchAdminAccounts(): Promise<AdminAccount[]> {
  const stored = getStoredAdminSession();
  if (!stored) throw new Error('Sesi admin tidak valid.');
  const provider = getStoredAuthProvider();

  if (supabase && isSupabaseConfigured) {
    if (provider !== 'supabase') {
      throw new Error('Sesi berasal dari database lokal sementara. Keluar lalu masuk kembali agar terhubung ke Supabase Cloud.');
    }
    const { data, error } = await supabase.rpc('admin_list_accounts', {
      p_token: stored.token,
    });
    if (error) {
      throw new Error(error.message || 'Gagal memuat daftar akun admin.');
    }
    return ((data as Array<Record<string, unknown>>) || []).map(mapSupabaseAccountRow);
  }

  const res = await fetch('/api/admin/accounts', { headers: adminHeaders(stored.token) });
  const body = (await res.json().catch(() => null)) as { accounts?: AdminAccount[]; error?: string } | null;
  if (!res.ok || !Array.isArray(body?.accounts)) {
    throw new Error(body?.error || 'Gagal memuat daftar akun admin.');
  }
  return body.accounts;
}

export async function createAdminAccount(input: CreateAdminAccountInput): Promise<AdminAccount> {
  const stored = getStoredAdminSession();
  if (!stored) throw new Error('Sesi admin tidak valid.');
  const provider = getStoredAuthProvider();

  if (supabase && isSupabaseConfigured) {
    if (provider !== 'supabase') {
      throw new Error('Akun hanya dapat dibuat via Supabase Cloud agar dapat dipakai di Vercel. Keluar lalu masuk kembali.');
    }
    const { data, error } = await supabase.rpc('admin_create_account', {
      p_token: stored.token,
      p_username: normalizeUsername(input.username),
      p_full_name: input.fullName.trim(),
      p_jabatan: input.jabatan.trim(),
      p_role: input.role,
      p_password: input.password,
      p_must_change: input.mustChangePassword !== false,
    });
    if (error) {
      throw new Error(error.message || 'Gagal membuat akun pengurus.');
    }
    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
    if (!row) throw new Error('Gagal menerima data akun baru.');
    return mapSupabaseAccountRow(row);
  }

  const res = await fetch('/api/admin/accounts', {
    method: 'POST',
    headers: adminHeaders(stored.token),
    body: JSON.stringify({
      ...input,
      username: normalizeUsername(input.username),
      fullName: input.fullName.trim(),
      jabatan: input.jabatan.trim(),
    }),
  });
  const body = (await res.json().catch(() => null)) as { account?: AdminAccount; error?: string } | null;
  if (!res.ok || !body?.account) {
    throw new Error(body?.error || 'Gagal membuat akun pengurus.');
  }
  return body.account;
}

export async function updateAdminAccount(
  accountId: string,
  input: UpdateAdminAccountInput
): Promise<AdminAccount> {
  const stored = getStoredAdminSession();
  if (!stored) throw new Error('Sesi admin tidak valid.');
  const provider = getStoredAuthProvider();

  if (supabase && isSupabaseConfigured) {
    if (provider !== 'supabase') {
      throw new Error('Perubahan akun hanya dapat dilakukan via Supabase Cloud. Keluar lalu masuk kembali.');
    }
    const { data, error } = await supabase.rpc('admin_update_account', {
      p_token: stored.token,
      p_account_id: accountId,
      p_username: input.username !== undefined ? normalizeUsername(input.username) : null,
      p_full_name: input.fullName !== undefined ? input.fullName.trim() : null,
      p_jabatan: input.jabatan !== undefined ? input.jabatan.trim() : null,
      p_role: input.role ?? null,
      p_is_active: input.isActive !== undefined ? input.isActive : null,
      p_new_password: input.newPassword ? input.newPassword : null,
      p_must_change: input.mustChangePassword !== undefined ? input.mustChangePassword : null,
    });
    if (error) {
      throw new Error(error.message || 'Gagal memperbarui akun pengurus.');
    }
    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
    if (!row) throw new Error('Akun pengurus tidak ditemukan.');
    return mapSupabaseAccountRow(row);
  }

  const res = await fetch(`/api/admin/accounts/${encodeURIComponent(accountId)}`, {
    method: 'PATCH',
    headers: adminHeaders(stored.token),
    body: JSON.stringify({
      ...input,
      username: input.username !== undefined ? normalizeUsername(input.username) : undefined,
    }),
  });
  const body = (await res.json().catch(() => null)) as { account?: AdminAccount; error?: string } | null;
  if (!res.ok || !body?.account) {
    throw new Error(body?.error || 'Gagal memperbarui akun pengurus.');
  }
  return body.account;
}

export async function deleteAdminAccount(accountId: string): Promise<void> {
  const stored = getStoredAdminSession();
  if (!stored) throw new Error('Sesi admin tidak valid.');
  const provider = getStoredAuthProvider();

  if (supabase && isSupabaseConfigured) {
    if (provider !== 'supabase') {
      throw new Error('Penghapusan akun hanya dapat dilakukan via Supabase Cloud. Keluar lalu masuk kembali.');
    }
    const { error } = await supabase.rpc('admin_delete_account', {
      p_token: stored.token,
      p_account_id: accountId,
    });
    if (error) {
      throw new Error(error.message || 'Gagal menghapus akun pengurus.');
    }
    return;
  }

  const res = await fetch(`/api/admin/accounts/${encodeURIComponent(accountId)}`, {
    method: 'DELETE',
    headers: adminHeaders(stored.token),
  });
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(body?.error || 'Gagal menghapus akun pengurus.');
  }
}

// ─── Media Upload + Auto 1080p WebP Optimization ─────────────

export async function uploadOptimizedMedia(
  file: File,
  folder: 'berita' | 'galeri' | 'events' | 'arsip' | 'anggota' | 'prestasi'
): Promise<UploadedMediaResult> {
  const isImage = file.type.startsWith('image/');
  let uploadBlob: Blob = file;
  let uploadName = file.name;
  let mimeType = file.type || 'application/octet-stream';
  let width: number | undefined;
  let height: number | undefined;
  let originalSizeText: string | undefined;

  if (isImage) {
    const optimized = await convertImageToWebp1080p(file, 0.82);
    uploadBlob = optimized.blob;
    uploadName = optimized.fileName;
    mimeType = 'image/webp';
    width = optimized.width;
    height = optimized.height;
    originalSizeText = optimized.originalSizeText;
  }

  const sizeText = formatBytesReadable(uploadBlob.size);

  if (supabase && isSupabaseConfigured) {
    try {
      const cleanName = uploadName.replace(/[^a-zA-Z0-9._-]/g, '-');
      const objectPath = `${folder}/${Date.now()}-${cleanName}`;
      const { error } = await supabase.storage
        .from('vistara-media')
        .upload(objectPath, uploadBlob, {
          contentType: mimeType,
          upsert: false,
        });

      if (!error) {
        const { data: pubData } = supabase.storage
          .from('vistara-media')
          .getPublicUrl(objectPath);
        if (pubData?.publicUrl) {
          return {
            url: pubData.publicUrl,
            sizeText,
            isWebpOptimized: isImage,
            width,
            height,
            originalSizeText,
          };
        }
      }
    } catch {
      // fall through to Express /api/upload
    }
  }

  const dataUrl = await blobToDataUrl(uploadBlob);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        folder,
        fileName: uploadName,
        mimeType,
        base64: dataUrl,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { url: string; sizeText?: string };
      return {
        url: data.url,
        sizeText: data.sizeText || sizeText,
        isWebpOptimized: isImage,
        width,
        height,
        originalSizeText,
      };
    }
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    if (errBody?.error && res.status < 500) {
      throw new Error(errBody.error);
    }
  } catch (err) {
    if (err instanceof Error && !err.message.includes('fetch')) {
      throw err;
    }
  }

  return {
    url: dataUrl,
    sizeText,
    isWebpOptimized: isImage,
    width,
    height,
    originalSizeText,
  };
}

// ─── Aspirasi Operations ───────────────────────────────────────

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

function purgeLegacyDummyAspirasiFromSupabase(rows: SupabaseAspirasiRow[]): void {
  if (!supabase || !isSupabaseConfigured) return;
  const legacyIds = rows.filter((r) => LEGACY_DUMMY_ASPIRASI_IDS.has(r.id)).map((r) => r.id);
  if (legacyIds.length > 0) {
    void supabase.from('aspirasi').delete().in('id', legacyIds);
  }
}

export async function fetchAspirasi(): Promise<AspirasiRecord[]> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('aspirasi')) {
    try {
      const { data, error } = await supabase
        .from('aspirasi')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const rawRows = data as SupabaseAspirasiRow[];
        purgeLegacyDummyAspirasiFromSupabase(rawRows);
        const mapped = rawRows
          .filter((r) => !LEGACY_DUMMY_ASPIRASI_IDS.has(r.id))
          .map(mapSupabaseAspirasiRow);
        if (mapped.length > 0) {
          writeCacheArray(ASPIRASI_CACHE_KEY, mapped);
          return mapped;
        }
        // If Supabase returned empty or only legacy dummy rows, keep cache clean and still check local fallback if needed
        writeCacheArray(ASPIRASI_CACHE_KEY, []);
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/aspirasi');
    if (res.ok) {
      const data = (await res.json()) as { records?: AspirasiRecord[] };
      if (Array.isArray(data.records)) {
        const cleaned = data.records.filter((r) => !LEGACY_DUMMY_ASPIRASI_IDS.has(r.id));
        writeCacheArray(ASPIRASI_CACHE_KEY, cleaned);
        return cleaned;
      }
    }
  } catch {
    // offline fallback
  }

  return readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY).filter(
    (r) => !LEGACY_DUMMY_ASPIRASI_IDS.has(r.id)
  );
}

export async function trackAspirasi(code: string): Promise<AspirasiRecord | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('aspirasi')) {
    try {
      const { data, error } = await supabase
        .from('aspirasi')
        .select('*')
        .ilike('kode_lacak', `%${cleanCode}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data[0]) {
        const row = data[0] as SupabaseAspirasiRow;
        if (!LEGACY_DUMMY_ASPIRASI_IDS.has(row.id)) {
          return mapSupabaseAspirasiRow(row);
        }
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch(`/api/aspirasi/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = (await res.json()) as { record?: AspirasiRecord };
      if (data.record && !LEGACY_DUMMY_ASPIRASI_IDS.has(data.record.id)) {
        return data.record;
      }
    } else if (res.status === 404) {
      return null;
    }
  } catch {
    // offline fallback
  }

  const cached = readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY).filter(
    (r) => !LEGACY_DUMMY_ASPIRASI_IDS.has(r.id)
  );
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
        markLocalFallbackTable('aspirasi', false);
        const created = mapSupabaseAspirasiRow(data as SupabaseAspirasiRow);
        const current = readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY);
        writeCacheArray(ASPIRASI_CACHE_KEY, [created, ...current.filter((item) => item.id !== created.id)]);
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
      markLocalFallbackTable('aspirasi', true);
      const data = (await res.json()) as { record: AspirasiRecord };
      const current = readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY);
      writeCacheArray(ASPIRASI_CACHE_KEY, [data.record, ...current.filter((item) => item.id !== data.record.id)]);
      broadcastLocalSync('aspirasi');
      return data.record;
    }
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    if (errBody?.error) throw new Error(errBody.error);
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

  const current = readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY);
  writeCacheArray(ASPIRASI_CACHE_KEY, [fallbackRecord, ...current]);
  broadcastLocalSync('aspirasi');
  return fallbackRecord;
}

export async function updateAspirasiAdmin(params: {
  kodeLacak: string;
  status: AspirasiRecord['status'];
  tanggapanResmi?: string;
  penindaklanjut?: string;
  keterangan?: string;
}): Promise<AspirasiRecord> {
  const cleanCode = params.kodeLacak.trim().toUpperCase();
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
            status: params.status,
            waktu: todayStr,
            keterangan:
              params.keterangan || `Status diperbarui menjadi ${params.status} oleh pengurus Komisi 4.`,
          },
        ];

        const { data: updatedRow, error } = await supabase
          .from('aspirasi')
          .update({
            status: params.status,
            tanggapan_resmi: params.tanggapanResmi ?? mapped.tanggapanResmi ?? null,
            penindaklanjut: params.penindaklanjut ?? mapped.penindaklanjut ?? null,
            riwayat_status: updatedHistory,
          })
          .eq('id', mapped.id)
          .select('*')
          .single();

        if (!error && updatedRow) {
          const result = mapSupabaseAspirasiRow(updatedRow as SupabaseAspirasiRow);
          const current = readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY);
          writeCacheArray(
            ASPIRASI_CACHE_KEY,
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
      headers: adminHeaders(),
      body: JSON.stringify({
        status: params.status,
        keterangan: params.keterangan,
        tanggapanResmi: params.tanggapanResmi,
        penindaklanjut: params.penindaklanjut,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { record: AspirasiRecord };
      const current = readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY);
      writeCacheArray(
        ASPIRASI_CACHE_KEY,
        current.map((item) => (item.kodeLacak.toUpperCase() === cleanCode ? data.record : item))
      );
      broadcastLocalSync('aspirasi');
      return data.record;
    }
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    if (errBody?.error) throw new Error(errBody.error);
  } catch (err) {
    if (err instanceof Error && !err.message.includes('fetch')) throw err;
  }

  const cached = readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY);
  const existing = cached.find((item) => item.kodeLacak.toUpperCase() === cleanCode);
  if (!existing) throw new Error('Aspirasi tidak ditemukan.');

  const updated: AspirasiRecord = {
    ...existing,
    status: params.status,
    tanggapanResmi: params.tanggapanResmi ?? existing.tanggapanResmi,
    penindaklanjut: params.penindaklanjut ?? existing.penindaklanjut,
    riwayatStatus: [
      ...(existing.riwayatStatus || []),
      {
        status: params.status,
        waktu: todayStr,
        keterangan: params.keterangan || `Status diperbarui menjadi ${params.status}.`,
      },
    ],
  };
  writeCacheArray(
    ASPIRASI_CACHE_KEY,
    cached.map((item) => (item.kodeLacak.toUpperCase() === cleanCode ? updated : item))
  );
  broadcastLocalSync('aspirasi');
  return updated;
}

export async function deleteAspirasi(id: string): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('aspirasi').delete().eq('id', id);
    } catch {
      // ignore
    }
  }
  try {
    await fetch(`/api/aspirasi/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  const current = readCacheArray<AspirasiRecord>(ASPIRASI_CACHE_KEY);
  writeCacheArray(
    ASPIRASI_CACHE_KEY,
    current.filter((item) => item.id !== id)
  );
  broadcastLocalSync('aspirasi');
}

export async function clearAllAspirasi(): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('aspirasi').delete().neq('id', '');
    } catch {
      // ignore
    }
  }
  try {
    await fetch('/api/aspirasi', {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  writeCacheArray(ASPIRASI_CACHE_KEY, []);
  broadcastLocalSync('aspirasi');
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

function purgeLegacyDummyPollsFromSupabase(rows: SupabasePollingTopicRow[]): void {
  if (!supabase || !isSupabaseConfigured) return;
  const legacyIds = rows.filter((r) => LEGACY_DUMMY_POLL_IDS.has(r.id)).map((r) => r.id);
  if (legacyIds.length > 0) {
    void supabase.from('polling_options').delete().in('poll_id', legacyIds);
    void supabase.from('polling_topics').delete().in('id', legacyIds);
  }
}

export async function fetchPolls(): Promise<PollingTopic[]> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('polling_topics')) {
    try {
      const [{ data: topics, error: tErr }, { data: options, error: oErr }] = await Promise.all([
        supabase.from('polling_topics').select('*').order('created_at', { ascending: false }),
        supabase.from('polling_options').select('*').order('sort_order', { ascending: true }),
      ]);

      if (!tErr && !oErr && Array.isArray(topics) && Array.isArray(options)) {
        const rawTopics = topics as SupabasePollingTopicRow[];
        purgeLegacyDummyPollsFromSupabase(rawTopics);
        const cleanTopics = rawTopics.filter((t) => !LEGACY_DUMMY_POLL_IDS.has(t.id));
        if (cleanTopics.length > 0) {
          const hydrated: PollingTopic[] = cleanTopics.map((t) => ({
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
          writeCacheArray(POLLING_CACHE_KEY, hydrated);
          return hydrated;
        }
        writeCacheArray(POLLING_CACHE_KEY, []);
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/polling');
    if (res.ok) {
      const data = (await res.json()) as { polls?: PollingTopic[] };
      if (Array.isArray(data.polls)) {
        const cleaned = data.polls.filter((p) => !LEGACY_DUMMY_POLL_IDS.has(p.id));
        writeCacheArray(POLLING_CACHE_KEY, cleaned);
        return cleaned;
      }
    }
  } catch {
    // offline fallback
  }

  return readCacheArray<PollingTopic>(POLLING_CACHE_KEY).filter(
    (p) => !LEGACY_DUMMY_POLL_IDS.has(p.id)
  );
}

export async function createPoll(input: {
  question: string;
  description: string;
  category: string;
  closesAt: string;
  options: string[];
}): Promise<PollingTopic[]> {
  const cleanOptions = input.options.map((o) => o.trim()).filter(Boolean);
  if (!input.question.trim() || !input.closesAt.trim() || cleanOptions.length < 2) {
    throw new Error('Pertanyaan, tanggal tutup, dan minimal 2 opsi wajib diisi.');
  }

  if (supabase && isSupabaseConfigured) {
    try {
      const pollId = `poll-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyText(input.question)}-${Math.floor(100 + Math.random() * 900)}`;
      const { error: tErr } = await supabase.from('polling_topics').insert({
        id: pollId,
        slug,
        question: input.question.trim(),
        description: input.description.trim() || input.question.trim(),
        category: input.category.trim() || 'Kegiatan Siswa',
        status: 'active',
        closes_at: input.closesAt.trim(),
      });
      if (!tErr) {
        const rows = cleanOptions.map((label, idx) => ({
          id: `${pollId}-opt-${idx + 1}`,
          poll_id: pollId,
          label,
          votes: 0,
          sort_order: idx + 1,
        }));
        await supabase.from('polling_options').insert(rows);
        markLocalFallbackTable('polling_topics', false);
        const latest = await fetchPolls();
        broadcastLocalSync('polling_topics');
        return latest;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch('/api/polling', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ ...input, options: cleanOptions }),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal membuat topik polling.');
  }
  markLocalFallbackTable('polling_topics', true);
  const data = (await res.json()) as { polls: PollingTopic[] };
  writeCacheArray(POLLING_CACHE_KEY, data.polls);
  broadcastLocalSync('polling_topics');
  return data.polls;
}

export async function updatePollStatus(
  pollId: string,
  status: 'active' | 'closed'
): Promise<PollingTopic[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('polling_topics')
        .update({ status })
        .eq('id', pollId);
      if (!error) {
        const latest = await fetchPolls();
        broadcastLocalSync('polling_topics');
        return latest;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch(`/api/polling/${encodeURIComponent(pollId)}/status`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal memperbarui status polling.');
  }
  const data = (await res.json()) as { polls: PollingTopic[] };
  writeCacheArray(POLLING_CACHE_KEY, data.polls);
  broadcastLocalSync('polling_topics');
  return data.polls;
}

export async function deletePoll(pollId: string): Promise<PollingTopic[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('polling_options').delete().eq('poll_id', pollId);
      await supabase.from('polling_topics').delete().eq('id', pollId);
      const latest = await fetchPolls();
      broadcastLocalSync('polling_topics');
      return latest;
    } catch {
      // fall through
    }
  }

  const res = await fetch(`/api/polling/${encodeURIComponent(pollId)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal menghapus polling.');
  }
  const data = (await res.json()) as { polls: PollingTopic[] };
  writeCacheArray(POLLING_CACHE_KEY, data.polls);
  broadcastLocalSync('polling_topics');
  return data.polls;
}

export async function clearAllPolls(): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('polling_options').delete().neq('id', '');
      await supabase.from('polling_topics').delete().neq('id', '');
    } catch {
      // ignore
    }
  }
  try {
    await fetch('/api/polling', {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  writeCacheArray(POLLING_CACHE_KEY, []);
  broadcastLocalSync('polling_topics');
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
        writeCacheArray(POLLING_CACHE_KEY, data.polls);
        broadcastLocalSync('polling_options');
        return data.polls;
      }
    }
  } catch {
    // offline fallback
  }

  const current = readCacheArray<PollingTopic>(POLLING_CACHE_KEY);
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
  writeCacheArray(POLLING_CACHE_KEY, next);
  broadcastLocalSync('polling_options');
  return next;
}

// ─── Events Operations ─────────────────────────────────────────

export async function fetchEvents(): Promise<EventItem[]> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('events')) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const items = data as EventItem[];
        writeCacheArray(EVENTS_CACHE_KEY, items);
        return items;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/events');
    if (res.ok) {
      const data = (await res.json()) as { records?: EventItem[] };
      if (Array.isArray(data.records)) {
        writeCacheArray(EVENTS_CACHE_KEY, data.records);
        return data.records;
      }
    }
  } catch {
    // offline fallback
  }

  return readCacheArray<EventItem>(EVENTS_CACHE_KEY);
}

export async function createEvent(input: Omit<EventItem, 'id' | 'slug'>): Promise<EventItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const id = `evt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyText(input.title)}-${Math.floor(100 + Math.random() * 900)}`;
      const { data, error } = await supabase
        .from('events')
        .insert({
          id,
          slug,
          title: input.title,
          description: input.description,
          date: input.date,
          time: input.time,
          location: input.location,
          category: input.category,
          status: input.status,
          thumbnail: input.thumbnail ?? null,
        })
        .select('*')
        .single();
      if (!error && data) {
        markLocalFallbackTable('events', false);
        const created = data as EventItem;
        const curr = readCacheArray<EventItem>(EVENTS_CACHE_KEY);
        writeCacheArray(EVENTS_CACHE_KEY, [created, ...curr]);
        broadcastLocalSync('events');
        return created;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch('/api/events', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal menyimpan event.');
  }
  markLocalFallbackTable('events', true);
  const data = (await res.json()) as { record: EventItem };
  const curr = readCacheArray<EventItem>(EVENTS_CACHE_KEY);
  writeCacheArray(EVENTS_CACHE_KEY, [data.record, ...curr]);
  broadcastLocalSync('events');
  return data.record;
}

export async function updateEvent(id: string, input: Omit<EventItem, 'id' | 'slug'>): Promise<EventItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          title: input.title,
          description: input.description,
          date: input.date,
          time: input.time,
          location: input.location,
          category: input.category,
          status: input.status,
          thumbnail: input.thumbnail ?? null,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (!error && data) {
        const updated = data as EventItem;
        const curr = readCacheArray<EventItem>(EVENTS_CACHE_KEY);
        writeCacheArray(EVENTS_CACHE_KEY, curr.map((e) => (e.id === id ? updated : e)));
        broadcastLocalSync('events');
        return updated;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal memperbarui event.');
  }
  const data = (await res.json()) as { record: EventItem };
  const curr = readCacheArray<EventItem>(EVENTS_CACHE_KEY);
  writeCacheArray(EVENTS_CACHE_KEY, curr.map((e) => (e.id === id ? data.record : e)));
  broadcastLocalSync('events');
  return data.record;
}

export async function deleteEvent(id: string): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    await supabase.from('events').delete().eq('id', id);
  }
  try {
    await fetch(`/api/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  const curr = readCacheArray<EventItem>(EVENTS_CACHE_KEY);
  writeCacheArray(EVENTS_CACHE_KEY, curr.filter((e) => e.id !== id));
  broadcastLocalSync('events');
}

// ─── Galeri Operations ─────────────────────────────────────────

function mapSupabaseGaleriRow(row: Record<string, unknown>): GaleriItem {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    date: String(row.date),
    coverImage: String(row.cover_image ?? row.coverImage ?? ''),
    imageCount: Number(row.image_count ?? row.imageCount ?? 0),
  };
}

export async function fetchGaleri(): Promise<GaleriItem[]> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('gallery')) {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = (data as Array<Record<string, unknown>>).map(mapSupabaseGaleriRow);
        writeCacheArray(GALLERY_CACHE_KEY, mapped);
        return mapped;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/galeri');
    if (res.ok) {
      const data = (await res.json()) as { records?: GaleriItem[] };
      if (Array.isArray(data.records)) {
        writeCacheArray(GALLERY_CACHE_KEY, data.records);
        return data.records;
      }
    }
  } catch {
    // offline fallback
  }

  return readCacheArray<GaleriItem>(GALLERY_CACHE_KEY);
}

export async function fetchGaleriBySlug(slug: string): Promise<GaleriItem | undefined> {
  const list = await fetchGaleri();
  return list.find((g) => g.slug === slug);
}

export async function createGaleri(input: Omit<GaleriItem, 'id' | 'slug'>): Promise<GaleriItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const id = `gal-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyText(input.title)}-${Math.floor(100 + Math.random() * 900)}`;
      const { data, error } = await supabase
        .from('gallery')
        .insert({
          id,
          slug,
          title: input.title,
          description: input.description,
          category: input.category,
          date: input.date,
          cover_image: input.coverImage || '',
          image_count: input.imageCount || 1,
        })
        .select('*')
        .single();
      if (!error && data) {
        markLocalFallbackTable('gallery', false);
        const created = mapSupabaseGaleriRow(data as Record<string, unknown>);
        const curr = readCacheArray<GaleriItem>(GALLERY_CACHE_KEY);
        writeCacheArray(GALLERY_CACHE_KEY, [created, ...curr]);
        broadcastLocalSync('gallery');
        return created;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch('/api/galeri', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal menyimpan album galeri.');
  }
  markLocalFallbackTable('gallery', true);
  const data = (await res.json()) as { record: GaleriItem };
  const curr = readCacheArray<GaleriItem>(GALLERY_CACHE_KEY);
  writeCacheArray(GALLERY_CACHE_KEY, [data.record, ...curr]);
  broadcastLocalSync('gallery');
  return data.record;
}

export async function updateGaleri(id: string, input: Omit<GaleriItem, 'id' | 'slug'>): Promise<GaleriItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .update({
          title: input.title,
          description: input.description,
          category: input.category,
          date: input.date,
          cover_image: input.coverImage || '',
          image_count: input.imageCount || 1,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (!error && data) {
        const updated = mapSupabaseGaleriRow(data as Record<string, unknown>);
        const curr = readCacheArray<GaleriItem>(GALLERY_CACHE_KEY);
        writeCacheArray(GALLERY_CACHE_KEY, curr.map((g) => (g.id === id ? updated : g)));
        broadcastLocalSync('gallery');
        return updated;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch(`/api/galeri/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal memperbarui album galeri.');
  }
  const data = (await res.json()) as { record: GaleriItem };
  const curr = readCacheArray<GaleriItem>(GALLERY_CACHE_KEY);
  writeCacheArray(GALLERY_CACHE_KEY, curr.map((g) => (g.id === id ? data.record : g)));
  broadcastLocalSync('gallery');
  return data.record;
}

export async function deleteGaleri(id: string): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    await supabase.from('gallery').delete().eq('id', id);
  }
  try {
    await fetch(`/api/galeri/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  const curr = readCacheArray<GaleriItem>(GALLERY_CACHE_KEY);
  writeCacheArray(GALLERY_CACHE_KEY, curr.filter((g) => g.id !== id));
  broadcastLocalSync('gallery');
}

// ─── Berita Operations ─────────────────────────────────────────

export async function fetchBerita(): Promise<BeritaItem[]> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('berita')) {
    try {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .order('date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const items = data as BeritaItem[];
        writeCacheArray(BERITA_CACHE_KEY, items);
        return items;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/berita');
    if (res.ok) {
      const data = (await res.json()) as { records?: BeritaItem[] };
      if (Array.isArray(data.records)) {
        writeCacheArray(BERITA_CACHE_KEY, data.records);
        return data.records;
      }
    }
  } catch {
    // offline fallback
  }

  return readCacheArray<BeritaItem>(BERITA_CACHE_KEY);
}

export async function fetchBeritaBySlug(slug: string): Promise<BeritaItem | undefined> {
  const list = await fetchBerita();
  return list.find((b) => b.slug === slug);
}

export async function createBerita(input: Omit<BeritaItem, 'id' | 'slug'>): Promise<BeritaItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const id = `berita-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyText(input.title)}-${Math.floor(100 + Math.random() * 900)}`;
      const { data, error } = await supabase
        .from('berita')
        .insert({
          id,
          slug,
          title: input.title,
          excerpt: input.excerpt,
          category: input.category,
          date: input.date,
          author: input.author,
          thumbnail: input.thumbnail ?? null,
          content: input.content ?? null,
        })
        .select('*')
        .single();
      if (!error && data) {
        markLocalFallbackTable('berita', false);
        const created = data as BeritaItem;
        const curr = readCacheArray<BeritaItem>(BERITA_CACHE_KEY);
        writeCacheArray(BERITA_CACHE_KEY, [created, ...curr]);
        broadcastLocalSync('berita');
        return created;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch('/api/berita', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal menerbitkan berita.');
  }
  markLocalFallbackTable('berita', true);
  const data = (await res.json()) as { record: BeritaItem };
  const curr = readCacheArray<BeritaItem>(BERITA_CACHE_KEY);
  writeCacheArray(BERITA_CACHE_KEY, [data.record, ...curr]);
  broadcastLocalSync('berita');
  return data.record;
}

export async function updateBerita(id: string, input: Omit<BeritaItem, 'id' | 'slug'>): Promise<BeritaItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('berita')
        .update({
          title: input.title,
          excerpt: input.excerpt,
          category: input.category,
          date: input.date,
          author: input.author,
          thumbnail: input.thumbnail ?? null,
          content: input.content ?? null,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (!error && data) {
        const updated = data as BeritaItem;
        const curr = readCacheArray<BeritaItem>(BERITA_CACHE_KEY);
        writeCacheArray(BERITA_CACHE_KEY, curr.map((b) => (b.id === id ? updated : b)));
        broadcastLocalSync('berita');
        return updated;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch(`/api/berita/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal memperbarui berita.');
  }
  const data = (await res.json()) as { record: BeritaItem };
  const curr = readCacheArray<BeritaItem>(BERITA_CACHE_KEY);
  writeCacheArray(BERITA_CACHE_KEY, curr.map((b) => (b.id === id ? data.record : b)));
  broadcastLocalSync('berita');
  return data.record;
}

export async function deleteBerita(id: string): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    await supabase.from('berita').delete().eq('id', id);
  }
  try {
    await fetch(`/api/berita/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  const curr = readCacheArray<BeritaItem>(BERITA_CACHE_KEY);
  writeCacheArray(BERITA_CACHE_KEY, curr.filter((b) => b.id !== id));
  broadcastLocalSync('berita');
}

// ─── Arsip Operations ──────────────────────────────────────────

function mapSupabaseArsipRow(row: Record<string, unknown>): ArsipItem {
  return {
    id: String(row.id),
    title: String(row.title),
    jenis: String(row.jenis) as ArsipItem['jenis'],
    tanggal: String(row.tanggal),
    ukuran: String(row.ukuran),
    deskripsi: String(row.deskripsi),
    fileUrl: row.file_url ? String(row.file_url) : row.fileUrl ? String(row.fileUrl) : undefined,
  };
}

export async function fetchArsip(): Promise<ArsipItem[]> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('arsip')) {
    try {
      const { data, error } = await supabase
        .from('arsip')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = (data as Array<Record<string, unknown>>).map(mapSupabaseArsipRow);
        writeCacheArray(ARSIP_CACHE_KEY, mapped);
        return mapped;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/arsip');
    if (res.ok) {
      const data = (await res.json()) as { records?: ArsipItem[] };
      if (Array.isArray(data.records)) {
        writeCacheArray(ARSIP_CACHE_KEY, data.records);
        return data.records;
      }
    }
  } catch {
    // offline fallback
  }

  return readCacheArray<ArsipItem>(ARSIP_CACHE_KEY);
}

export async function createArsip(input: Omit<ArsipItem, 'id'>): Promise<ArsipItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const id = `arsip-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const { data, error } = await supabase
        .from('arsip')
        .insert({
          id,
          title: input.title,
          jenis: input.jenis,
          tanggal: input.tanggal,
          ukuran: input.ukuran,
          deskripsi: input.deskripsi,
          file_url: input.fileUrl ?? null,
        })
        .select('*')
        .single();
      if (!error && data) {
        markLocalFallbackTable('arsip', false);
        const created = mapSupabaseArsipRow(data as Record<string, unknown>);
        const curr = readCacheArray<ArsipItem>(ARSIP_CACHE_KEY);
        writeCacheArray(ARSIP_CACHE_KEY, [created, ...curr]);
        broadcastLocalSync('arsip');
        return created;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch('/api/arsip', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal menerbitkan dokumen arsip.');
  }
  markLocalFallbackTable('arsip', true);
  const data = (await res.json()) as { record: ArsipItem };
  const curr = readCacheArray<ArsipItem>(ARSIP_CACHE_KEY);
  writeCacheArray(ARSIP_CACHE_KEY, [data.record, ...curr]);
  broadcastLocalSync('arsip');
  return data.record;
}

export async function updateArsip(id: string, input: Omit<ArsipItem, 'id'>): Promise<ArsipItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('arsip')
        .update({
          title: input.title,
          jenis: input.jenis,
          tanggal: input.tanggal,
          ukuran: input.ukuran,
          deskripsi: input.deskripsi,
          file_url: input.fileUrl ?? null,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (!error && data) {
        const updated = mapSupabaseArsipRow(data as Record<string, unknown>);
        const curr = readCacheArray<ArsipItem>(ARSIP_CACHE_KEY);
        writeCacheArray(ARSIP_CACHE_KEY, curr.map((a) => (a.id === id ? updated : a)));
        broadcastLocalSync('arsip');
        return updated;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch(`/api/arsip/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal memperbarui dokumen arsip.');
  }
  const data = (await res.json()) as { record: ArsipItem };
  const curr = readCacheArray<ArsipItem>(ARSIP_CACHE_KEY);
  writeCacheArray(ARSIP_CACHE_KEY, curr.map((a) => (a.id === id ? data.record : a)));
  broadcastLocalSync('arsip');
  return data.record;
}

export async function deleteArsip(id: string): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    await supabase.from('arsip').delete().eq('id', id);
  }
  try {
    await fetch(`/api/arsip/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  const curr = readCacheArray<ArsipItem>(ARSIP_CACHE_KEY);
  writeCacheArray(ARSIP_CACHE_KEY, curr.filter((a) => a.id !== id));
  broadcastLocalSync('arsip');
}

// ─── Prestasi Operations ───────────────────────────────────────

export async function fetchPrestasi(): Promise<PrestasiItem[]> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('prestasi')) {
    try {
      const { data, error } = await supabase
        .from('prestasi')
        .select('*')
        .order('tahun', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const items = data as PrestasiItem[];
        writeCacheArray(PRESTASI_CACHE_KEY, items);
        return items;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/prestasi');
    if (res.ok) {
      const data = (await res.json()) as { records?: PrestasiItem[] };
      if (Array.isArray(data.records)) {
        writeCacheArray(PRESTASI_CACHE_KEY, data.records);
        return data.records;
      }
    }
  } catch {
    // offline fallback
  }

  return readCacheArray<PrestasiItem>(PRESTASI_CACHE_KEY);
}

export async function fetchPrestasiBySlug(slug: string): Promise<PrestasiItem | undefined> {
  const list = await fetchPrestasi();
  return list.find((p) => p.slug === slug);
}

function isMissingColumnError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  const msg = String(error.message || '').toLowerCase();
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('column') ||
    msg.includes('schema cache')
  );
}

export async function createPrestasi(input: Omit<PrestasiItem, 'id' | 'slug'>): Promise<PrestasiItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const id = `prestasi-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${slugifyText(input.title)}-${Math.floor(100 + Math.random() * 900)}`;
      const baseRow = {
        id,
        slug,
        title: input.title,
        tingkat: input.tingkat,
        kategori: input.kategori,
        peraih: input.peraih,
        tahun: input.tahun,
        medali: input.medali,
        penyelenggara: input.penyelenggara,
      };
      const extendedRow = {
        ...baseRow,
        description: input.description ?? null,
        thumbnail: input.thumbnail ?? null,
      };
      let res = await supabase.from('prestasi').insert(extendedRow).select('*').single();
      if (res.error && isMissingColumnError(res.error)) {
        res = await supabase.from('prestasi').insert(baseRow).select('*').single();
      }
      if (!res.error && res.data) {
        markLocalFallbackTable('prestasi', false);
        const created: PrestasiItem = {
          ...(res.data as PrestasiItem),
          description: (res.data as PrestasiItem).description ?? input.description,
          thumbnail: (res.data as PrestasiItem).thumbnail ?? input.thumbnail,
        };
        const curr = readCacheArray<PrestasiItem>(PRESTASI_CACHE_KEY);
        writeCacheArray(PRESTASI_CACHE_KEY, [created, ...curr]);
        broadcastLocalSync('prestasi');
        return created;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch('/api/prestasi', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal menyimpan data prestasi.');
  }
  markLocalFallbackTable('prestasi', true);
  const data = (await res.json()) as { record: PrestasiItem };
  const curr = readCacheArray<PrestasiItem>(PRESTASI_CACHE_KEY);
  writeCacheArray(PRESTASI_CACHE_KEY, [data.record, ...curr]);
  broadcastLocalSync('prestasi');
  return data.record;
}

export async function updatePrestasi(
  id: string,
  input: Omit<PrestasiItem, 'id' | 'slug'>
): Promise<PrestasiItem> {
  if (supabase && isSupabaseConfigured) {
    try {
      const basePatch = {
        title: input.title,
        tingkat: input.tingkat,
        kategori: input.kategori,
        peraih: input.peraih,
        tahun: input.tahun,
        medali: input.medali,
        penyelenggara: input.penyelenggara,
      };
      const extendedPatch = {
        ...basePatch,
        description: input.description ?? null,
        thumbnail: input.thumbnail ?? null,
      };
      let res = await supabase.from('prestasi').update(extendedPatch).eq('id', id).select('*').single();
      if (res.error && isMissingColumnError(res.error)) {
        res = await supabase.from('prestasi').update(basePatch).eq('id', id).select('*').single();
      }
      if (!res.error && res.data) {
        const updated: PrestasiItem = {
          ...(res.data as PrestasiItem),
          description: (res.data as PrestasiItem).description ?? input.description,
          thumbnail: (res.data as PrestasiItem).thumbnail ?? input.thumbnail,
        };
        const curr = readCacheArray<PrestasiItem>(PRESTASI_CACHE_KEY);
        writeCacheArray(PRESTASI_CACHE_KEY, curr.map((p) => (p.id === id ? updated : p)));
        broadcastLocalSync('prestasi');
        return updated;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch(`/api/prestasi/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal memperbarui data prestasi.');
  }
  const data = (await res.json()) as { record: PrestasiItem };
  const curr = readCacheArray<PrestasiItem>(PRESTASI_CACHE_KEY);
  writeCacheArray(PRESTASI_CACHE_KEY, curr.map((p) => (p.id === id ? data.record : p)));
  broadcastLocalSync('prestasi');
  return data.record;
}

export async function deletePrestasi(id: string): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('prestasi').delete().eq('id', id);
    } catch {
      // ignore
    }
  }
  try {
    await fetch(`/api/prestasi/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  const curr = readCacheArray<PrestasiItem>(PRESTASI_CACHE_KEY);
  writeCacheArray(PRESTASI_CACHE_KEY, curr.filter((p) => p.id !== id));
  broadcastLocalSync('prestasi');
}

// ─── Anggota OPDIM Operations ──────────────────────────────────

function mapSupabaseAnggotaRow(row: Record<string, unknown>): AnggotaOpdim {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? row.fullName ?? ''),
    jabatan: String(row.jabatan ?? ''),
    unit: String(row.unit ?? 'komisi1') as AnggotaUnit,
    peranLevel: String(row.peran_level ?? row.peranLevel ?? 'anggota') as AnggotaLevel,
    tugasUtama: String(row.tugas_utama ?? row.tugasUtama ?? ''),
    fotoUrl: String(row.foto_url ?? row.fotoUrl ?? ''),
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 100),
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
  };
}

export async function fetchAnggotaOpdim(): Promise<AnggotaOpdim[]> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('anggota_opdim')) {
    try {
      const { data, error } = await supabase
        .from('anggota_opdim')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mapped = (data as Array<Record<string, unknown>>).map(mapSupabaseAnggotaRow);
        writeCacheArray(ANGGOTA_CACHE_KEY, mapped);
        return mapped;
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch('/api/anggota');
    if (res.ok) {
      const data = (await res.json()) as { records?: AnggotaOpdim[] };
      if (Array.isArray(data.records)) {
        writeCacheArray(ANGGOTA_CACHE_KEY, data.records);
        return data.records;
      }
    }
  } catch {
    // offline fallback
  }

  const cached = readCacheArray<AnggotaOpdim>(ANGGOTA_CACHE_KEY);
  return cached.length > 0 ? cached : INITIAL_ANGGOTA_OPDIM;
}

export async function createAnggotaOpdim(
  input: Omit<AnggotaOpdim, 'id'>
): Promise<AnggotaOpdim> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('anggota_opdim')) {
    try {
      const id = `ang-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const { data, error } = await supabase
        .from('anggota_opdim')
        .insert({
          id,
          full_name: input.fullName,
          jabatan: input.jabatan,
          unit: input.unit,
          peran_level: input.peranLevel,
          tugas_utama: input.tugasUtama ?? '',
          foto_url: input.fotoUrl ?? '',
          sort_order: input.sortOrder,
          is_active: input.isActive,
        })
        .select('*')
        .single();
      if (!error && data) {
        const created = mapSupabaseAnggotaRow(data as Record<string, unknown>);
        const curr = readCacheArray<AnggotaOpdim>(ANGGOTA_CACHE_KEY);
        const next = [...curr, created].sort((a, b) => a.sortOrder - b.sortOrder);
        writeCacheArray(ANGGOTA_CACHE_KEY, next);
        broadcastLocalSync('anggota_opdim');
        return created;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch('/api/anggota', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal menambahkan data anggota OPDIM.');
  }
  markLocalFallbackTable('anggota_opdim', true);
  const data = (await res.json()) as { record: AnggotaOpdim };
  const curr = readCacheArray<AnggotaOpdim>(ANGGOTA_CACHE_KEY);
  const next = [...curr, data.record].sort((a, b) => a.sortOrder - b.sortOrder);
  writeCacheArray(ANGGOTA_CACHE_KEY, next);
  broadcastLocalSync('anggota_opdim');
  return data.record;
}

export async function updateAnggotaOpdim(
  id: string,
  input: Omit<AnggotaOpdim, 'id'>
): Promise<AnggotaOpdim> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('anggota_opdim')) {
    try {
      const { data, error } = await supabase
        .from('anggota_opdim')
        .update({
          full_name: input.fullName,
          jabatan: input.jabatan,
          unit: input.unit,
          peran_level: input.peranLevel,
          tugas_utama: input.tugasUtama ?? '',
          foto_url: input.fotoUrl ?? '',
          sort_order: input.sortOrder,
          is_active: input.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();
      if (!error && data) {
        const updated = mapSupabaseAnggotaRow(data as Record<string, unknown>);
        const curr = readCacheArray<AnggotaOpdim>(ANGGOTA_CACHE_KEY);
        const next = curr
          .map((a) => (a.id === id ? updated : a))
          .sort((a, b) => a.sortOrder - b.sortOrder);
        writeCacheArray(ANGGOTA_CACHE_KEY, next);
        broadcastLocalSync('anggota_opdim');
        return updated;
      }
    } catch {
      // fall through
    }
  }

  const res = await fetch(`/api/anggota/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error || 'Gagal memperbarui data anggota OPDIM.');
  }
  const data = (await res.json()) as { record: AnggotaOpdim };
  const curr = readCacheArray<AnggotaOpdim>(ANGGOTA_CACHE_KEY);
  const next = curr
    .map((a) => (a.id === id ? data.record : a))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  writeCacheArray(ANGGOTA_CACHE_KEY, next);
  broadcastLocalSync('anggota_opdim');
  return data.record;
}

export async function deleteAnggotaOpdim(id: string): Promise<void> {
  if (supabase && isSupabaseConfigured && !isLocalFallbackTable('anggota_opdim')) {
    try {
      await supabase.from('anggota_opdim').delete().eq('id', id);
    } catch {
      // ignore
    }
  }
  try {
    await fetch(`/api/anggota/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // ignore
  }
  const curr = readCacheArray<AnggotaOpdim>(ANGGOTA_CACHE_KEY);
  writeCacheArray(
    ANGGOTA_CACHE_KEY,
    curr.filter((a) => a.id !== id)
  );
  broadcastLocalSync('anggota_opdim');
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
        writeCacheArray(REMINDER_CACHE_KEY, ids);
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
        writeCacheArray(REMINDER_CACHE_KEY, data.eventIds);
        return data.eventIds;
      }
    }
  } catch {
    // offline fallback
  }

  return readCacheArray<string>(REMINDER_CACHE_KEY);
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
        writeCacheArray(REMINDER_CACHE_KEY, data.eventIds);
        return data.eventIds;
      }
    }
  } catch {
    // offline fallback
  }

  const cached = readCacheArray<string>(REMINDER_CACHE_KEY);
  const next = currentlySaved
    ? cached.filter((id) => id !== eventId)
    : Array.from(new Set([...cached, eventId]));
  writeCacheArray(REMINDER_CACHE_KEY, next);
  return next;
}
