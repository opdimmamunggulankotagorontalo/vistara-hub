import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-admin-token, x-tara-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const url = Deno.env.get("SUPABASE_URL")!;
const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
const serviceKey = keys.default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
if (!url || !serviceKey) throw new Error("Supabase service credentials missing.");
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const daily = [
  ["Semangat Pagi dari TARA!", "Awali harimu di madrasah dengan niat tulus dan senyum. Satu langkah kecil hari ini mendekatkanmu pada mimpi besar."],
  ["Pesan Penyemangat TARA", "Belajar bukan soal siapa yang paling cepat, tapi siapa yang terus bertahan dan bertumbuh. Semangat terus, sobat VISTARA!"],
  ["Catatan Harian TARA", "Jangan ragu menyuarakan ide baikmu di Kotak Aspirasi. Satu gagasan darimu bisa membawa perubahan untuk seluruh siswa."],
  ["TARA Mengingatkanmu", "Jaga fokus belajarmu, selipkan doa sebelum ujian atau tugas, dan jangan lupa saling menyemangati dengan teman sekelas!"],
  ["Inspirasi Hari Ini · TARA", "Kesuksesan dibangun dari kebiasaan baik yang diulang setiap hari. Tetap disiplin, rendah hati, dan penuh semangat!"],
  ["Halo Pejuang Ilmu!", "Lelah itu wajar. Ambil jeda sebentar, minum air putih, lalu lanjutkan lagi dengan hati yang tenang."],
  ["Semangat Berkarya · OPDIM VISTARA", "Setiap prestasi dimulai dari keberanian mencoba. Cek agenda event dan kompetisi terbaru di aplikasi OPDIM VISTARA!"],
  ["Sapaan Hangat TARA", "Ilmu yang bermanfaat lahir dari adab yang baik dan hati yang bersih. Semoga harimu penuh keberkahan dan kemudahan!"],
];
const holidays = [
  ["Selamat Hari Libur dari TARA!", "Gunakan waktu liburmu sebaik-baiknya untuk beristirahat cukup, berkumpul bersama keluarga, dan menyegarkan pikiran."],
  ["Waktunya Istirahat Berkualitas", "Hari libur tiba! Kurangi begadang, jaga kesehatan, dan manfaatkan waktu luangmu untuk hal positif yang membuatmu bahagia."],
  ["Pesan Akhir Pekan TARA", "Setelah sepekan penuh belajar, tubuh dan pikiranmu berhak beristirahat. Nikmati hari liburmu dengan kegiatan bermanfaat!"],
];
const holidayDates = new Set([
  "2026-01-01","2026-01-16","2026-02-17","2026-03-19","2026-03-20","2026-03-21","2026-04-03","2026-05-01",
  "2026-05-14","2026-05-27","2026-05-31","2026-06-01","2026-06-16","2026-08-17","2026-08-25","2026-12-25",
  "2027-01-01","2027-01-05","2027-02-06","2027-03-09","2027-03-10","2027-03-26","2027-05-01","2027-05-06",
  "2027-05-17","2027-05-20","2027-06-01","2027-06-06","2027-08-14","2027-08-17","2027-12-25"
]);

function reply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}
function safePath(value: unknown) {
  const p = String(value ?? "/beranda").trim();
  return p.startsWith("/") && !p.startsWith("//") && !p.includes("\\") ? p.slice(0, 500) : "/beranda";
}
function validEndpoint(value: string) {
  try {
    const u = new URL(value);
    const h = u.hostname.toLowerCase();
    return u.protocol === "https:" && (
      h === "fcm.googleapis.com" || h === "push.services.mozilla.com" ||
      h.endsWith(".push.services.mozilla.com") || h === "web.push.apple.com" ||
      h.endsWith(".notify.windows.com")
    );
  } catch { return false; }
}
async function getSecrets() {
  const { data, error } = await db.rpc("tara_get_push_secrets");
  if (error) throw error;
  const s = Array.isArray(data) ? data[0] : data;
  if (!s?.vapid_public_key || !s?.vapid_private_key || !s?.internal_secret) {
    throw new Error("TARA push secrets missing in Vault.");
  }
  return s;
}
async function checkAdmin(req: Request) {
  const token = req.headers.get("x-admin-token")?.trim();
  if (!token) return null;
  const { data, error } = await db.rpc("admin_validate_session", { p_token: token });
  if (error || !Array.isArray(data) || !data.length) return null;
  const user = data[0];
  return ["root", "inti"].includes(String(user.role)) && !user.must_change_password ? user : null;
}
function normalized(input: Record<string, unknown>) {
  const cats = ["pengumuman","semangat","libur","event","berita"];
  const expiry = String(input.expiresAt ?? "").trim();
  return {
    title: String(input.title ?? "").trim().slice(0, 100),
    message: String(input.message ?? "").trim().slice(0, 320),
    category: cats.includes(String(input.category)) ? String(input.category) : "pengumuman",
    target_path: safePath(input.targetPath),
    is_active: input.isActive !== false,
    expires_at: /^\d{4}-\d{2}-\d{2}$/.test(expiry) ? expiry : null,
  };
}
async function adminAction(action: string, body: Record<string, unknown>, req: Request) {
  const user = await checkAdmin(req);
  if (!user) return reply({ error: "Sesi admin tidak valid atau tidak memiliki akses." }, 403);
  if (action === "admin-list") {
    const { data, error } = await db.from("custom_notifications").select("*").order("created_at", { ascending: false });
    if (error) return reply({ error: error.message }, 500);
    return reply({ records: data ?? [] });
  }
  if (action === "admin-create") {
    const input = normalized((body.input ?? {}) as Record<string, unknown>);
    if (!input.title || !input.message) return reply({ error: "Judul dan isi pesan wajib diisi." }, 400);
    const { data, error } = await db.from("custom_notifications").insert({
      id: "notif-" + crypto.randomUUID(), ...input, created_by: user.full_name || "Pengurus OPDIM",
    }).select("*").single();
    if (error) return reply({ error: error.message }, 500);
    return reply({ record: data }, 201);
  }
  if (action === "admin-update") {
    const id = String(body.id ?? "").trim();
    if (!id) return reply({ error: "ID notifikasi tidak valid." }, 400);
    const raw = (body.input ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (raw.title !== undefined) patch.title = String(raw.title).trim().slice(0, 100);
    if (raw.message !== undefined) patch.message = String(raw.message).trim().slice(0, 320);
    if (raw.category !== undefined) patch.category = normalized({ category: raw.category }).category;
    if (raw.targetPath !== undefined) patch.target_path = safePath(raw.targetPath);
    if (raw.isActive !== undefined) patch.is_active = Boolean(raw.isActive);
    if (raw.expiresAt !== undefined) {
      const exp = String(raw.expiresAt ?? "").trim();
      patch.expires_at = /^\d{4}-\d{2}-\d{2}$/.test(exp) ? exp : null;
    }
    const { data, error } = await db.from("custom_notifications").update(patch).eq("id", id).select("*").single();
    if (error) return reply({ error: error.message }, error.code === "PGRST116" ? 404 : 500);
    return reply({ record: data });
  }
  if (action === "admin-delete") {
    const id = String(body.id ?? "").trim();
    if (!id) return reply({ error: "ID notifikasi tidak valid." }, 400);
    const { error } = await db.from("custom_notifications").delete().eq("id", id);
    if (error) return reply({ error: error.message }, 500);
    return reply({ ok: true });
  }
  return reply({ error: "Aksi admin tidak dikenal." }, 400);
}
async function subscribe(body: Record<string, unknown>, req: Request) {
  const sub = body.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;
  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? "");
  const auth = String(sub?.keys?.auth ?? "");
  if (!validEndpoint(endpoint) || !p256dh || !auth) return reply({ error: "Data langganan push tidak valid." }, 400);
  const now = new Date().toISOString();
  const { error } = await db.from("tara_push_subscriptions").upsert({
    endpoint, p256dh, auth, user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    is_active: true, updated_at: now, last_seen_at: now,
  }, { onConflict: "endpoint" });
  if (error) return reply({ error: "Gagal menyimpan langganan notifikasi." }, 500);
  return reply({ ok: true });
}
async function unsubscribe(body: Record<string, unknown>) {
  const endpoint = String(body.endpoint ?? "");
  if (!validEndpoint(endpoint)) return reply({ error: "Endpoint tidak valid." }, 400);
  const { error } = await db.from("tara_push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return reply({ error: "Gagal menghapus langganan." }, 500);
  return reply({ ok: true });
}
function witaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).formatToParts(new Date());
  const val = (k: string) => parts.find(x => x.type === k)?.value ?? "";
  return { key: val("year") + "-" + val("month") + "-" + val("day"), weekday: val("weekday") };
}
async function queueDaily() {
  const d = witaDate();
  const isHoliday = d.weekday === "Sat" || d.weekday === "Sun" || holidayDates.has(d.key);
  const choices = isHoliday ? holidays : daily;
  const picked = choices[Math.floor(Math.random() * choices.length)];
  const { error } = await db.from("tara_push_outbox").insert({
    dedupe_key: "daily:" + d.key, title: picked[0], body: picked[1], target_path: "/beranda",
    tag: "tara-daily-" + d.key, status: "pending", available_at: new Date().toISOString(),
  });
  if (error && error.code !== "23505") throw error;
  return { queued: !error, date: d.key, kind: isHoliday ? "holiday" : "daily" };
}
async function dispatch() {
  const secrets = await getSecrets();
  webpush.setVapidDetails("https://vistara-hub.vercel.app", secrets.vapid_public_key, secrets.vapid_private_key);
  const { data: jobs, error: claimError } = await db.rpc("tara_claim_push_jobs", { p_limit: 15 });
  if (claimError) throw claimError;
  const claimed = jobs ?? [];
  if (!claimed.length) return { claimed: 0, sent: 0, failed: 0 };
  const { data: subs, error: subError } = await db.from("tara_push_subscriptions")
    .select("id, endpoint, p256dh, auth").eq("is_active", true);
  if (subError) throw subError;
  const devices = subs ?? [];
  let sent = 0, failed = 0;
  for (const job of claimed) {
    if (!devices.length) {
      const expired = Date.now() - new Date(job.created_at).getTime() >= 24 * 60 * 60 * 1000;
      await db.from("tara_push_outbox").update({
        status: expired ? "failed" : "pending",
        available_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: Math.max(0, Number(job.attempts) - 1),
        sent_at: null,
        recipient_count: 0,
        last_error: expired ? "Kedaluwarsa: belum ada perangkat yang berlangganan dalam 24 jam." : "Menunggu perangkat pertama berlangganan.",
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);
      if (expired) failed++;
      continue;
    }
    const payload = JSON.stringify({
      title: job.title, body: job.body, icon: "/tara-notif-icon.png", badge: "/pwa-192x192.png",
      tag: job.tag, url: safePath(job.target_path),
    });
    let delivered = 0, transient = 0;
    for (const device of devices) {
      try {
        await webpush.sendNotification(
          { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
          payload,
          { TTL: 86400, urgency: "normal", topic: String(job.tag).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || "tara" },
        );
        delivered++;
      } catch (error) {
        const code = Number((error as { statusCode?: number })?.statusCode ?? 0);
        if (code === 404 || code === 410) {
          await db.from("tara_push_subscriptions").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", device.id);
        } else {
          transient++;
          console.error("Push delivery error", { job: job.id, code, error: String(error) });
        }
      }
    }
    if (transient && Number(job.attempts) < 6) {
      const delay = Math.min(60 * 2 ** Math.max(0, Number(job.attempts) - 1), 3600);
      await db.from("tara_push_outbox").update({
        status: "pending", available_at: new Date(Date.now() + delay * 1000).toISOString(),
        recipient_count: delivered, last_error: String(transient) + " perangkat gagal sementara",
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);
    } else {
      const isFailed = transient > 0 && delivered === 0;
      await db.from("tara_push_outbox").update({
        status: isFailed ? "failed" : "sent", sent_at: isFailed ? null : new Date().toISOString(),
        recipient_count: delivered, last_error: isFailed ? String(transient) + " perangkat gagal" : null,
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);
      if (isFailed) failed++; else sent++;
    }
  }
  return { claimed: claimed.length, sent, failed, activeDevices: devices.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  try {
    const body = await req.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    if (action === "subscribe") return await subscribe(body, req);
    if (action === "unsubscribe") return await unsubscribe(body);
    if (action.startsWith("admin-")) return await adminAction(action, body, req);
    if (action === "dispatch" || action === "daily") {
      const secrets = await getSecrets();
      if ((req.headers.get("x-tara-internal-secret") ?? "") !== secrets.internal_secret) {
        return reply({ error: "Unauthorized." }, 401);
      }
      if (action === "daily") return reply({ ok: true, ...(await queueDaily()) });
      return reply({ ok: true, ...(await dispatch()) });
    }
    return reply({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("TARA push function error", error);
    return reply({ error: error instanceof Error ? error.message : "Internal server error." }, 500);
  }
});
