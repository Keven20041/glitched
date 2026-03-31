begin;

drop policy if exists "public can read notes" on public.notes;
drop table if exists public.notes;

create table public.notes (
  id bigint primary key generated always as identity,
  title text not null
);

insert into public.notes (title)
values
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from Next.js.'),
  ('It was awesome!');

alter table public.notes enable row level security;

grant usage on schema public to anon;
grant select on table public.notes to anon;

create policy "public can read notes"
on public.notes
for select
to anon
using (true);

commit;
