import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function readEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const envPath = path.resolve(process.cwd(), ".env.local");
const env = readEnv(envPath);
const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL in .env.local");
}

const sql = `
begin;

drop table if exists public.notes cascade;

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
`;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  const result = await client.query("select id, title from public.notes order by id asc");
  console.log("SETUP_OK");
  console.log(JSON.stringify(result.rows));
} finally {
  await client.end();
}
