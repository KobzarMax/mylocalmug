-- Category-owned menu placeholder icons and safe public exposure.
-- Apply after Drizzle migration 0009 and Supabase migration 013.

create or replace function public.save_menu_category(
  target_business_id uuid,
  target_category_id uuid,
  proposed_name text,
  proposed_icon_key text,
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
  if proposed_icon_key is null or proposed_icon_key not in (
    'coffee','tea','cold_drink','alcoholic_drink','breakfast','sandwich','bakery',
    'dessert','meal','pizza','healthy','ice_cream','other'
  ) then
    raise exception 'Category icon is invalid';
  end if;
  normalized_name := lower(clean_name);

  if target_category_id is not null then
    select * into current_category
    from public.menu_categories
    where id = target_category_id and business_id = target_business_id
    for update;
    if current_category.id is null then raise exception 'Menu category was not found'; end if;
  end if;

  if exists (
    select 1 from public.menu_categories category
    where category.business_id = target_business_id
      and (target_category_id is null or category.id <> target_category_id)
      and lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')) = normalized_name
  ) then
    raise exception 'A category with this name already exists';
  end if;

  if not allow_similar and char_length(normalized_name) >= 3 and exists (
    select 1 from public.menu_categories category
    where category.business_id = target_business_id
      and (target_category_id is null or category.id <> target_category_id)
      and extensions.similarity(
        lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g')),
        normalized_name
      ) >= 0.55
  ) then
    raise exception 'A similar category already exists. Review it before continuing';
  end if;

  begin
    if target_category_id is null then
      insert into public.menu_categories (business_id, name, icon_key, sort_order)
      values (
        target_business_id,
        clean_name,
        proposed_icon_key,
        coalesce((select max(sort_order) + 1 from public.menu_categories where business_id = target_business_id), 0)
      ) returning * into result;
    else
      update public.menu_categories
      set name = clean_name, icon_key = proposed_icon_key
      where id = target_category_id and business_id = target_business_id
      returning * into result;
    end if;
  exception when unique_violation then
    raise exception 'A category with this name already exists';
  end;
  return result;
end;
$$;

-- Compatibility wrapper for an app version released before category icons.
create or replace function public.save_menu_category(
  target_business_id uuid,
  target_category_id uuid,
  proposed_name text,
  allow_similar boolean default false
)
returns public.menu_categories
language plpgsql
security definer
set search_path = public
as $$
declare
  retained_icon text := 'other';
begin
  if target_category_id is not null then
    select icon_key into retained_icon
    from public.menu_categories
    where id = target_category_id and business_id = target_business_id;
    retained_icon := coalesce(retained_icon, 'other');
  end if;
  return public.save_menu_category(
    target_business_id,
    target_category_id,
    proposed_name,
    retained_icon,
    allow_similar
  );
end;
$$;

create or replace function public.add_default_menu_categories(target_business_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare inserted_count integer;
begin
  if not public.has_business_permission(target_business_id, 'menu.manage') then
    raise exception 'You do not have permission to manage this menu';
  end if;
  if exists (select 1 from public.menu_categories where business_id = target_business_id) then return 0; end if;
  insert into public.menu_categories (business_id, name, icon_key, sort_order)
  select target_business_id, category.name, category.icon_key, category.sort_order
  from (values
    ('Coffee', 'coffee', 0),
    ('Tea & hot drinks', 'tea', 1),
    ('Cold drinks', 'cold_drink', 2),
    ('Food', 'meal', 3),
    ('Cakes & treats', 'dessert', 4)
  ) as category(name, icon_key, sort_order);
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.handle_new_business_default_menu_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.menu_categories (business_id, name, icon_key, sort_order)
  values
    (new.id, 'Coffee', 'coffee', 0),
    (new.id, 'Tea & hot drinks', 'tea', 1),
    (new.id, 'Cold drinks', 'cold_drink', 2),
    (new.id, 'Food', 'meal', 3),
    (new.id, 'Cakes & treats', 'dessert', 4);
  return new;
end;
$$;

drop function if exists public.get_public_business_menu(uuid);
create function public.get_public_business_menu(target_business_id uuid)
returns table(
  category_id uuid, category_name text, category_sort_order integer, category_icon_key text,
  item_id uuid, item_name text, item_description text, item_price numeric,
  item_photo_url text, item_created_at timestamptz, event_id uuid, event_title text,
  event_badge text, event_message text, event_available_from timestamptz, event_available_until timestamptz
)
language sql stable security definer set search_path=public as $$
  select menu_row.*
  from (
  select c.id, c.name, c.sort_order, c.icon_key,
    i.id, i.name, i.description, i.price, i.photo_url, i.created_at,
    case when p.id is not null then e.event_id end, p.title,
    case when p.id is not null then e.badge end,
    case when p.id is not null then e.message end,
    case when p.id is not null then e.available_from end,
    case when p.id is not null then e.available_until end
  from public.businesses b
  join public.menu_categories c on c.business_id=b.id
  left join public.menu_items i on i.category_id=c.id and i.business_id=b.id and i.is_available
  left join public.event_menu_items e on e.menu_item_id=i.id and e.available_from<=now() and e.available_until>now()
  left join public.posts p on p.id=e.event_id and p.kind='event' and p.published_at<=now() and p.archived_at is null and p.event_cancelled_at is null
  where b.id=target_business_id and b.is_published and b.status='active'
    and (i.id is null or not exists(
      select 1 from public.event_menu_items eo join public.posts po on po.id=eo.event_id
      where eo.menu_item_id=i.id and eo.event_only
        and (eo.available_from>now() or eo.available_until<=now() or po.published_at is null or po.published_at>now() or po.event_cancelled_at is not null or po.archived_at is not null)
    ))
  union all
  select null::uuid, 'Other'::text, 2147483647, 'other'::text,
    i.id, i.name, i.description, i.price, i.photo_url, i.created_at,
    case when p.id is not null then e.event_id end, p.title,
    case when p.id is not null then e.badge end,
    case when p.id is not null then e.message end,
    case when p.id is not null then e.available_from end,
    case when p.id is not null then e.available_until end
  from public.businesses b
  join public.menu_items i on i.business_id=b.id and i.category_id is null and i.is_available
  left join public.event_menu_items e on e.menu_item_id=i.id and e.available_from<=now() and e.available_until>now()
  left join public.posts p on p.id=e.event_id and p.kind='event' and p.published_at<=now() and p.archived_at is null and p.event_cancelled_at is null
  where b.id=target_business_id and b.is_published and b.status='active'
    and not exists(
      select 1 from public.event_menu_items eo join public.posts po on po.id=eo.event_id
      where eo.menu_item_id=i.id and eo.event_only
        and (eo.available_from>now() or eo.available_until<=now() or po.published_at is null or po.published_at>now() or po.event_cancelled_at is not null or po.archived_at is not null)
    )
  ) as menu_row(
    category_id, category_name, category_sort_order, category_icon_key,
    item_id, item_name, item_description, item_price, item_photo_url, item_created_at,
    event_id, event_title, event_badge, event_message, event_available_from, event_available_until
  )
  order by menu_row.category_sort_order, menu_row.category_name, menu_row.item_created_at, menu_row.item_id;
$$;

revoke all on function public.save_menu_category(uuid, uuid, text, text, boolean) from public;
revoke execute on function public.save_menu_category(uuid, uuid, text, text, boolean) from anon;
grant execute on function public.save_menu_category(uuid, uuid, text, text, boolean) to authenticated;
revoke execute on function public.save_menu_category(uuid, uuid, text, boolean) from anon;
grant execute on function public.save_menu_category(uuid, uuid, text, boolean) to authenticated;
revoke all on function public.get_public_business_menu(uuid) from public;
grant execute on function public.get_public_business_menu(uuid) to anon, authenticated;
