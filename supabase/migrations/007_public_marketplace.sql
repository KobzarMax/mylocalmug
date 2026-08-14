-- Safe public marketplace reads for published shops and available menu items.
-- No Drizzle migration is required because no table shape changes.

drop policy if exists "published menu items are readable" on public.menu_items;
create policy "published available menu items are readable" on public.menu_items for select
  using (
    public.has_business_permission(business_id, 'menu.manage')
    or (
      is_available
      and exists (
        select 1 from public.businesses business
        where business.id = menu_items.business_id
          and business.is_published
          and business.status = 'active'
      )
    )
  );

create or replace function public.get_public_business_catalog(
  search_text text default null,
  cursor_name text default null,
  cursor_id uuid default null,
  page_size integer default 20
)
returns table (
  id uuid,
  name text,
  description text,
  category text,
  address text,
  logo_url text,
  header_url text,
  rating numeric,
  review_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    business.id,
    business.name,
    business.description,
    business.category,
    coalesce(primary_location.address, business.address),
    business.logo_url,
    business.header_url,
    review_summary.rating,
    coalesce(review_summary.review_count, 0)
  from public.businesses business
  left join lateral (
    select location.address
    from public.business_locations location
    where location.business_id = business.id
    order by location.is_primary desc, location.created_at asc
    limit 1
  ) primary_location on true
  left join lateral (
    select round(avg(review.rating)::numeric, 1) as rating, count(*) as review_count
    from public.reviews review
    where review.business_id = business.id and review.target = 'business'
  ) review_summary on true
  where business.is_published and business.status = 'active'
    and (
      nullif(btrim(coalesce(search_text, '')), '') is null
      or position(lower(btrim(search_text)) in lower(business.name)) > 0
      or position(lower(btrim(search_text)) in lower(business.category)) > 0
      or exists (
        select 1 from public.menu_items item
        where item.business_id = business.id
          and item.is_available
          and position(lower(btrim(search_text)) in lower(item.name)) > 0
      )
    )
    and (
      cursor_name is null
      or (lower(business.name), business.id) > (lower(cursor_name), cursor_id)
    )
  order by lower(business.name), business.id
  limit greatest(1, least(coalesce(page_size, 20), 40));
$$;

create or replace function public.get_public_business_detail(target_business_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  category text,
  address text,
  phone text,
  website_url text,
  social_links jsonb,
  logo_url text,
  header_url text,
  timezone text,
  rating numeric,
  review_count bigint,
  hours jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    business.id,
    business.name,
    business.description,
    business.category,
    coalesce(primary_location.address, business.address),
    coalesce(primary_location.phone, business.contact_phone),
    business.website_url,
    business.social_links,
    business.logo_url,
    business.header_url,
    coalesce(primary_location.timezone, 'Europe/London'),
    review_summary.rating,
    coalesce(review_summary.review_count, 0),
    coalesce(hours.values, '[]'::jsonb)
  from public.businesses business
  left join lateral (
    select location.id, location.address, location.phone, location.timezone
    from public.business_locations location
    where location.business_id = business.id
    order by location.is_primary desc, location.created_at asc
    limit 1
  ) primary_location on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'dayOfWeek', business_hour.day_of_week,
      'opensAt', business_hour.opens_at,
      'closesAt', business_hour.closes_at,
      'isClosed', business_hour.is_closed
    ) order by business_hour.day_of_week) as values
    from public.business_hours business_hour
    where business_hour.location_id = primary_location.id
  ) hours on true
  left join lateral (
    select round(avg(review.rating)::numeric, 1) as rating, count(*) as review_count
    from public.reviews review
    where review.business_id = business.id and review.target = 'business'
  ) review_summary on true
  where business.id = target_business_id
    and business.is_published
    and business.status = 'active';
$$;

create or replace function public.get_public_business_menu(target_business_id uuid)
returns table (
  category_id uuid,
  category_name text,
  category_sort_order integer,
  item_id uuid,
  item_name text,
  item_description text,
  item_price numeric,
  item_photo_url text,
  item_created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select menu_row.*
  from (
    select
      category.id as category_id,
      category.name as category_name,
      category.sort_order as category_sort_order,
      item.id as item_id,
      item.name as item_name,
      item.description as item_description,
      item.price as item_price,
      item.photo_url as item_photo_url,
      item.created_at as item_created_at
    from public.businesses business
    join public.menu_categories category on category.business_id = business.id
    left join public.menu_items item
      on item.category_id = category.id
      and item.business_id = business.id
      and item.is_available
    where business.id = target_business_id
      and business.is_published
      and business.status = 'active'
    union all
    select
      null::uuid,
      'Other'::text,
      2147483647,
      item.id,
      item.name,
      item.description,
      item.price,
      item.photo_url,
      item.created_at
    from public.businesses business
    join public.menu_items item
      on item.business_id = business.id
      and item.category_id is null
      and item.is_available
    where business.id = target_business_id
      and business.is_published
      and business.status = 'active'
  ) menu_row
  order by menu_row.category_sort_order, menu_row.category_name, menu_row.item_created_at, menu_row.item_id;
$$;

revoke all on function public.get_public_business_catalog(text, text, uuid, integer) from public;
revoke all on function public.get_public_business_detail(uuid) from public;
revoke all on function public.get_public_business_menu(uuid) from public;
grant execute on function public.get_public_business_catalog(text, text, uuid, integer) to anon, authenticated;
grant execute on function public.get_public_business_detail(uuid) to anon, authenticated;
grant execute on function public.get_public_business_menu(uuid) to anon, authenticated;
