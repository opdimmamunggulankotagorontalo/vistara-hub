do $$
begin
  alter publication supabase_realtime add table public.custom_notifications;
exception
  when duplicate_object then null;
end $$;
