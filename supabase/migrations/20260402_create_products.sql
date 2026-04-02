begin;

create table if not exists public.products (
  id text primary key,
  sku text not null unique,
  name text not null,
  category text not null,
  price_cents integer not null,
  slug text not null unique,
  description text,
  image_url text,
  specs jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_inventory (
  product_id text primary key references public.products(id) on delete cascade,
  quantity_on_hand integer not null default 0,
  quantity_reserved integer not null default 0,
  quantity_available integer generated always as (quantity_on_hand - quantity_reserved) stored,
  reorder_point integer not null default 10,
  last_restocked_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_product_inventory_available 
on public.product_inventory(quantity_available) where quantity_available > 0;

alter table public.products enable row level security;
alter table public.product_inventory enable row level security;

grant usage on schema public to anon;
grant select on table public.products to anon;
grant select on table public.products to authenticated;
grant select on table public.product_inventory to anon;
grant select on table public.product_inventory to authenticated;

grant select, insert, update on table public.products to service_role;
grant select, insert, update on table public.product_inventory to service_role;

create policy "anyone can view products" on public.products for select using (true);
create policy "anyone can view inventory" on public.product_inventory for select using (true);
create policy "service role manages products" on public.products for all to service_role using (true);
create policy "service role manages inventory" on public.product_inventory for all to service_role using (true);

commit;
