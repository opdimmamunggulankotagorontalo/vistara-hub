create or replace function public.tara_enqueue_custom_notification_push()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare fingerprint text;
declare current_key text;
begin
  if tg_op = 'UPDATE'
     and new.title is not distinct from old.title
     and new.message is not distinct from old.message
     and new.target_path is not distinct from old.target_path
     and new.is_active is not distinct from old.is_active
     and new.expires_at is not distinct from old.expires_at then
    return new;
  end if;

  if not new.is_active
     or (new.expires_at is not null and new.expires_at < timezone('Asia/Makassar', now())::date::text) then
    update public.tara_push_outbox
       set status = 'failed',
           last_error = 'Dibatalkan karena notifikasi dinonaktifkan atau kedaluwarsa.',
           updated_at = now()
     where dedupe_key like 'custom:' || new.id || ':%'
       and status = 'pending';
    return new;
  end if;

  fingerprint := md5(coalesce(new.title, '') || '|' || coalesce(new.message, '') || '|' || coalesce(new.target_path, ''));
  current_key := 'custom:' || new.id || ':' || fingerprint;

  if tg_op = 'UPDATE' then
    update public.tara_push_outbox
       set status = 'failed',
           last_error = 'Dibatalkan karena isi notifikasi diperbarui oleh admin.',
           updated_at = now()
     where dedupe_key like 'custom:' || new.id || ':%'
       and dedupe_key <> current_key
       and status = 'pending';
  end if;

  insert into public.tara_push_outbox (dedupe_key, title, body, target_path, tag)
  values (
    current_key,
    left(new.title, 120),
    left(new.message, 220),
    case when new.target_path like '/%' and new.target_path not like '//%'
      then new.target_path else '/beranda' end,
    'tara-custom-' || left(new.id, 36)
  )
  on conflict (dedupe_key) do nothing;
  return new;
end;
$$;
