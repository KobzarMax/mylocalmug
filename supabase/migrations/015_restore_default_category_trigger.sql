-- Restore starter-category creation even when the migration 011 trigger is absent.
-- Apply after Supabase migration 014.

drop trigger if exists create_default_menu_categories on public.businesses;
create trigger create_default_menu_categories
after insert on public.businesses
for each row execute function public.handle_new_business_default_menu_categories();

-- Repair only businesses with no categories; never overwrite a configured menu.
insert into public.menu_categories (business_id, name, icon_key, sort_order)
select business.id, category.name, category.icon_key, category.sort_order
from public.businesses business
cross join (values
  ('Coffee', 'coffee', 0),
  ('Tea & hot drinks', 'tea', 1),
  ('Cold drinks', 'cold_drink', 2),
  ('Food', 'meal', 3),
  ('Cakes & treats', 'dessert', 4)
) as category(name, icon_key, sort_order)
where not exists (
  select 1 from public.menu_categories existing where existing.business_id = business.id
);

