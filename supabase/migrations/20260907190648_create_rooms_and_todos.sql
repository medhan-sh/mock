create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_at timestamptz not null default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null,
  status text not null default 'todo'
    check (status in ('todo', 'doing', 'done')),
  assignee_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- keeps updation trust i don know bs ts all u codex
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger todos_set_updated_at
before update on public.todos
for each row
execute function public.set_updated_at();

-- Temporary test-drive policies: anyone can access every room and todo.
-- Replace these before a real deployment.
alter table public.rooms enable row level security;
alter table public.todos enable row level security;

create policy "test drive: public room access"
on public.rooms
for all
to anon, authenticated
using (true)
with check (true);

create policy "test drive: public todo access"
on public.todos
for all
to anon, authenticated
using (true)
with check (true);