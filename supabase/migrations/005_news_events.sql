-- News/events lifecycle, public feeds, following preferences, push devices, and content media.
-- Apply after drizzle/0004_sticky_the_twelve.sql and supabase/004_menu_management.sql.

create extension if not exists "pgcrypto";

alter table public.post_event_reminders enable row level security;
alter table public.push_devices enable row level security;
alter table public.event_notification_jobs enable row level security;
alter table public.push_deliveries enable row level security;

drop policy if exists "published posts are readable" on public.posts;
drop policy if exists "members manage posts" on public.posts;

create policy "public reads published content" on public.posts for select
  using (
    (
      published_at is not null
      and published_at <= now()
      and archived_at is null
      and exists (
        select 1 from public.businesses business
        where business.id = posts.business_id and business.is_published
      )
    )
    or public.has_business_permission(business_id, 'content.manage')
  );

create policy "content managers read reminders" on public.post_event_reminders for select
  using (exists (
    select 1 from public.posts post
    where post.id = post_id
      and public.has_business_permission(post.business_id, 'content.manage')
  ));

create policy "users read own push devices" on public.push_devices for select
  using (profile_id = (select auth.uid()));

drop policy if exists "followers are readable by participants" on public.business_followers;
drop policy if exists "clients follow businesses" on public.business_followers;
drop policy if exists "clients unfollow businesses" on public.business_followers;

create policy "followers are readable by participants" on public.business_followers for select
  using (
    client_id = (select auth.uid())
    or public.has_business_permission(business_id, 'business.profile.read')
  );
create policy "customers follow published businesses" on public.business_followers for insert
  with check (
    client_id = (select auth.uid())
    and exists (
      select 1 from public.businesses business
      where business.id = business_followers.business_id and business.is_published
    )
  );
create policy "customers update own follow preferences" on public.business_followers for update
  using (client_id = (select auth.uid()))
  with check (client_id = (select auth.uid()));
create policy "customers unfollow businesses" on public.business_followers for delete
  using (client_id = (select auth.uid()));

revoke select on table public.posts from anon, authenticated;
grant select (
  id, business_id, kind, title, excerpt, body_document, body_text, cover_path,
  author_display_name, event_starts_at, event_ends_at, event_all_day,
  event_timezone, event_venue_name, event_venue_address, event_cancelled_at,
  event_cancellation_reason, event_notification_version, is_pinned,
  published_at, archived_at, created_at, updated_at
) on table public.posts to anon, authenticated;
grant select on table public.post_event_reminders to authenticated;
grant select, insert, delete on table public.business_followers to authenticated;
revoke update on table public.business_followers from authenticated;
grant update (event_notifications_enabled) on table public.business_followers to authenticated;
grant select on table public.push_devices to authenticated;
revoke insert, update, delete on table public.posts from authenticated;
revoke insert, update, delete on table public.post_event_reminders from authenticated;
revoke all on table public.event_notification_jobs, public.push_deliveries from anon, authenticated;

create or replace function public.rebuild_event_reminder_jobs(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  event_post public.posts;
begin
  update public.event_notification_jobs
  set status = 'cancelled', processed_at = now()
  where post_id = target_post_id
    and job_type = 'reminder'
    and status in ('pending', 'processing');

  select * into event_post from public.posts where id = target_post_id;
  if event_post.id is null
    or event_post.kind <> 'event'
    or event_post.published_at is null
    or event_post.archived_at is not null
    or event_post.event_cancelled_at is not null then
    return;
  end if;

  insert into public.event_notification_jobs (
    post_id, job_type, reminder_minutes, event_version, due_at, status
  )
  select
    event_post.id,
    'reminder'::public.event_notification_job_type,
    reminder.minutes_before,
    event_post.event_notification_version,
    event_post.event_starts_at - make_interval(mins => reminder.minutes_before),
    'pending'::public.notification_job_status
  from public.post_event_reminders reminder
  where reminder.post_id = event_post.id
    and event_post.event_starts_at - make_interval(mins => reminder.minutes_before)
      > greatest(now(), event_post.published_at)
  on conflict (post_id, job_type, event_version, reminder_minutes)
  do update set
    due_at = excluded.due_at,
    status = 'pending',
    attempts = 0,
    next_attempt_at = null,
    last_error = null,
    processed_at = null;
end;
$$;

revoke all on function public.rebuild_event_reminder_jobs(uuid) from public, anon, authenticated;

create or replace function public.save_business_content(
  target_post_id uuid,
  target_business_id uuid,
  content_kind text,
  content_title text,
  content_excerpt text,
  content_body_document jsonb,
  content_body_text text,
  content_cover_path text,
  content_is_pinned boolean,
  content_event_starts_at timestamptz,
  content_event_ends_at timestamptz,
  content_event_all_day boolean,
  content_event_timezone text,
  content_event_venue_name text,
  content_event_venue_address text,
  content_reminder_minutes integer[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := (select auth.uid());
  saved_id uuid := coalesce(target_post_id, gen_random_uuid());
  existing public.posts;
  author_name text;
  previous_reminders integer[] := '{}';
  next_reminders integer[] := '{}';
  details_changed boolean := false;
  reminders_changed boolean := false;
  next_version integer := 1;
begin
  if caller_id is null or not public.has_business_permission(target_business_id, 'content.manage') then
    raise exception 'You do not have permission to manage this content';
  end if;
  if content_kind not in ('news', 'event') then
    raise exception 'Choose news or event content';
  end if;
  if char_length(btrim(coalesce(content_title, ''))) not between 3 and 140 then
    raise exception 'Title must be between 3 and 140 characters';
  end if;
  if char_length(btrim(coalesce(content_excerpt, ''))) not between 1 and 300 then
    raise exception 'Excerpt must be between 1 and 300 characters';
  end if;
  if char_length(btrim(coalesce(content_body_text, ''))) < 1
    or char_length(content_body_text) > 50000 then
    raise exception 'Content body must be between 1 and 50000 characters';
  end if;
  if content_body_document is null
    or content_body_document ->> 'type' <> 'doc'
    or octet_length(content_body_document::text) > 100000
    or content_body_document::text ~* '"href"\s*:\s*"(javascript|data):' then
    raise exception 'Rich text document is invalid';
  end if;
  if content_cover_path is not null and content_cover_path !~ (
    '^' || target_business_id::text || '/content/' || saved_id::text || '/cover-[0-9]+\.(jpg|png|webp)$'
  ) then
    raise exception 'Cover image path is invalid';
  end if;
  if exists (
    select 1 from unnest(coalesce(content_reminder_minutes, '{}')) offset_value
    where offset_value not in (60, 1440, 10080)
  ) then
    raise exception 'Event reminder offset is invalid';
  end if;

  next_reminders := array(
    select distinct value
    from unnest(coalesce(content_reminder_minutes, '{}')) value
    order by value
  );

  if content_kind = 'news' then
    if content_event_starts_at is not null
      or content_event_ends_at is not null
      or content_event_timezone is not null
      or coalesce(array_length(next_reminders, 1), 0) > 0 then
      raise exception 'News cannot contain event fields or reminders';
    end if;
  else
    if content_event_starts_at is null or nullif(btrim(coalesce(content_event_timezone, '')), '') is null then
      raise exception 'Events require a start date and timezone';
    end if;
    if content_event_ends_at is not null and content_event_ends_at <= content_event_starts_at then
      raise exception 'Event end must be after its start';
    end if;
    if coalesce(content_event_all_day, false) and (
      content_event_starts_at <> date_trunc('day', content_event_starts_at at time zone 'UTC') at time zone 'UTC'
      or (
        content_event_ends_at is not null
        and content_event_ends_at <> date_trunc('day', content_event_ends_at at time zone 'UTC') at time zone 'UTC'
      )
    ) then
      raise exception 'All-day events require whole calendar-day boundaries';
    end if;
  end if;

  select * into existing
  from public.posts
  where id = saved_id
  for update;

  if existing.id is not null and existing.business_id <> target_business_id then
    raise exception 'Content does not belong to this business';
  end if;
  if existing.id is not null and existing.published_at is not null and existing.kind::text <> content_kind then
    raise exception 'Content type cannot change after publication is scheduled';
  end if;

  select display_name into author_name from public.profiles where id = caller_id;
  author_name := coalesce(nullif(btrim(author_name), ''), 'Coffee shop team');

  if existing.id is null then
    insert into public.posts (
      id, business_id, kind, title, excerpt, body_document, body_text, cover_path,
      author_display_name, created_by, updated_by, event_starts_at, event_ends_at,
      event_all_day, event_timezone, event_venue_name, event_venue_address, is_pinned
    ) values (
      saved_id, target_business_id, content_kind::public.post_kind, btrim(content_title),
      btrim(content_excerpt), content_body_document, btrim(content_body_text), content_cover_path,
      author_name, caller_id, caller_id, content_event_starts_at, content_event_ends_at,
      coalesce(content_event_all_day, false), nullif(btrim(content_event_timezone), ''),
      nullif(btrim(content_event_venue_name), ''), nullif(btrim(content_event_venue_address), ''),
      coalesce(content_is_pinned, false)
    );
  else
    select coalesce(array_agg(minutes_before order by minutes_before), '{}')
    into previous_reminders
    from public.post_event_reminders
    where post_id = saved_id;

    details_changed := existing.kind = 'event' and (
      existing.title is distinct from btrim(content_title)
      or existing.event_starts_at is distinct from content_event_starts_at
      or existing.event_ends_at is distinct from content_event_ends_at
      or existing.event_all_day is distinct from coalesce(content_event_all_day, false)
      or existing.event_timezone is distinct from nullif(btrim(content_event_timezone), '')
      or existing.event_venue_name is distinct from nullif(btrim(content_event_venue_name), '')
      or existing.event_venue_address is distinct from nullif(btrim(content_event_venue_address), '')
    );
    reminders_changed := previous_reminders is distinct from next_reminders;
    next_version := existing.event_notification_version
      + case when existing.published_at is not null and (details_changed or reminders_changed) then 1 else 0 end;

    update public.posts set
      kind = content_kind::public.post_kind,
      title = btrim(content_title),
      excerpt = btrim(content_excerpt),
      body_document = content_body_document,
      body_text = btrim(content_body_text),
      cover_path = content_cover_path,
      updated_by = caller_id,
      event_starts_at = content_event_starts_at,
      event_ends_at = content_event_ends_at,
      event_all_day = coalesce(content_event_all_day, false),
      event_timezone = nullif(btrim(content_event_timezone), ''),
      event_venue_name = nullif(btrim(content_event_venue_name), ''),
      event_venue_address = nullif(btrim(content_event_venue_address), ''),
      event_notification_version = next_version,
      is_pinned = coalesce(content_is_pinned, false),
      updated_at = now()
    where id = saved_id;
  end if;

  delete from public.post_event_reminders where post_id = saved_id;
  if content_kind = 'event' then
    insert into public.post_event_reminders (post_id, minutes_before)
    select saved_id, value from unnest(next_reminders) value;
  end if;

  if existing.id is not null and existing.published_at is not null
    and (details_changed or reminders_changed) then
    perform public.rebuild_event_reminder_jobs(saved_id);
  end if;

  if existing.id is not null
    and existing.published_at is not null
    and existing.published_at <= now()
    and existing.archived_at is null
    and existing.event_cancelled_at is null
    and details_changed then
    update public.event_notification_jobs
    set status = 'cancelled', processed_at = now()
    where post_id = saved_id and job_type = 'updated' and status in ('pending', 'processing');

    insert into public.event_notification_jobs (
      post_id, job_type, reminder_minutes, event_version, due_at
    ) values (saved_id, 'updated', 0, next_version, now() + interval '5 minutes')
    on conflict (post_id, job_type, event_version, reminder_minutes)
    do update set due_at = excluded.due_at, status = 'pending', processed_at = null;
  end if;

  return saved_id;
end;
$$;

create or replace function public.set_business_content_publication(
  target_post_id uuid,
  publication_time timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post public.posts;
begin
  select * into target_post from public.posts where id = target_post_id for update;
  if target_post.id is null or not public.has_business_permission(target_post.business_id, 'content.manage') then
    raise exception 'Content was not found or access was denied';
  end if;
  if publication_time is null then raise exception 'Publication time is required'; end if;
  if target_post.published_at is not null and target_post.published_at <= now()
    and publication_time > now() + interval '1 minute' then
    raise exception 'Published content cannot be moved back to scheduled';
  end if;
  if target_post.kind = 'event' and target_post.event_starts_at <= publication_time then
    raise exception 'An event must be published before it starts';
  end if;

  update public.posts set
    published_at = publication_time,
    archived_at = null,
    updated_by = (select auth.uid()),
    updated_at = now()
  where id = target_post_id;
  perform public.rebuild_event_reminder_jobs(target_post_id);
end;
$$;

create or replace function public.archive_business_content(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare target_post public.posts;
begin
  select * into target_post from public.posts where id = target_post_id for update;
  if target_post.id is null or not public.has_business_permission(target_post.business_id, 'content.manage') then
    raise exception 'Content was not found or access was denied';
  end if;
  update public.posts set archived_at = now(), updated_by = (select auth.uid()), updated_at = now()
  where id = target_post_id;
  update public.event_notification_jobs set status = 'cancelled', processed_at = now()
  where post_id = target_post_id and status in ('pending', 'processing');
end;
$$;

create or replace function public.delete_business_content_draft(target_post_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare target_post public.posts;
begin
  select * into target_post from public.posts where id = target_post_id for update;
  if target_post.id is null or not public.has_business_permission(target_post.business_id, 'content.manage') then
    raise exception 'Content was not found or access was denied';
  end if;
  if target_post.published_at is not null then raise exception 'Published content must be archived'; end if;
  delete from public.posts where id = target_post_id;
  return target_post.cover_path;
end;
$$;

create or replace function public.cancel_business_event(target_post_id uuid, cancellation_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare target_post public.posts;
declare next_version integer;
begin
  select * into target_post from public.posts where id = target_post_id for update;
  if target_post.id is null or not public.has_business_permission(target_post.business_id, 'content.manage') then
    raise exception 'Event was not found or access was denied';
  end if;
  if target_post.kind <> 'event' then raise exception 'Only events can be cancelled'; end if;
  if char_length(btrim(coalesce(cancellation_reason, ''))) not between 3 and 300 then
    raise exception 'Cancellation reason must be between 3 and 300 characters';
  end if;
  if target_post.event_cancelled_at is not null then return; end if;

  next_version := target_post.event_notification_version + 1;
  update public.posts set
    event_cancelled_at = now(),
    event_cancellation_reason = btrim(cancellation_reason),
    event_notification_version = next_version,
    updated_by = (select auth.uid()),
    updated_at = now()
  where id = target_post_id;
  update public.event_notification_jobs set status = 'cancelled', processed_at = now()
  where post_id = target_post_id and status in ('pending', 'processing');

  if target_post.published_at is not null
    and target_post.published_at <= now()
    and target_post.archived_at is null then
    insert into public.event_notification_jobs (
      post_id, job_type, reminder_minutes, event_version, due_at
    ) values (target_post_id, 'cancelled', 0, next_version, now())
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.save_business_content(uuid, uuid, text, text, text, jsonb, text, text, boolean, timestamptz, timestamptz, boolean, text, text, text, integer[]) from public;
revoke all on function public.set_business_content_publication(uuid, timestamptz) from public;
revoke all on function public.archive_business_content(uuid) from public;
revoke all on function public.delete_business_content_draft(uuid) from public;
revoke all on function public.cancel_business_event(uuid, text) from public;
grant execute on function public.save_business_content(uuid, uuid, text, text, text, jsonb, text, text, boolean, timestamptz, timestamptz, boolean, text, text, text, integer[]) to authenticated;
grant execute on function public.set_business_content_publication(uuid, timestamptz) to authenticated;
grant execute on function public.archive_business_content(uuid) to authenticated;
grant execute on function public.delete_business_content_draft(uuid) to authenticated;
grant execute on function public.cancel_business_event(uuid, text) to authenticated;

create or replace function public.get_public_content_feed(
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
  id uuid,
  business_id uuid,
  business_name text,
  business_logo_url text,
  kind public.post_kind,
  title text,
  excerpt text,
  body_document jsonb,
  body_text text,
  cover_path text,
  author_display_name text,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  event_all_day boolean,
  event_timezone text,
  event_venue_name text,
  event_venue_address text,
  event_cancelled_at timestamptz,
  event_cancellation_reason text,
  reminder_minutes integer[],
  is_pinned boolean,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with visible as (
    select
      post.*,
      business.name as business_name_value,
      business.logo_url as business_logo_value,
      case when post.is_pinned and post.kind = 'event' and post.event_starts_at > now() then 1 else 0 end as pin_rank
    from public.posts post
    join public.businesses business on business.id = post.business_id
    where business.is_published
      and post.published_at is not null
      and post.published_at <= now()
      and post.archived_at is null
      and (target_business_id is null or post.business_id = target_business_id)
      and (target_post_id is null or post.id = target_post_id)
      and (requested_kind is null or post.kind::text = requested_kind)
      and (
        not followed_only
        or exists (
          select 1 from public.business_followers follower
          where follower.business_id = post.business_id
            and follower.client_id = (select auth.uid())
        )
      )
  )
  select
    visible.id,
    visible.business_id,
    visible.business_name_value,
    visible.business_logo_value,
    visible.kind,
    visible.title,
    visible.excerpt,
    visible.body_document,
    visible.body_text,
    visible.cover_path,
    visible.author_display_name,
    visible.event_starts_at,
    visible.event_ends_at,
    visible.event_all_day,
    visible.event_timezone,
    visible.event_venue_name,
    visible.event_venue_address,
    visible.event_cancelled_at,
    visible.event_cancellation_reason,
    coalesce((
      select array_agg(reminder.minutes_before order by reminder.minutes_before desc)
      from public.post_event_reminders reminder where reminder.post_id = visible.id
    ), '{}'),
    visible.is_pinned,
    visible.published_at,
    visible.archived_at,
    visible.created_at,
    visible.updated_at
  from visible
  where cursor_pinned is null
    or (visible.pin_rank, visible.published_at, visible.id)
      < (case when cursor_pinned then 1 else 0 end, cursor_published_at, cursor_id)
  order by visible.pin_rank desc, visible.published_at desc, visible.id desc
  limit greatest(1, least(coalesce(page_size, 20), 50));
$$;

revoke all on function public.get_public_content_feed(uuid, uuid, text, boolean, boolean, timestamptz, uuid, integer) from public;
grant execute on function public.get_public_content_feed(uuid, uuid, text, boolean, boolean, timestamptz, uuid, integer) to anon, authenticated;

create or replace function public.register_push_device(device_token text, device_platform text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare result_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication is required'; end if;
  if device_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'Push token is invalid';
  end if;
  if device_platform not in ('ios', 'android') then raise exception 'Device platform is invalid'; end if;

  insert into public.push_devices (profile_id, expo_push_token, platform, enabled, last_seen_at, updated_at)
  values ((select auth.uid()), device_token, device_platform, true, now(), now())
  on conflict (expo_push_token) do update set
    profile_id = excluded.profile_id,
    platform = excluded.platform,
    enabled = true,
    last_seen_at = now(),
    updated_at = now()
  returning id into result_id;
  return result_id;
end;
$$;

create or replace function public.disable_push_device(device_token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.push_devices set enabled = false, updated_at = now()
  where expo_push_token = device_token and profile_id = (select auth.uid());
$$;

revoke all on function public.register_push_device(text, text) from public;
revoke all on function public.disable_push_device(text) from public;
grant execute on function public.register_push_device(text, text) to authenticated;
grant execute on function public.disable_push_device(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-media', 'content-media', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "content managers upload content media" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'content-media'
    and name ~ '^[0-9a-f-]{36}/content/[0-9a-f-]{36}/cover-[0-9]+\.(jpg|png|webp)$'
    and public.has_business_permission(((storage.foldername(name))[1])::uuid, 'content.manage')
  );
create policy "content managers update content media" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'content-media'
    and name ~ '^[0-9a-f-]{36}/content/[0-9a-f-]{36}/cover-[0-9]+\.(jpg|png|webp)$'
    and public.has_business_permission(((storage.foldername(name))[1])::uuid, 'content.manage')
  )
  with check (
    bucket_id = 'content-media'
    and name ~ '^[0-9a-f-]{36}/content/[0-9a-f-]{36}/cover-[0-9]+\.(jpg|png|webp)$'
    and public.has_business_permission(((storage.foldername(name))[1])::uuid, 'content.manage')
  );
create policy "content managers delete content media" on storage.objects for delete
  to authenticated using (
    bucket_id = 'content-media'
    and name ~ '^[0-9a-f-]{36}/content/[0-9a-f-]{36}/cover-[0-9]+\.(jpg|png|webp)$'
    and public.has_business_permission(((storage.foldername(name))[1])::uuid, 'content.manage')
  );
create policy "authorized users read content media" on storage.objects for select
  using (
    bucket_id = 'content-media'
    and exists (
      select 1
      from public.posts post
      join public.businesses business on business.id = post.business_id
      where post.cover_path = storage.objects.name
        and (
          public.has_business_permission(post.business_id, 'content.manage')
          or (
            business.is_published
            and post.published_at is not null
            and post.published_at <= now()
            and post.archived_at is null
          )
        )
    )
  );

create or replace function public.claim_event_notification_jobs(batch_size integer default 25)
returns setof public.event_notification_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimed as (
    select job.id
    from public.event_notification_jobs job
    where job.due_at <= now()
      and (
        job.status = 'pending'
        or (job.status = 'processing' and job.next_attempt_at <= now())
      )
      and (job.next_attempt_at is null or job.next_attempt_at <= now())
    order by job.due_at
    for update skip locked
    limit greatest(1, least(coalesce(batch_size, 25), 100))
  )
  update public.event_notification_jobs job
  set status = 'processing', attempts = attempts + 1, next_attempt_at = now() + interval '5 minutes'
  from claimed
  where job.id = claimed.id
  returning job.*;
end;
$$;

revoke all on function public.claim_event_notification_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_event_notification_jobs(integer) to service_role;
