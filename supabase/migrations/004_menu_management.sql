-- Menu publication privacy, business-scoped category integrity, grants, and media permissions.
-- No Drizzle schema migration is required: the menu tables were created in 0000.

drop policy if exists "categories are readable" on public.menu_categories;
create policy "published categories are readable" on public.menu_categories for select
  using (exists (
    select 1 from public.businesses business
    where business.id = menu_categories.business_id and business.is_published
  ));

drop policy if exists "menu items are readable" on public.menu_items;
create policy "published menu items are readable" on public.menu_items for select
  using (exists (
    select 1 from public.businesses business
    where business.id = menu_items.business_id and business.is_published
  ));

grant select on table public.menu_categories, public.menu_items to anon, authenticated;
grant insert, update, delete on table public.menu_categories, public.menu_items to authenticated;

create or replace function public.delete_menu_category(
  target_business_id uuid,
  target_category_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_business_permission(target_business_id, 'menu.manage') then
    raise exception 'You do not have permission to manage this menu';
  end if;

  if not exists (
    select 1 from public.menu_categories
    where id = target_category_id and business_id = target_business_id
  ) then
    raise exception 'Menu category was not found';
  end if;

  update public.menu_items
  set category_id = null
  where business_id = target_business_id and category_id = target_category_id;

  delete from public.menu_categories
  where id = target_category_id and business_id = target_business_id;
end;
$$;

revoke all on function public.delete_menu_category(uuid, uuid) from public;
grant execute on function public.delete_menu_category(uuid, uuid) to authenticated;

create or replace function public.validate_menu_item_category_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.menu_categories category
    where category.id = new.category_id and category.business_id = new.business_id
  ) then
    raise exception 'Menu category must belong to the same business';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_menu_item_category_business on public.menu_items;
create trigger validate_menu_item_category_business
before insert or update of business_id, category_id on public.menu_items
for each row execute function public.validate_menu_item_category_business();

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'menu-media';

drop policy if exists "members upload business media" on storage.objects;
create policy "members upload business media" on storage.objects for insert
  to authenticated with check (
    case
      when bucket_id = 'business-media' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'business.profile.write')
      when bucket_id = 'menu-media' and name ~ '^[0-9a-f-]{36}/items/item-[0-9]+\.(jpg|png|webp)$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'menu.manage')
      else false
    end
  );

drop policy if exists "members update business media" on storage.objects;
create policy "members update business media" on storage.objects for update
  to authenticated
  using (
    case
      when bucket_id = 'business-media' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'business.profile.write')
      when bucket_id = 'menu-media' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'menu.manage')
      else false
    end
  )
  with check (
    case
      when bucket_id = 'business-media' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'business.profile.write')
      when bucket_id = 'menu-media' and name ~ '^[0-9a-f-]{36}/items/item-[0-9]+\.(jpg|png|webp)$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'menu.manage')
      else false
    end
  );

drop policy if exists "members delete business media" on storage.objects;
create policy "members delete business media" on storage.objects for delete
  to authenticated using (
    case
      when bucket_id = 'business-media' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'business.profile.write')
      when bucket_id = 'menu-media' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'menu.manage')
      else false
    end
  );
