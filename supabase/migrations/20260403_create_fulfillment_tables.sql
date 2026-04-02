begin;

create table if not exists public.order_items (
  id text primary key,
  purchase_id text not null references public.profile_purchases(purchase_id) on delete cascade,
  product_id text references public.products(id),
  sku text not null,
  name text not null,
  quantity integer not null,
  unit_amount_cents integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id text primary key,
  purchase_id text not null references public.profile_purchases(purchase_id) on delete cascade,
  status text not null default 'pending',
  carrier text,
  tracking_number text unique,
  external_shipment_id text unique,
  address_line1 text,
  address_line2 text,
  address_city text,
  address_state text,
  address_postal_code text,
  address_country text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  carrier_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fulfillment_config (
  id text primary key,
  provider text not null unique,
  api_key_encrypted text,
  webhook_url text,
  is_active boolean default false,
  config jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_items_purchase_id on public.order_items(purchase_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);
create index if not exists idx_shipments_purchase_id on public.shipments(purchase_id);
create index if not exists idx_shipments_status on public.shipments(status);
create index if not exists idx_shipments_tracking_number on public.shipments(tracking_number);

alter table public.order_items enable row level security;
alter table public.shipments enable row level security;
alter table public.fulfillment_config enable row level security;

grant usage on schema public to anon;
grant select on table public.order_items to anon;
grant select on table public.shipments to anon;
grant select, insert, update on table public.order_items to authenticated;
grant select on table public.shipments to authenticated;

grant select, insert, update on table public.order_items to service_role;
grant select, insert, update on table public.shipments to service_role;
grant select, insert, update on table public.fulfillment_config to service_role;

create policy "users can view own order items" on public.order_items
  for select using (
    purchase_id in (
      select purchase_id from public.profile_purchases 
      where user_id = auth.uid()::text
    )
  );

create policy "users can view own shipments" on public.shipments
  for select using (
    purchase_id in (
      select purchase_id from public.profile_purchases 
      where user_id = auth.uid()::text
    )
  );

create policy "service role manages order items" on public.order_items for all to service_role using (true);
create policy "service role manages shipments" on public.shipments for all to service_role using (true);
create policy "service role manages fulfillment config" on public.fulfillment_config for all to service_role using (true);

commit;
