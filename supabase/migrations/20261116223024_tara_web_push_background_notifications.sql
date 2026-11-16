-- TARA background Web Push infrastructure.
-- Runtime secrets are stored separately in Supabase Vault:
-- tara_vapid_public_key, tara_vapid_private_key, tara_push_internal_secret,
-- tara_supabase_project_url, tara_supabase_publishable_key.
-- Never commit the VAPID private key or internal secret to source control.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table if not exists public.tara_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists tara_push_subscriptions_active_idx
  on public.tara_push_subscriptions (is_active, last_seen_at desc);

alter table public.tara_push_subscriptions enable row level security;
revoke all on public.tara_push_subscriptions from anon, authenticated;
grant all on public.tara_push_subscriptions to service_role;

create table if not exists public.tara_push_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  title text not null,
  body text not null,
  target_path text not null default '/beranda',
  tag text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  sent_at timestamptz,
  recipient_count integer,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tara_push_outbox_pending_idx
  on public.tara_push_outbox (status, available_at, created_at);

alter table public.tara_push_outbox enable row level security;
revoke all on public.tara_push_outbox from anon, authenticated;
grant all on public.tara_push_outbox to service_role;

create table if not exists public.custom_notifications (
  id text primary key,
  title text not null,
  message text not null,
  category text not null default 'pengumuman'
    check (category in ('pengumuman', 'semangat', 'libur', 'event', 'berita')),
  target_path text not null default '/beranda',
  is_active boolean not null default true,
  created_by text not null default 'Pengurus OPDIM',
  expires_at text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.custom_notifications enable row level security;
drop policy if exists "Public read active custom notifications" on public.custom_notifications;
create policy "Public read active custom notifications"
  on public.custom_notifications for select to anon, authenticated
  using (
    is_active = true
    and (expires_at is null or expires_at >= timezone('Asia/Makassar', now())::date::text)
  );

revoke insert, update, delete on public.custom_notifications from anon, authenticated;
grant select on public.custom_notifications to anon, authenticated;
grant all on public.custom_notifications to service_role;

create or replace function public.tara_enqueue_event_push()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.tara_push_outbox (dedupe_key, title, body, target_path, tag)
  values (
    'event:' || new.id,
    'Agenda Baru: ' || left(new.title, 120),
    left(coalesce(new.date, '') ||
      case when coalesce(new.time, '') <> '' then ' · ' || new.time else '' end ||
      case when coalesce(new.location, '') <> '' then ' · ' || new.location else '' end, 220),
    '/beranda/event',
    'tara-event-' || left(new.id, 48)
  )
  on conflict (dedupe_key) do nothing;
  return new;
end;
$$;

drop trigger if exists tara_events_push_after_insert on public.events;
create trigger tara_events_push_after_insert after insert on public.events
for each row execute function public.tara_enqueue_event_push();

create or replace function public.tara_enqueue_berita_push()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.tara_push_outbox (dedupe_key, title, body, target_path, tag)
  values (
    'berita:' || new.id,
    'Berita Baru: ' || left(new.title, 120),
    left(coalesce(nullif(new.excerpt, ''), 'Kabar terbaru dari OPDIM VISTARA telah terbit. Yuk baca sekarang!'), 220),
    '/beranda/berita/' || new.slug,
    'tara-berita-' || left(new.id, 44)
  )
  on conflict (dedupe_key) do nothing;
  return new;
end;
$$;

drop trigger if exists tara_berita_push_after_insert on public.berita;
create trigger tara_berita_push_after_insert after insert on public.berita
for each row execute function public.tara_enqueue_berita_push();

create or replace function public.tara_enqueue_custom_notification_push()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare fingerprint text;
begin
  if tg_op = 'UPDATE'
     and new.title is not distinct from old.title
     and new.message is not distinct from old.message
     and new.target_path is not distinct from old.target_path
     and new.is_active is not distinct from old.is_active
     and new.expires_at is not distinct from old.expires_at then
    return new;
  end if;

  if new.is_active
     and (new.expires_at is null or new.expires_at >= timezone('Asia/Makassar', now())::date::text) then
    fingerprint := md5(coalesce(new.title, '') || '|' || coalesce(new.message, '') || '|' || coalesce(new.target_path, ''));
    insert into public.tara_push_outbox (dedupe_key, title, body, target_path, tag)
    values (
      'custom:' || new.id || ':' || fingerprint,
      left(new.title, 120),
      left(new.message, 220),
      case when new.target_path like '/%' and new.target_path not like '//%'
        then new.target_path else '/beranda' end,
      'tara-custom-' || left(new.id, 36)
    )
    on conflict (dedupe_key) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists tara_custom_notifications_push_after_write on public.custom_notifications;
create trigger tara_custom_notifications_push_after_write
after insert or update on public.custom_notifications
for each row execute function public.tara_enqueue_custom_notification_push();

create or replace function public.tara_get_push_secrets()
returns table (
  vapid_public_key text,
  vapid_private_key text,
  internal_secret text,
  project_url text,
  publishable_key text
)
language sql security definer
set search_path = pg_catalog
as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'tara_vapid_public_key'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'tara_vapid_private_key'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'tara_push_internal_secret'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'tara_supabase_project_url'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'tara_supabase_publishable_key');
$$;

revoke all on function public.tara_get_push_secrets() from public, anon, authenticated;
grant execute on function public.tara_get_push_secrets() to service_role;

select cron.unschedule(jobid)
from cron.job
where jobname in ('tara-push-dispatch', 'tara-daily-notification');

select cron.schedule(
  'tara-push-dispatch',
  '* * * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'tara_supabase_project_url') || '/functions/v1/tara-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'tara_supabase_publishable_key'),
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'tara_supabase_publishable_key'),
        'x-tara-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'tara_push_internal_secret')
      ),
      body := '{"action":"dispatch"}'::jsonb,
      timeout_milliseconds := 10000
    );
  $job$
);

select cron.schedule(
  'tara-daily-notification',
  '0 23 * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'tara_supabase_project_url') || '/functions/v1/tara-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'tara_supabase_publishable_key'),
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'tara_supabase_publishable_key'),
        'x-tara-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'tara_push_internal_secret')
      ),
      body := '{"action":"daily"}'::jsonb,
      timeout_milliseconds := 10000
    );
  $job$
);
