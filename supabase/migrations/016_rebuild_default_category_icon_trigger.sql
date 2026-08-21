-- Rebuild the starter-category trigger and its function as one atomic definition.
-- This supersedes databases where migration 011's name-only function remained deployed.

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

revoke all on function public.handle_new_business_default_menu_categories() from public, anon, authenticated;

drop trigger if exists create_default_menu_categories on public.businesses;
create trigger create_default_menu_categories
after insert on public.businesses
for each row execute function public.handle_new_business_default_menu_categories();

