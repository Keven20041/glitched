begin;

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id text unique,
  name text,
  source text not null default 'homepage',
  status text not null default 'active',
  opted_in_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscriptions enable row level security;

grant usage on schema public to anon;
grant select, insert, update on table public.newsletter_subscriptions to anon;
grant select, insert, update on table public.newsletter_subscriptions to authenticated;
grant select, insert, update on table public.newsletter_subscriptions to service_role;

drop policy if exists "service role can manage newsletter subscriptions" on public.newsletter_subscriptions;
create policy "service role can manage newsletter subscriptions"
on public.newsletter_subscriptions
for all
to service_role
using (true)
with check (true);

commit;