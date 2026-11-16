drop function if exists public.tara_claim_push_jobs(integer);

create function public.tara_claim_push_jobs(p_limit integer default 20)
returns table (
  id uuid,
  dedupe_key text,
  title text,
  body text,
  target_path text,
  tag text,
  attempts integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.tara_push_outbox
     set status = 'pending',
         updated_at = now()
   where status = 'processing'
     and updated_at < now() - interval '10 minutes';

  return query
  with picked as (
    select o.id
      from public.tara_push_outbox o
     where o.status = 'pending'
       and o.available_at <= now()
     order by o.created_at asc
     for update skip locked
     limit greatest(1, least(coalesce(p_limit, 20), 100))
  )
  update public.tara_push_outbox o
     set status = 'processing',
         attempts = o.attempts + 1,
         updated_at = now()
    from picked
   where o.id = picked.id
  returning o.id, o.dedupe_key, o.title, o.body, o.target_path, o.tag, o.attempts, o.created_at;
end;
$$;

revoke all on function public.tara_claim_push_jobs(integer) from public, anon, authenticated;
grant execute on function public.tara_claim_push_jobs(integer) to service_role;
