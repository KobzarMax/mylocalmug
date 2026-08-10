create extension if not exists "pgcrypto";

alter table public.profiles
  add constraint profiles_id_auth_users_fk
  foreign key (id) references auth.users(id) on delete cascade;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'client'::public.user_role,
    coalesce(
      nullif(left(btrim(regexp_replace(new.raw_user_meta_data ->> 'display_name', '[[:cntrl:]]', '', 'g')), 80), ''),
      nullif(left(split_part(coalesce(new.email, ''), '@', 1), 80), ''),
      'Coffee friend'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.profiles (id, role, display_name)
select
  users.id,
  'client'::public.user_role,
  coalesce(
    nullif(left(btrim(regexp_replace(users.raw_user_meta_data ->> 'display_name', '[[:cntrl:]]', '', 'g')), 80), ''),
    nullif(left(split_part(coalesce(users.email, ''), '@', 1), 80), ''),
    'Coffee friend'
  )
from auth.users as users
on conflict (id) do nothing;

create function public.owns_business(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where id = target_business_id and owner_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_followers enable row level security;
alter table public.favorite_businesses enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.posts enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_items enable row level security;
alter table public.loyalty_wallets enable row level security;
alter table public.stamp_transactions enable row level security;
alter table public.reviews enable row level security;

create policy "profiles are readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke update on table public.profiles from authenticated;
grant update (display_name, description, avatar_path) on table public.profiles to authenticated;

create function public.set_profile_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles for each row execute procedure public.set_profile_updated_at();

create policy "published businesses are readable" on public.businesses for select
  using (is_published or owner_id = auth.uid());
create policy "business users create their business" on public.businesses for insert
  with check (owner_id = auth.uid() and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'business'
  ));
create policy "owners update business" on public.businesses for update
  using (owner_id = auth.uid());

create policy "followers are readable by participants" on public.business_followers for select
  using (client_id = auth.uid() or public.owns_business(business_id));
create policy "clients follow businesses" on public.business_followers for insert
  with check (client_id = auth.uid());
create policy "clients unfollow businesses" on public.business_followers for delete
  using (client_id = auth.uid());

create policy "users read own favorites" on public.favorite_businesses for select
  using (profile_id = (select auth.uid()));
create policy "users add own favorites" on public.favorite_businesses for insert
  with check (
    profile_id = (select auth.uid())
    and exists (select 1 from public.businesses where id = business_id and is_published)
  );
create policy "users remove own favorites" on public.favorite_businesses for delete
  using (profile_id = (select auth.uid()));

grant select, insert, delete on table public.favorite_businesses to authenticated;

create policy "categories are readable" on public.menu_categories for select using (true);
create policy "owners manage categories" on public.menu_categories for all
  using (public.owns_business(business_id)) with check (public.owns_business(business_id));
create policy "menu items are readable" on public.menu_items for select using (true);
create policy "owners manage menu items" on public.menu_items for all
  using (public.owns_business(business_id)) with check (public.owns_business(business_id));

create policy "published posts are readable" on public.posts for select
  using (published_at <= now() or public.owns_business(business_id));
create policy "owners manage posts" on public.posts for all
  using (public.owns_business(business_id)) with check (public.owns_business(business_id));

create policy "active rewards are readable" on public.rewards for select
  using (is_active or public.owns_business(business_id));
create policy "owners manage rewards" on public.rewards for all
  using (public.owns_business(business_id)) with check (public.owns_business(business_id));
create policy "reward items are readable" on public.reward_items for select using (true);
create policy "owners manage reward items" on public.reward_items for all
  using (exists (
    select 1 from public.rewards r where r.id = reward_id and public.owns_business(r.business_id)
  ));

create policy "clients read own wallets" on public.loyalty_wallets for select
  using (client_id = auth.uid() or exists (
    select 1 from public.rewards r where r.id = reward_id and public.owns_business(r.business_id)
  ));
create policy "clients open wallets" on public.loyalty_wallets for insert
  with check (client_id = auth.uid());
create policy "participants read stamp history" on public.stamp_transactions for select
  using (exists (
    select 1 from public.loyalty_wallets w join public.rewards r on r.id = w.reward_id
    where w.id = wallet_id and (w.client_id = auth.uid() or public.owns_business(r.business_id))
  ));

create policy "reviews are readable" on public.reviews for select using (true);
create policy "clients create reviews" on public.reviews for insert
  with check (author_id = auth.uid() and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'client'
  ));
create policy "authors update reviews" on public.reviews for update using (author_id = auth.uid());
create policy "authors delete reviews" on public.reviews for delete using (author_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('business-media', 'business-media', true), ('menu-media', 'menu-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads business media" on storage.objects for select
  using (bucket_id in ('business-media', 'menu-media'));
create policy "authenticated users upload business media" on storage.objects for insert
  to authenticated with check (bucket_id in ('business-media', 'menu-media'));

create policy "users upload own profile images" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
    and name ~ ('^' || (select auth.jwt()->>'sub') || '/avatar-[0-9]+\.(jpg|png|webp)$')
  );
create policy "users update own profile images" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
    and name ~ ('^' || (select auth.jwt()->>'sub') || '/avatar-[0-9]+\.(jpg|png|webp)$')
  );
create policy "users delete own profile images" on storage.objects for delete
  to authenticated using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
  );
