alter table public.game_saves
  add column if not exists taken_coin_indexes jsonb not null default '[]'::jsonb,
  add column if not exists used_lucky_block_indexes jsonb not null default '[]'::jsonb,
  add column if not exists defeated_enemy_indexes jsonb not null default '[]'::jsonb,
  add column if not exists boss_health integer,
  add column if not exists game_status text not null default 'playing';

alter table public.game_saves
  add constraint game_saves_game_status_check
  check (game_status in ('playing', 'won', 'lost'));
