-- =====================================================================
-- GO TIK LINKS — Phase 1 schema
-- Tables, indexes, RLS, triggers, RPC, storage buckets
-- Idempotent: safe to run multiple times.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- short_links
-- ---------------------------------------------------------------------
create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  short_code text not null,
  title text,
  destination_url text not null,
  is_active boolean not null default true,
  expires_at timestamptz,
  total_clicks bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists short_links_short_code_key on public.short_links (short_code);
create index if not exists short_links_user_created_idx on public.short_links (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- click_events
-- ---------------------------------------------------------------------
create table if not exists public.click_events (
  id bigint generated always as identity primary key,
  short_link_id uuid not null references public.short_links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer text,
  country text,
  device_type text,
  browser text,
  os text
);
create index if not exists click_events_link_time_idx on public.click_events (short_link_id, clicked_at desc);

-- ---------------------------------------------------------------------
-- bio_pages
-- ---------------------------------------------------------------------
create table if not exists public.bio_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null default '',
  bio text,
  avatar_url text,
  theme_config jsonb not null default '{}'::jsonb,
  socials jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists bio_pages_slug_key on public.bio_pages (slug);
create index if not exists bio_pages_user_created_idx on public.bio_pages (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- bio_blocks
-- ---------------------------------------------------------------------
create table if not exists public.bio_blocks (
  id uuid primary key default gen_random_uuid(),
  bio_page_id uuid not null references public.bio_pages(id) on delete cascade,
  type text not null,
  position integer not null default 0,
  short_link_id uuid references public.short_links(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bio_blocks_page_position_idx on public.bio_blocks (bio_page_id, position);

-- ---------------------------------------------------------------------
-- page_views
-- ---------------------------------------------------------------------
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  bio_page_id uuid not null references public.bio_pages(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  referrer text,
  country text,
  device_type text
);
create index if not exists page_views_page_time_idx on public.page_views (bio_page_id, viewed_at desc);

-- =====================================================================
-- Triggers
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists short_links_touch on public.short_links;
create trigger short_links_touch before update on public.short_links
for each row execute procedure public.touch_updated_at();

drop trigger if exists bio_pages_touch on public.bio_pages;
create trigger bio_pages_touch before update on public.bio_pages
for each row execute procedure public.touch_updated_at();

drop trigger if exists bio_blocks_touch on public.bio_blocks;
create trigger bio_blocks_touch before update on public.bio_blocks
for each row execute procedure public.touch_updated_at();

-- =====================================================================
-- RPCs (analytics ingestion, atomic)
-- Called only by the server via the service role. SECURITY DEFINER.
-- =====================================================================
create or replace function public.record_click(
  p_short_link_id uuid,
  p_referrer text default null,
  p_country text default null,
  p_device_type text default null,
  p_browser text default null,
  p_os text default null
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.click_events(short_link_id, referrer, country, device_type, browser, os)
  values (p_short_link_id, p_referrer, p_country, p_device_type, p_browser, p_os);
  update public.short_links set total_clicks = total_clicks + 1 where id = p_short_link_id;
end;
$$;

create or replace function public.record_page_view(
  p_bio_page_id uuid,
  p_referrer text default null,
  p_country text default null,
  p_device_type text default null
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.page_views(bio_page_id, referrer, country, device_type)
  values (p_bio_page_id, p_referrer, p_country, p_device_type);
end;
$$;

-- Normalize block positions after reorder (server calls with ordered ids)
create or replace function public.reorder_blocks(
  p_bio_page_id uuid,
  p_block_ids uuid[]
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  i integer;
begin
  for i in 1 .. array_length(p_block_ids, 1) loop
    update public.bio_blocks
      set position = i - 1
      where id = p_block_ids[i] and bio_page_id = p_bio_page_id;
  end loop;
end;
$$;

revoke all on function public.record_click(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.record_page_view(uuid, text, text, text) from public, anon, authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.short_links enable row level security;
alter table public.click_events enable row level security;
alter table public.bio_pages enable row level security;
alter table public.bio_blocks enable row level security;
alter table public.page_views enable row level security;

-- profiles: owner only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- short_links: owner only
drop policy if exists "short_links_all_own" on public.short_links;
create policy "short_links_all_own" on public.short_links
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- click_events: owner may read (via join); no public insert (service role only)
drop policy if exists "click_events_select_own" on public.click_events;
create policy "click_events_select_own" on public.click_events
  for select to authenticated using (
    exists (select 1 from public.short_links sl where sl.id = short_link_id and sl.user_id = (select auth.uid()))
  );

-- bio_pages: owner only (public rendering happens server-side via service role)
drop policy if exists "bio_pages_all_own" on public.bio_pages;
create policy "bio_pages_all_own" on public.bio_pages
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- bio_blocks: owner only (through parent page ownership)
drop policy if exists "bio_blocks_all_own" on public.bio_blocks;
create policy "bio_blocks_all_own" on public.bio_blocks
  for all to authenticated using (
    exists (select 1 from public.bio_pages bp where bp.id = bio_page_id and bp.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.bio_pages bp where bp.id = bio_page_id and bp.user_id = (select auth.uid()))
  );

-- page_views: owner may read; no public insert (service role only)
drop policy if exists "page_views_select_own" on public.page_views;
create policy "page_views_select_own" on public.page_views
  for select to authenticated using (
    exists (select 1 from public.bio_pages bp where bp.id = bio_page_id and bp.user_id = (select auth.uid()))
  );

-- =====================================================================
-- Storage buckets + policies
-- =====================================================================
insert into storage.buckets(id, name, public)
values ('avatars', 'avatars', true), ('bio-assets', 'bio-assets', true)
on conflict (id) do nothing;

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars','bio-assets') and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id in ('avatars','bio-assets') and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id in ('avatars','bio-assets') and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "assets_public_read" on storage.objects;
create policy "assets_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id in ('avatars','bio-assets'));
