create table if not exists public.two_of_us_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.two_of_us_state enable row level security;

drop policy if exists "two_of_us_state_read" on public.two_of_us_state;
drop policy if exists "two_of_us_state_insert" on public.two_of_us_state;
drop policy if exists "two_of_us_state_update" on public.two_of_us_state;

create policy "two_of_us_state_read"
on public.two_of_us_state
for select
to anon
using (id = 'main');

create policy "two_of_us_state_insert"
on public.two_of_us_state
for insert
to anon
with check (id = 'main');

create policy "two_of_us_state_update"
on public.two_of_us_state
for update
to anon
using (id = 'main')
with check (id = 'main');

insert into public.two_of_us_state (id, data)
values (
  'main',
  '{
    "profiles": { "me": "第一个人", "her": "第二个人" },
    "checkins": [],
    "memories": [],
    "wishes": [],
    "anniversaries": [{ "title": "在一起纪念日", "date": "2026-06-08" }],
    "letters": [],
    "photos": []
  }'::jsonb
)
on conflict (id) do nothing;
