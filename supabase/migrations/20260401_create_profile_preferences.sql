begin;

create table if not exists public.profile_preferences (
  user_id text primary key,
  address text not null default '',
  city text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profile_preferences enable row level security;

grant usage on schema public to anon;
grant select, insert, update on table public.profile_preferences to anon;
grant select, insert, update on table public.profile_preferences to authenticated;
grant select, insert, update on table public.profile_preferences to service_role;

drop policy if exists "service role can manage profile preferences" on public.profile_preferences;
create policy "service role can manage profile preferences"
on public.profile_preferences
for all
to service_role
using (true)
with check (true);

commit;
