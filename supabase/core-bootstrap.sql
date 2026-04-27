-- ============================================================
-- FinGlow - Bootstrap do nucleo do sistema
-- ============================================================
-- Use este arquivo para criar apenas a base do sistema:
-- profiles, categories, transactions e budgets.
--
-- Execute no SQL Editor do Supabase se as tabelas principais
-- ainda nao existirem ou se o schema completo nao tiver rodado.
-- ============================================================

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'transaction_type'
  ) then
    create type public.transaction_type as enum ('income', 'expense');
  end if;
end
$$;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type public.transaction_type not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_name_length check (char_length(trim(name)) between 2 and 60)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  description text not null,
  amount numeric(12, 2) not null,
  type public.transaction_type not null,
  transaction_date date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint transactions_amount_positive check (amount > 0),
  constraint transactions_description_length check (char_length(trim(description)) between 3 and 120),
  constraint transactions_notes_length check (notes is null or char_length(notes) <= 280)
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month smallint not null,
  year integer not null,
  limit_amount numeric(12, 2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint budgets_month_valid check (month between 1 and 12),
  constraint budgets_year_valid check (year between 2000 and 2100),
  constraint budgets_limit_positive check (limit_amount > 0),
  constraint budgets_unique_per_month unique (user_id, category_id, month, year)
);

create unique index if not exists categories_user_type_lower_name_unique
  on public.categories (user_id, type, lower(name));

create index if not exists categories_user_type_idx
  on public.categories (user_id, type);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);

create index if not exists transactions_user_type_date_idx
  on public.transactions (user_id, type, transaction_date desc);

create index if not exists transactions_user_category_date_idx
  on public.transactions (user_id, category_id, transaction_date desc);

create index if not exists budgets_user_period_idx
  on public.budgets (user_id, year, month);

create index if not exists budgets_user_category_period_idx
  on public.budgets (user_id, category_id, year, month);

create or replace function public.validate_transaction_category_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_owner uuid;
  category_type public.transaction_type;
begin
  select c.user_id, c.type
    into category_owner, category_type
  from public.categories c
  where c.id = new.category_id;

  if category_owner is null then
    raise exception 'Categoria nao encontrada.';
  end if;

  if category_owner <> new.user_id then
    raise exception 'A categoria informada nao pertence ao usuario autenticado.';
  end if;

  if category_type <> new.type then
    raise exception 'Tipo da categoria diferente do tipo da transacao.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_budget_category_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_owner uuid;
  category_type public.transaction_type;
begin
  select c.user_id, c.type
    into category_owner, category_type
  from public.categories c
  where c.id = new.category_id;

  if category_owner is null then
    raise exception 'Categoria nao encontrada.';
  end if;

  if category_owner <> new.user_id then
    raise exception 'A categoria do orcamento nao pertence ao usuario.';
  end if;

  if category_type <> 'expense' then
    raise exception 'Orcamentos so podem ser criados para categorias de despesa.';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = timezone('utc', now());

  insert into public.categories (user_id, name, type)
  values
    (new.id, 'Salario', 'income'),
    (new.id, 'Freelance', 'income'),
    (new.id, 'Investimentos', 'income'),
    (new.id, 'Outras receitas', 'income'),
    (new.id, 'Moradia', 'expense'),
    (new.id, 'Alimentacao', 'expense'),
    (new.id, 'Transporte', 'expense'),
    (new.id, 'Saude', 'expense'),
    (new.id, 'Lazer', 'expense'),
    (new.id, 'Educacao', 'expense')
  on conflict do nothing;

  return new;
end;
$$;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email = coalesce(new.email, public.profiles.email),
         full_name = coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), public.profiles.full_name),
         updated_at = timezone('utc', now())
   where id = new.id;

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at
before update on public.budgets
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists validate_transactions_before_write on public.transactions;
create trigger validate_transactions_before_write
before insert or update on public.transactions
for each row
execute function public.validate_transaction_category_consistency();

drop trigger if exists validate_budgets_before_write on public.budgets;
create trigger validate_budgets_before_write
before insert or update on public.budgets
for each row
execute function public.validate_budget_category_consistency();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row
execute function public.sync_profile_from_auth_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

alter table public.profiles force row level security;
alter table public.categories force row level security;
alter table public.transactions force row level security;
alter table public.budgets force row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own"
on public.categories
for select
using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
on public.categories
for insert
with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
on public.categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own"
on public.categories
for delete
using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions
for select
using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions
for insert
with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
on public.transactions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
on public.transactions
for delete
using (auth.uid() = user_id);

drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own"
on public.budgets
for select
using (auth.uid() = user_id);

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own"
on public.budgets
for insert
with check (auth.uid() = user_id);

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own"
on public.budgets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own"
on public.budgets
for delete
using (auth.uid() = user_id);
