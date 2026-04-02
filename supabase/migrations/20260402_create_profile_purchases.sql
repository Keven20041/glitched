begin;

create table if not exists public.profile_purchases (
  purchase_id text primary key,
  user_id text not null,
  order_ref text not null,
  stripe_session_id text not null unique,
  payment_intent_id text,
  status text not null default 'paid',
  customer jsonb not null,
  items jsonb not null,
  fulfillment jsonb not null,
  total_amount_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_purchases_user_created_at
on public.profile_purchases (user_id, created_at desc);

create index if not exists idx_profile_purchases_user_status
on public.profile_purchases (user_id, status);

alter table public.profile_purchases enable row level security;

grant usage on schema public to anon;
grant select, insert, update on table public.profile_purchases to anon;
grant select, insert, update on table public.profile_purchases to authenticated;
grant select, insert, update on table public.profile_purchases to service_role;

drop policy if exists "service role can manage profile purchases" on public.profile_purchases;
create policy "service role can manage profile purchases"
on public.profile_purchases
for all
to service_role
using (true)
with check (true);

commit;
