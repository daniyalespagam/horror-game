create table if not exists public.game_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  level integer not null default 1 check (level between 1 and 20),
  coins integer not null default 0 check (coins >= 0),
  lives integer not null default 5 check (lives between 0 and 5),
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

create policy "read own game save"
  on public.game_saves for select
  using (auth.uid() = user_id);

create policy "insert own game save"
  on public.game_saves for insert
  with check (auth.uid() = user_id);

create policy "update own game save"
  on public.game_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
