-- Social connections, reviewed publication queue, RLS, and trusted lifecycle operations.
-- Apply after Drizzle migration 0011.

create or replace function public.business_role_has_permission(member_role public.business_member_role, permission_key text)
returns boolean language sql immutable set search_path = public as $$
  select case
    when member_role = 'owner' then true
    when member_role = 'admin' then permission_key <> 'ownership.transfer'
    when member_role = 'manager' then permission_key = any(array[
      'business.profile.read','business.profile.write','menu.manage','content.manage','rewards.manage',
      'team.read','analytics.read','payments.charge','orders.read','orders.manage','loyalty.issue','loyalty.reverse'
    ])
    when member_role = 'finance' then permission_key = any(array[
      'business.profile.read','payments.read','payments.refund','analytics.read','legal.read','legal.write'
    ])
    when member_role = 'barista' then permission_key = any(array[
      'business.profile.read','payments.charge','orders.read','orders.manage','loyalty.issue'
    ])
    when member_role = 'viewer' then permission_key = any(array['business.profile.read','analytics.read'])
    else false end;
$$;

alter table public.social_connections enable row level security;
alter table public.social_connection_credentials enable row level security;
alter table public.social_oauth_states enable row level security;
alter table public.social_publications enable row level security;
alter table public.social_publication_attempts enable row level security;

create policy "content managers read social connections" on public.social_connections for select to authenticated
using (public.has_business_permission(business_id, 'content.manage'));
create policy "content managers read social publications" on public.social_publications for select to authenticated
using (public.has_business_permission(business_id, 'content.manage'));
create policy "content managers read social attempts" on public.social_publication_attempts for select to authenticated
using (exists(select 1 from public.social_publications publication where publication.id=publication_id and public.has_business_permission(publication.business_id,'content.manage')));

revoke all on public.social_connections, public.social_connection_credentials, public.social_oauth_states,
  public.social_publications, public.social_publication_attempts from anon, authenticated;
grant select on public.social_connections, public.social_publications, public.social_publication_attempts to authenticated;

create or replace function public.get_business_social_connections(target_business_id uuid)
returns table(id uuid, provider public.social_platform, account_name text, username text, profile_url text,
  status public.social_connection_status, token_expires_at timestamptz, last_verified_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not public.has_business_permission(target_business_id,'content.manage')
    and not public.has_business_permission(target_business_id,'social.connect') then
    raise exception 'Social publishing access required';
  end if;
  return query select connection.id,connection.provider,connection.account_name,connection.username,
    connection.profile_url,connection.status,connection.token_expires_at,connection.last_verified_at
  from public.social_connections connection where connection.business_id=target_business_id
  order by connection.provider;
end;
$$;

create or replace function public.queue_social_publications(
  target_business_id uuid, target_post_id uuid, publication_type_input public.social_publication_type,
  publication_due_at timestamptz, publication_content_url text, publication_captions jsonb,
  publication_media_path text default null
) returns uuid[] language plpgsql security definer set search_path=public as $$
declare target_post public.posts; connection public.social_connections; caption_value text; created_ids uuid[]='{}'; created_id uuid;
begin
  if not public.has_business_permission(target_business_id,'content.manage') then raise exception 'Content management access required'; end if;
  select * into target_post from public.posts where id=target_post_id and business_id=target_business_id for update;
  if target_post.id is null then raise exception 'Content was not found'; end if;
  if publication_due_at is null or target_post.published_at is null then raise exception 'Publish Local Mug content first'; end if;
  if publication_type_input='initial' and publication_due_at <> target_post.published_at then
    raise exception 'Initial social publication must use the Local Mug publication time';
  end if;
  if publication_type_input<>'initial' and publication_due_at < now()-interval '1 minute' then
    raise exception 'Social follow-up cannot be scheduled in the past';
  end if;
  if publication_content_url !~ '^https://[^[:space:]]+$' then raise exception 'A public HTTPS content URL is required'; end if;
  if publication_type_input='initial' and exists(select 1 from public.social_publications p where p.post_id=target_post_id and p.publication_type='initial' and p.status not in ('cancelled','needs_review')) then
    raise exception 'Initial social publication already exists';
  end if;
  for connection in select c.* from public.social_connections c
    where c.business_id=target_business_id and c.status='ready' and publication_captions ? c.provider::text loop
    caption_value := btrim(publication_captions->>connection.provider::text);
    if char_length(caption_value) not between 1 and 2000 then raise exception 'Social caption must be between 1 and 2000 characters'; end if;
    if connection.provider='instagram' and (publication_media_path is null or publication_media_path !~ ('^'||target_business_id::text||'/social/'||target_post_id::text||'/[^/]+\.jpe?g$')) then
      raise exception 'Instagram requires an immutable JPEG cover';
    end if;
    insert into public.social_publications(business_id,post_id,connection_id,provider,publication_type,caption,
      media_path,content_url,source_updated_at,due_at,idempotency_key,created_by)
    values(target_business_id,target_post_id,connection.id,connection.provider,publication_type_input,caption_value,
      case when connection.provider='instagram' then publication_media_path else publication_media_path end,
      publication_content_url,target_post.updated_at,publication_due_at,
      target_post_id::text||':'||connection.provider::text||':'||publication_type_input::text||':'||extract(epoch from target_post.updated_at)::text,
      auth.uid()) returning id into created_id;
    created_ids:=array_append(created_ids,created_id);
  end loop;
  if coalesce(array_length(created_ids,1),0)=0 then raise exception 'Select at least one ready social connection'; end if;
  return created_ids;
end;
$$;

create or replace function public.get_post_social_publications(target_post_id uuid)
returns table(id uuid,provider public.social_platform,publication_type public.social_publication_type,caption text,
  due_at timestamptz,status public.social_publication_status,provider_url text,last_error text)
language plpgsql security definer set search_path=public as $$
declare business uuid;
begin
  select post.business_id into business from public.posts post where post.id=target_post_id;
  if business is null or not public.has_business_permission(business,'content.manage') then raise exception 'Content management access required'; end if;
  return query select p.id,p.provider,p.publication_type,p.caption,p.due_at,p.status,p.provider_url,p.last_error
  from public.social_publications p where p.post_id=target_post_id order by p.created_at desc;
end;
$$;

create or replace function public.retry_social_publication(target_publication_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare publication public.social_publications;
begin
  select * into publication from public.social_publications where id=target_publication_id for update;
  if publication.id is null or not public.has_business_permission(publication.business_id,'content.manage') then
    raise exception 'Social publication access required';
  end if;
  if publication.status <> 'failed' then
    raise exception 'Only verified safe failures can be retried';
  end if;
  update public.social_publications
  set status='queued',next_attempt_at=now(),lease_until=null,last_error=null,updated_at=now()
  where id=target_publication_id;
end;
$$;

create or replace function public.claim_social_publications(batch_size integer default 20)
returns setof public.social_publications language plpgsql security definer set search_path=public as $$
begin
  return query with claimed as (
    select p.id from public.social_publications p where p.due_at<=now()
      and ((p.status='queued' and (p.next_attempt_at is null or p.next_attempt_at<=now()))
        or (p.status='failed' and p.next_attempt_at<=now()))
      and (p.lease_until is null or p.lease_until<now())
    order by p.due_at for update skip locked limit greatest(1,least(coalesce(batch_size,20),50))
  ) update public.social_publications p set status='publishing',attempts=p.attempts+1,
    lease_until=now()+interval '5 minutes',updated_at=now() from claimed where p.id=claimed.id returning p.*;
end;
$$;

create or replace function public.invalidate_pending_social_publications()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.updated_at is distinct from old.updated_at then
    update public.social_publications set status='needs_review',lease_until=null,updated_at=now()
    where post_id=new.id and status in ('queued','failed','publishing') and source_updated_at<>new.updated_at;
  end if;
  if new.event_cancelled_at is not null and old.event_cancelled_at is null then
    update public.social_publications set status='cancelled',lease_until=null,updated_at=now()
    where post_id=new.id and publication_type='initial' and status in ('queued','failed','needs_review');
  end if;
  return new;
end;
$$;
create trigger invalidate_social_after_content_change after update on public.posts
for each row execute function public.invalidate_pending_social_publications();

revoke all on function public.get_business_social_connections(uuid), public.queue_social_publications(uuid,uuid,public.social_publication_type,timestamptz,text,jsonb,text), public.get_post_social_publications(uuid), public.retry_social_publication(uuid) from public;
grant execute on function public.get_business_social_connections(uuid), public.queue_social_publications(uuid,uuid,public.social_publication_type,timestamptz,text,jsonb,text), public.get_post_social_publications(uuid), public.retry_social_publication(uuid) to authenticated;
revoke all on function public.claim_social_publications(integer) from public,anon,authenticated;
grant execute on function public.claim_social_publications(integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('social-media','social-media',false,5242880,array['image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "content managers upload social snapshots" on storage.objects for insert to authenticated with check(
  bucket_id='social-media' and name ~ '^[0-9a-f-]{36}/social/[0-9a-f-]{36}/[0-9]+\.jpe?g$'
  and public.has_business_permission(((storage.foldername(name))[1])::uuid,'content.manage'));
create policy "content managers delete unused social snapshots" on storage.objects for delete to authenticated using(
  bucket_id='social-media' and public.has_business_permission(((storage.foldername(name))[1])::uuid,'content.manage')
  and not exists(select 1 from public.social_publications p where p.media_path=name and p.status in ('queued','publishing','published')));
