-- Editable starter categories for newly created and currently empty business menus.
-- Existing non-empty menus are preserved.

create or replace function public.add_default_menu_categories(target_business_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if not public.has_business_permission(target_business_id, 'menu.manage') then
    raise exception 'You do not have permission to manage this menu';
  end if;

  if exists (
    select 1 from public.menu_categories where business_id = target_business_id
  ) then
    return 0;
  end if;

  insert into public.menu_categories (business_id, name, sort_order)
  select target_business_id, category.name, category.sort_order
  from (values
    ('Coffee', 0),
    ('Tea & hot drinks', 1),
    ('Cold drinks', 2),
    ('Food', 3),
    ('Cakes & treats', 4)
  ) as category(name, sort_order);

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
  insert into public.menu_categories (business_id, name, sort_order)
  values
    (new.id, 'Coffee', 0),
    (new.id, 'Tea & hot drinks', 1),
    (new.id, 'Cold drinks', 2),
    (new.id, 'Food', 3),
    (new.id, 'Cakes & treats', 4);
  return new;
end;
$$;

drop trigger if exists create_default_menu_categories on public.businesses;
create trigger create_default_menu_categories
after insert on public.businesses
for each row execute function public.handle_new_business_default_menu_categories();

insert into public.menu_categories (business_id, name, sort_order)
select business.id, category.name, category.sort_order
from public.businesses business
cross join (values
  ('Coffee', 0),
  ('Tea & hot drinks', 1),
  ('Cold drinks', 2),
  ('Food', 3),
  ('Cakes & treats', 4)
) as category(name, sort_order)
where not exists (
  select 1 from public.menu_categories existing where existing.business_id = business.id
);

revoke all on function public.add_default_menu_categories(uuid) from public;
revoke all on function public.handle_new_business_default_menu_categories() from public;
grant execute on function public.add_default_menu_categories(uuid) to authenticated;
