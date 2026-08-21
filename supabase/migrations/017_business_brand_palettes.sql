-- Safe public exposure of validated business brand palettes.
-- Apply after Drizzle migration 0010.

drop function if exists public.get_public_business_catalog(text, text, uuid, integer);
create function public.get_public_business_catalog(
  search_text text default null,
  cursor_name text default null,
  cursor_id uuid default null,
  page_size integer default 20
)
returns table (
  id uuid, name text, description text, category text, address text, logo_url text, header_url text,
  brand_primary_color text, brand_accent_color text, brand_background_color text,
  rating numeric, review_count bigint
)
language sql stable security definer set search_path = public as $$
  select business.id, business.name, business.description, business.category,
    coalesce(primary_location.address, business.address), business.logo_url, business.header_url,
    business.brand_primary_color, business.brand_accent_color, business.brand_background_color,
    review_summary.rating, coalesce(review_summary.review_count, 0)
  from public.businesses business
  left join lateral (
    select location.address from public.business_locations location
    where location.business_id = business.id
    order by location.is_primary desc, location.created_at asc limit 1
  ) primary_location on true
  left join lateral (
    select round(avg(review.rating)::numeric, 1) as rating, count(*) as review_count
    from public.reviews review where review.business_id = business.id and review.target = 'business'
  ) review_summary on true
  where business.is_published and business.status = 'active'
    and (
      nullif(btrim(coalesce(search_text, '')), '') is null
      or position(lower(btrim(search_text)) in lower(business.name)) > 0
      or position(lower(btrim(search_text)) in lower(business.category)) > 0
      or exists (
        select 1 from public.menu_items item where item.business_id = business.id and item.is_available
          and position(lower(btrim(search_text)) in lower(item.name)) > 0
      )
    )
    and (cursor_name is null or (lower(business.name), business.id) > (lower(cursor_name), cursor_id))
  order by lower(business.name), business.id
  limit greatest(1, least(coalesce(page_size, 20), 40));
$$;

drop function if exists public.get_public_business_detail(uuid);
create function public.get_public_business_detail(target_business_id uuid)
returns table (
  id uuid, name text, description text, category text, address text, phone text, website_url text,
  social_links jsonb, logo_url text, header_url text,
  brand_primary_color text, brand_accent_color text, brand_background_color text,
  timezone text, rating numeric, review_count bigint, hours jsonb
)
language sql stable security definer set search_path = public as $$
  select business.id, business.name, business.description, business.category,
    coalesce(primary_location.address, business.address),
    coalesce(primary_location.phone, business.contact_phone), business.website_url, business.social_links,
    business.logo_url, business.header_url,
    business.brand_primary_color, business.brand_accent_color, business.brand_background_color,
    coalesce(primary_location.timezone, 'Europe/London'), review_summary.rating,
    coalesce(review_summary.review_count, 0), coalesce(hours.values, '[]'::jsonb)
  from public.businesses business
  left join lateral (
    select location.id, location.address, location.phone, location.timezone
    from public.business_locations location where location.business_id = business.id
    order by location.is_primary desc, location.created_at asc limit 1
  ) primary_location on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'dayOfWeek', business_hour.day_of_week, 'opensAt', business_hour.opens_at,
      'closesAt', business_hour.closes_at, 'isClosed', business_hour.is_closed
    ) order by business_hour.day_of_week) as values
    from public.business_hours business_hour where business_hour.location_id = primary_location.id
  ) hours on true
  left join lateral (
    select round(avg(review.rating)::numeric, 1) as rating, count(*) as review_count
    from public.reviews review where review.business_id = business.id and review.target = 'business'
  ) review_summary on true
  where business.id = target_business_id and business.is_published and business.status = 'active';
$$;

drop function if exists public.get_public_content_feed(uuid, uuid, text, boolean, boolean, timestamptz, uuid, integer);
create function public.get_public_content_feed(
  target_business_id uuid default null,
  target_post_id uuid default null,
  requested_kind text default null,
  followed_only boolean default false,
  cursor_pinned boolean default null,
  cursor_published_at timestamptz default null,
  cursor_id uuid default null,
  page_size integer default 20
)
returns table (
  id uuid, business_id uuid, business_name text, business_logo_url text,
  business_brand_primary_color text, business_brand_accent_color text, business_brand_background_color text,
  kind public.post_kind, title text, excerpt text, body_document jsonb, body_text text, cover_path text,
  author_display_name text, event_starts_at timestamptz, event_ends_at timestamptz, event_all_day boolean,
  event_timezone text, event_venue_name text, event_venue_address text, event_cancelled_at timestamptz,
  event_cancellation_reason text, reminder_minutes integer[], is_pinned boolean, published_at timestamptz,
  archived_at timestamptz, created_at timestamptz, updated_at timestamptz
)
language sql stable security definer set search_path = public as $$
  with visible as (
    select post.*, business.name as business_name_value, business.logo_url as business_logo_value,
      business.brand_primary_color as brand_primary_value,
      business.brand_accent_color as brand_accent_value,
      business.brand_background_color as brand_background_value,
      case when post.is_pinned and post.kind = 'event' and post.event_starts_at > now() then 1 else 0 end as pin_rank
    from public.posts post join public.businesses business on business.id = post.business_id
    where business.is_published and business.status = 'active'
      and post.published_at is not null and post.published_at <= now()
      and post.archived_at is null
      and (target_business_id is null or post.business_id = target_business_id)
      and (target_post_id is null or post.id = target_post_id)
      and (requested_kind is null or post.kind::text = requested_kind)
      and (not followed_only or exists (
        select 1 from public.business_followers follower
        where follower.business_id = post.business_id and follower.client_id = (select auth.uid())
      ))
  )
  select visible.id, visible.business_id, visible.business_name_value, visible.business_logo_value,
    visible.brand_primary_value, visible.brand_accent_value, visible.brand_background_value,
    visible.kind, visible.title, visible.excerpt, visible.body_document, visible.body_text, visible.cover_path,
    visible.author_display_name, visible.event_starts_at, visible.event_ends_at, visible.event_all_day,
    visible.event_timezone, visible.event_venue_name, visible.event_venue_address, visible.event_cancelled_at,
    visible.event_cancellation_reason,
    coalesce((select array_agg(reminder.minutes_before order by reminder.minutes_before desc)
      from public.post_event_reminders reminder where reminder.post_id = visible.id), '{}'),
    visible.is_pinned, visible.published_at, visible.archived_at, visible.created_at, visible.updated_at
  from visible
  where cursor_pinned is null or (visible.pin_rank, visible.published_at, visible.id)
    < (case when cursor_pinned then 1 else 0 end, cursor_published_at, cursor_id)
  order by visible.pin_rank desc, visible.published_at desc, visible.id desc
  limit greatest(1, least(coalesce(page_size, 20), 50));
$$;

revoke all on function public.get_public_business_catalog(text, text, uuid, integer) from public;
revoke all on function public.get_public_business_detail(uuid) from public;
revoke all on function public.get_public_content_feed(uuid, uuid, text, boolean, boolean, timestamptz, uuid, integer) from public;
grant execute on function public.get_public_business_catalog(text, text, uuid, integer) to anon, authenticated;
grant execute on function public.get_public_business_detail(uuid) to anon, authenticated;
grant execute on function public.get_public_content_feed(uuid, uuid, text, boolean, boolean, timestamptz, uuid, integer) to anon, authenticated;
