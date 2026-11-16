
drop policy if exists "Deny client access to TARA push subscriptions" on public.tara_push_subscriptions;
create policy "Deny client access to TARA push subscriptions"
  on public.tara_push_subscriptions
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "Deny client access to TARA push outbox" on public.tara_push_outbox;
create policy "Deny client access to TARA push outbox"
  on public.tara_push_outbox
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on function public.tara_enqueue_event_push() from public, anon, authenticated;
revoke all on function public.tara_enqueue_berita_push() from public, anon, authenticated;
revoke all on function public.tara_enqueue_custom_notification_push() from public, anon, authenticated;
