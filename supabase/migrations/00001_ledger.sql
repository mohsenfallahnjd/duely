-- PayMay ledger (run in Supabase SQL Editor or via CLI migrate)

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  accent text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('payment', 'debt', 'pending')),
  title text not null,
  amount numeric not null,
  progress_amount numeric not null default 0,
  contact_id uuid references public.contacts (id) on delete set null,
  tags text[] not null default '{}',
  entry_date date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists entries_user_id_idx on public.entries (user_id);
create index if not exists entries_created_at_idx on public.entries (created_at desc);

alter table public.contacts enable row level security;
alter table public.entries enable row level security;

create policy "contacts_select_own"
  on public.contacts for select
  using (auth.uid() = user_id);

create policy "contacts_insert_own"
  on public.contacts for insert
  with check (auth.uid() = user_id);

create policy "contacts_update_own"
  on public.contacts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "contacts_delete_own"
  on public.contacts for delete
  using (auth.uid() = user_id);

create policy "entries_select_own"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "entries_insert_own"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "entries_update_own"
  on public.entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "entries_delete_own"
  on public.entries for delete
  using (auth.uid() = user_id);
