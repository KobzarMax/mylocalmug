-- Trusted category management, normalized duplicate protection, and similar-name guidance.
-- Apply after Drizzle migration 0008 and Supabase migration 011.

create extension if not exists pg_trgm with schema extensions;

create or replace function public.check_menu_category_name(
  target_business_id uuid,
  proposed_name text,
  excluded_category_id uuid default null
)
returns table (
  category_id uuid,
  category_name text,
  match_kind text,
  similarity_score double precision
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  clean_name text := regexp_replace(btrim(coalesce(proposed_name, '')), '[[:space:]]+', ' ', 'g');
  normalized_name text;
begin
  if not public.has_business_permission(target_business_id, 'menu.manage') then
    raise exception 'You do not have permission to manage this menu';
  end if;

  if clean_name = '' or char_length(clean_name) > 60 or clean_name ~ '[[:cntrl:]]' then
    raise exception 'Category name is invalid';
  end if;

  normalized_name := lower(clean_name);
  return query
  select
    category.id,
    category.name,
    case
      when lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')) = normalized_name
        then 'exact'
      else 'similar'
    end,
    case
      when lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')) = normalized_name
        then 1::double precision
      else extensions.similarity(
        lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')),
        normalized_name
      )::double precision
    end
  from public.menu_categories category
  where category.business_id = target_business_id
    and (excluded_category_id is null or category.id <> excluded_category_id)
    and (
      lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')) = normalized_name
      or (
        char_length(normalized_name) >= 3
        and extensions.similarity(
          lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')),
          normalized_name
        ) >= 0.55
      )
    )
  order by
    (lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')) = normalized_name) desc,
    extensions.similarity(
      lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')),
      normalized_name
    ) desc,
    category.sort_order,
    category.id
  limit 3;
end;
$$;

create or replace function public.save_menu_category(
  target_business_id uuid,
  target_category_id uuid,
  proposed_name text,
  allow_similar boolean default false
)
returns public.menu_categories
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  clean_name text := regexp_replace(btrim(coalesce(proposed_name, '')), '[[:space:]]+', ' ', 'g');
  normalized_name text;
  current_category public.menu_categories;
  result public.menu_categories;
begin
  if not public.has_business_permission(target_business_id, 'menu.manage') then
    raise exception 'You do not have permission to manage this menu';
  end if;

  if clean_name = '' then raise exception 'Category name is required'; end if;
  if char_length(clean_name) > 60 then raise exception 'Category name must be 60 characters or fewer'; end if;
  if clean_name ~ '[[:cntrl:]]' then raise exception 'Category name contains unsupported characters'; end if;
  normalized_name := lower(clean_name);

  if target_category_id is not null then
    select * into current_category
    from public.menu_categories
    where id = target_category_id and business_id = target_business_id
    for update;
    if current_category.id is null then raise exception 'Menu category was not found'; end if;
  end if;

  if exists (
    select 1
    from public.menu_categories category
    where category.business_id = target_business_id
      and (target_category_id is null or category.id <> target_category_id)
      and lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')) = normalized_name
  ) then
    raise exception 'A category with this name already exists';
  end if;

  if not allow_similar
    and char_length(normalized_name) >= 3
    and exists (
      select 1
      from public.menu_categories category
      where category.business_id = target_business_id
        and (target_category_id is null or category.id <> target_category_id)
        and extensions.similarity(
          lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')),
          normalized_name
        ) >= 0.55
    )
  then
    raise exception 'A similar category already exists. Review it before continuing';
  end if;

  begin
    if target_category_id is null then
      insert into public.menu_categories (business_id, name, sort_order)
      values (
        target_business_id,
        clean_name,
        coalesce((select max(sort_order) + 1 from public.menu_categories where business_id = target_business_id), 0)
      )
      returning * into result;
    else
      update public.menu_categories
      set name = clean_name
      where id = target_category_id and business_id = target_business_id
      returning * into result;
    end if;
  exception when unique_violation then
    raise exception 'A category with this name already exists';
  end;

  return result;
end;
$$;

create or replace function public.reorder_menu_categories(
  target_business_id uuid,
  ordered_category_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  supplied_count integer := coalesce(cardinality(ordered_category_ids), 0);
  distinct_count integer;
begin
  if not public.has_business_permission(target_business_id, 'menu.manage') then
    raise exception 'You do not have permission to manage this menu';
  end if;

  perform 1 from public.menu_categories where business_id = target_business_id for update;
  select count(*) into current_count from public.menu_categories where business_id = target_business_id;
  select count(distinct supplied.category_id) into distinct_count
  from unnest(coalesce(ordered_category_ids, array[]::uuid[])) as supplied(category_id);

  if supplied_count <> current_count or distinct_count <> current_count then
    raise exception 'Category order must contain every category exactly once';
  end if;
  if exists (
    select 1
    from unnest(coalesce(ordered_category_ids, array[]::uuid[])) as supplied(category_id)
    where not exists (
      select 1 from public.menu_categories category
      where category.id = supplied.category_id and category.business_id = target_business_id
    )
  ) then
    raise exception 'Category order contains an invalid category';
  end if;

  update public.menu_categories category
  set sort_order = (ordered.position - 1)::integer
  from unnest(coalesce(ordered_category_ids, array[]::uuid[])) with ordinality
    as ordered(category_id, position)
  where category.id = ordered.category_id and category.business_id = target_business_id;
end;
$$;

revoke insert, update, delete on table public.menu_categories from authenticated;
revoke all on function public.check_menu_category_name(uuid, text, uuid) from public;
revoke all on function public.save_menu_category(uuid, uuid, text, boolean) from public;
revoke all on function public.reorder_menu_categories(uuid, uuid[]) from public;
grant execute on function public.check_menu_category_name(uuid, text, uuid) to authenticated;
grant execute on function public.save_menu_category(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.reorder_menu_categories(uuid, uuid[]) to authenticated;
