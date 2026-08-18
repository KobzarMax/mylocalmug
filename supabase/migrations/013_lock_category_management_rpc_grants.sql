-- Ensure category-management RPCs cannot be invoked by anonymous clients.
-- Supabase-managed roles may retain explicit grants independently of PUBLIC.

revoke execute on function public.check_menu_category_name(uuid, text, uuid) from anon;
revoke execute on function public.save_menu_category(uuid, uuid, text, boolean) from anon;
revoke execute on function public.reorder_menu_categories(uuid, uuid[]) from anon;
revoke execute on function public.delete_menu_category(uuid, uuid) from anon;
revoke execute on function public.add_default_menu_categories(uuid) from anon;
