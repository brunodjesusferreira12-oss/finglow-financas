-- ============================================================
-- Modulo de cartoes de credito
-- Execute este arquivo no SQL Editor do Supabase se a rota /cartoes
-- estiver mostrando erro ao cadastrar cartao.
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

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  last_four text,
  closing_day smallint not null,
  due_day smallint not null,
  limit_amount numeric(12, 2) not null default 0,
  color text not null default '#0f766e',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint credit_cards_name_length check (char_length(trim(name)) between 2 and 80),
  constraint credit_cards_last_four_valid check (last_four is null or last_four ~ '^[0-9]{4}$'),
  constraint credit_cards_closing_day_valid check (closing_day between 1 and 31),
  constraint credit_cards_due_day_valid check (due_day between 1 and 31),
  constraint credit_cards_limit_non_negative check (limit_amount >= 0),
  constraint credit_cards_color_valid check (color ~ '^#[0-9A-Fa-f]{6}$')
);

create table if not exists public.credit_card_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid not null references public.credit_cards (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  description text not null,
  amount_total numeric(12, 2) not null,
  purchase_date date not null,
  installments_count smallint not null default 1,
  is_fixed boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint credit_card_purchases_description_length check (char_length(trim(description)) between 3 and 120),
  constraint credit_card_purchases_amount_positive check (amount_total > 0),
  constraint credit_card_purchases_installments_valid check (installments_count between 1 and 360),
  constraint credit_card_purchases_fixed_single_installment check (is_fixed = false or installments_count = 1),
  constraint credit_card_purchases_notes_length check (notes is null or char_length(notes) <= 280)
);

create index if not exists credit_cards_user_idx
  on public.credit_cards (user_id, updated_at desc);

create index if not exists credit_card_purchases_user_date_idx
  on public.credit_card_purchases (user_id, purchase_date desc);

create index if not exists credit_card_purchases_user_card_idx
  on public.credit_card_purchases (user_id, card_id, purchase_date desc);

create index if not exists credit_card_purchases_user_category_idx
  on public.credit_card_purchases (user_id, category_id, purchase_date desc);

create or replace function public.validate_credit_card_purchase_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  card_owner uuid;
  category_owner uuid;
  category_type public.transaction_type;
begin
  select user_id
    into card_owner
  from public.credit_cards
  where id = new.card_id;

  if card_owner is null then
    raise exception 'Cartao nao encontrado.';
  end if;

  if card_owner <> new.user_id then
    raise exception 'O cartao informado nao pertence ao usuario autenticado.';
  end if;

  select user_id, type
    into category_owner, category_type
  from public.categories
  where id = new.category_id;

  if category_owner is null then
    raise exception 'Categoria nao encontrada.';
  end if;

  if category_owner <> new.user_id then
    raise exception 'A categoria informada nao pertence ao usuario autenticado.';
  end if;

  if category_type <> 'expense' then
    raise exception 'Compras de cartao precisam usar categorias de despesa.';
  end if;

  return new;
end;
$$;

drop trigger if exists set_credit_cards_updated_at on public.credit_cards;
create trigger set_credit_cards_updated_at
before update on public.credit_cards
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_credit_card_purchases_updated_at on public.credit_card_purchases;
create trigger set_credit_card_purchases_updated_at
before update on public.credit_card_purchases
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists validate_credit_card_purchases_before_write on public.credit_card_purchases;
create trigger validate_credit_card_purchases_before_write
before insert or update on public.credit_card_purchases
for each row
execute function public.validate_credit_card_purchase_consistency();

alter table public.credit_cards enable row level security;
alter table public.credit_card_purchases enable row level security;

alter table public.credit_cards force row level security;
alter table public.credit_card_purchases force row level security;

drop policy if exists "credit_cards_select_own" on public.credit_cards;
create policy "credit_cards_select_own"
on public.credit_cards
for select
using (auth.uid() = user_id);

drop policy if exists "credit_cards_insert_own" on public.credit_cards;
create policy "credit_cards_insert_own"
on public.credit_cards
for insert
with check (auth.uid() = user_id);

drop policy if exists "credit_cards_update_own" on public.credit_cards;
create policy "credit_cards_update_own"
on public.credit_cards
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "credit_cards_delete_own" on public.credit_cards;
create policy "credit_cards_delete_own"
on public.credit_cards
for delete
using (auth.uid() = user_id);

drop policy if exists "credit_card_purchases_select_own" on public.credit_card_purchases;
create policy "credit_card_purchases_select_own"
on public.credit_card_purchases
for select
using (auth.uid() = user_id);

drop policy if exists "credit_card_purchases_insert_own" on public.credit_card_purchases;
create policy "credit_card_purchases_insert_own"
on public.credit_card_purchases
for insert
with check (auth.uid() = user_id);

drop policy if exists "credit_card_purchases_update_own" on public.credit_card_purchases;
create policy "credit_card_purchases_update_own"
on public.credit_card_purchases
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "credit_card_purchases_delete_own" on public.credit_card_purchases;
create policy "credit_card_purchases_delete_own"
on public.credit_card_purchases
for delete
using (auth.uid() = user_id);
