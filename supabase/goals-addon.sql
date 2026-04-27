-- ============================================================
-- Modulo de metas financeiras
-- Execute este arquivo no SQL Editor do Supabase se a rota /metas
-- ainda nao estiver funcionando no seu projeto.
--
-- Pre-requisito: as tabelas public.profiles e public.categories do
-- schema principal ja precisam existir.
-- ============================================================

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  description text,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  start_date date not null,
  deadline date not null,
  status text not null default 'in_progress',
  priority text not null default 'medium',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint financial_goals_title_length check (char_length(trim(title)) between 2 and 100),
  constraint financial_goals_description_length check (description is null or char_length(description) <= 400),
  constraint financial_goals_target_positive check (target_amount > 0),
  constraint financial_goals_current_non_negative check (current_amount >= 0),
  constraint financial_goals_deadline_valid check (deadline >= start_date),
  constraint financial_goals_status_valid check (status in ('in_progress', 'completed', 'paused')),
  constraint financial_goals_priority_valid check (priority in ('low', 'medium', 'high'))
);

create index if not exists financial_goals_user_deadline_idx
  on public.financial_goals (user_id, status, deadline asc);

create index if not exists financial_goals_user_priority_idx
  on public.financial_goals (user_id, priority, deadline asc);

create index if not exists financial_goals_user_category_idx
  on public.financial_goals (user_id, category_id);

create or replace function public.validate_financial_goal_category_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_owner uuid;
begin
  if new.category_id is null then
    return new;
  end if;

  select user_id
    into category_owner
  from public.categories
  where id = new.category_id;

  if category_owner is null then
    raise exception 'Categoria nao encontrada.';
  end if;

  if category_owner <> new.user_id then
    raise exception 'A categoria informada nao pertence ao usuario autenticado.';
  end if;

  return new;
end;
$$;

drop trigger if exists set_financial_goals_updated_at on public.financial_goals;
create trigger set_financial_goals_updated_at
before update on public.financial_goals
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists validate_financial_goals_before_write on public.financial_goals;
create trigger validate_financial_goals_before_write
before insert or update on public.financial_goals
for each row
execute function public.validate_financial_goal_category_consistency();

alter table public.financial_goals enable row level security;
alter table public.financial_goals force row level security;

drop policy if exists "financial_goals_select_own" on public.financial_goals;
create policy "financial_goals_select_own"
on public.financial_goals
for select
using (auth.uid() = user_id);

drop policy if exists "financial_goals_insert_own" on public.financial_goals;
create policy "financial_goals_insert_own"
on public.financial_goals
for insert
with check (auth.uid() = user_id);

drop policy if exists "financial_goals_update_own" on public.financial_goals;
create policy "financial_goals_update_own"
on public.financial_goals
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "financial_goals_delete_own" on public.financial_goals;
create policy "financial_goals_delete_own"
on public.financial_goals
for delete
using (auth.uid() = user_id);
