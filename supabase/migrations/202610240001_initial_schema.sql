-- UMAR.OS MVP schema. Apply with `supabase db push` or the Supabase SQL editor.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])$' and username not in ('login','signup','dashboard','explore','privacy','terms','u','api','auth','admin','settings','support')),
  display_name text not null default '' check (char_length(display_name) <= 80),
  headline text not null default '' check (char_length(headline) <= 140),
  bio text not null default '' check (char_length(bio) <= 2000),
  location text check (location is null or char_length(location) <= 100),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 512),
  public_email text check (public_email is null or char_length(public_email) <= 254),
  skills text[] not null default '{}' check (cardinality(skills) <= 40 and octet_length(array_to_string(skills, ',')) <= 4000),
  social_links jsonb not null default '[]'::jsonb check (jsonb_typeof(social_links) = 'array' and jsonb_array_length(social_links) <= 10 and octet_length(social_links::text) <= 8192),
  discovery_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  template text not null default 'minimal' check (template in ('minimal','developer','creative')),
  appearance text not null default 'dark' check (appearance in ('dark','light')),
  accent_color text not null default '#A3FF70' check (accent_color in ('#A3FF70','#8BB8FF','#D9A8FF','#FFB38A','#F4D35E')),
  is_published boolean not null default false,
  published_at timestamptz,
  published_content jsonb check (published_content is null or jsonb_typeof(published_content) = 'object'),
  show_email boolean not null default false,
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 180),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  slug text not null check (char_length(slug) between 1 and 120),
  short_description text not null check (char_length(short_description) between 1 and 240),
  description text not null default '' check (char_length(description) <= 5000),
  technologies text[] not null default '{}' check (cardinality(technologies) <= 20 and octet_length(array_to_string(technologies, ',')) <= 2000),
  repository_url text check (repository_url is null or char_length(repository_url) <= 2048),
  demo_url text check (demo_url is null or char_length(demo_url) <= 2048),
  image_url text check (image_url is null or char_length(image_url) <= 2048),
  image_path text check (image_path is null or char_length(image_path) <= 512),
  status text not null default 'completed' check (status in ('completed','in-progress','archived')),
  visibility text not null default 'public' check (visibility in ('public','private')),
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);

create index if not exists projects_owner_sort_idx on public.projects(owner_id, sort_order, created_at desc);
create index if not exists profiles_discovery_idx on public.profiles(discovery_enabled, updated_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger portfolio_settings_updated_at before update on public.portfolio_settings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_username text;
  v_name text;
begin
  v_username := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  v_name := left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80);
  if v_username !~ '^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])$' then
    raise exception 'A valid username is required';
  end if;
  insert into public.profiles (id, username, display_name) values (new.id, v_username, v_name);
  insert into public.portfolio_settings (owner_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.portfolio_settings enable row level security;

create policy "profile owner reads own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profile owner creates own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profile owner updates own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "settings owner reads own settings" on public.portfolio_settings for select to authenticated using ((select auth.uid()) = owner_id);
create policy "settings owner creates own settings" on public.portfolio_settings for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "settings owner updates own settings" on public.portfolio_settings for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "settings owner deletes own settings" on public.portfolio_settings for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "project owner reads own projects" on public.projects for select to authenticated using ((select auth.uid()) = owner_id);
create policy "project owner creates own projects" on public.projects for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "project owner updates own projects" on public.projects for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "project owner deletes own projects" on public.projects for delete to authenticated using ((select auth.uid()) = owner_id);

revoke all on public.profiles, public.projects, public.portfolio_settings from anon, public;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, delete on public.portfolio_settings to authenticated;
grant update (template, appearance, accent_color, show_email, seo_title, seo_description) on public.portfolio_settings to authenticated;

create or replace function public.is_username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select lower(coalesce(p_username, '')) ~ '^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])$'
    and lower(p_username) not in ('login','signup','dashboard','explore','privacy','terms','u','api','auth','admin','settings','support')
    and not exists(select 1 from public.profiles where username = lower(p_username));
$$;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- Publish snapshots separate editable drafts from the version visitors see.
create or replace function public.publish_my_portfolio()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_content jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'username', p.username,
      'display_name', p.display_name,
      'headline', p.headline,
      'bio', p.bio,
      'location', p.location,
      'avatar_url', case when p.avatar_path is not null then '/media/' || p.avatar_path else null end,
      'avatar_path', p.avatar_path,
      'public_email', case when s.show_email then p.public_email else null end,
      'skills', p.skills,
      'social_links', coalesce((select jsonb_agg(jsonb_build_object('label', left(link.value ->> 'label', 40), 'url', left(link.value ->> 'url', 2048))) from jsonb_array_elements(p.social_links) as link(value) where nullif(trim(link.value ->> 'label'), '') is not null and link.value ->> 'url' like 'https://%' and char_length(link.value ->> 'url') <= 2048), '[]'::jsonb),
      'updated_at', p.updated_at
    ),
    'settings', jsonb_build_object('template', s.template, 'appearance', s.appearance, 'accent_color', s.accent_color, 'seo_title', s.seo_title, 'seo_description', s.seo_description),
    'projects', coalesce((
      select jsonb_agg(q.item order by q.featured desc, q.sort_order asc, q.created_at desc)
      from (
        select jsonb_build_object(
          'id', pr.id, 'title', pr.title, 'slug', pr.slug,
          'short_description', pr.short_description, 'description', pr.description,
          'technologies', pr.technologies, 'repository_url', pr.repository_url,
          'demo_url', pr.demo_url,
          'image_url', case when pr.image_path is not null then '/media/' || pr.image_path else null end,
          'image_path', pr.image_path,
          'status', pr.status, 'featured', pr.featured, 'sort_order', pr.sort_order
        ) as item, pr.featured, pr.sort_order, pr.created_at
        from public.projects pr
        where pr.owner_id = p.id and pr.visibility = 'public'
        order by pr.featured desc, pr.sort_order asc, pr.created_at desc
        limit 50
      ) q
    ), '[]'::jsonb)
  ) into v_content
  from public.profiles p
  join public.portfolio_settings s on s.owner_id = p.id
  where p.id = v_user;
  if v_content is null then raise exception 'Portfolio profile is missing'; end if;
  if nullif(trim(v_content #>> '{profile,display_name}'), '') is null
    or nullif(trim(v_content #>> '{profile,headline}'), '') is null
    or nullif(trim(v_content #>> '{profile,bio}'), '') is null then
    raise exception 'Display name, headline, and biography are required before publishing';
  end if;
  update public.portfolio_settings
  set is_published = true, published_at = now(), published_content = v_content
  where owner_id = v_user;
end;
$$;
revoke all on function public.publish_my_portfolio() from public;
grant execute on function public.publish_my_portfolio() to authenticated;

create or replace function public.unpublish_my_portfolio()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.portfolio_settings
  set is_published = false, published_at = null, published_content = null
  where owner_id = auth.uid();
end;
$$;
revoke all on function public.unpublish_my_portfolio() from public;
grant execute on function public.unpublish_my_portfolio() to authenticated;

-- Public access is limited to published snapshots and privacy-safe, still-public projects.
create or replace function public.get_public_portfolio(p_username text)
returns jsonb language sql stable security definer set search_path = '' as $$
  with published as (
    select p.id, p.username, s.show_email, s.published_content
    from public.profiles p
    join public.portfolio_settings s on s.owner_id = p.id
    where p.username = lower(p_username) and s.is_published = true and s.published_content is not null
  ), current_snapshot as (
    select
      jsonb_set(
        jsonb_set(
          jsonb_set(published_content, '{profile}', (published_content -> 'profile') - 'avatar_path', true),
          '{profile,username}', to_jsonb(username), true
        ),
        '{profile,public_email}',
        case when show_email then coalesce(published_content #> '{profile,public_email}', 'null'::jsonb) else 'null'::jsonb end,
        true
      ) as content,
      id
    from published
  )
  select jsonb_set(
    content,
    '{projects}',
    coalesce((
      select jsonb_agg(saved.value - 'image_path' order by (saved.value ->> 'featured')::boolean desc, (saved.value ->> 'sort_order')::integer asc)
      from jsonb_array_elements(content -> 'projects') as saved(value)
      join public.projects pr on pr.id = (saved.value ->> 'id')::uuid and pr.owner_id = current_snapshot.id and pr.visibility = 'public'
    ), '[]'::jsonb),
    true
  )
  from current_snapshot;
$$;
revoke all on function public.get_public_portfolio(text) from public;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;

create or replace function public.explore_portfolios(p_query text default null, p_skill text default null, p_limit integer default 12, p_offset integer default 0)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(result.item order by result.published_at desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'username', p.username,
      'display_name', s.published_content #> '{profile,display_name}',
      'headline', s.published_content #> '{profile,headline}',
      'bio', left(s.published_content #>> '{profile,bio}', 240),
      'location', s.published_content #> '{profile,location}',
      'avatar_url', s.published_content #> '{profile,avatar_url}',
      'skills', s.published_content #> '{profile,skills}',
      'featured_project', (
        select jsonb_build_object('title', saved.value -> 'title', 'short_description', saved.value -> 'short_description', 'technologies', saved.value -> 'technologies')
        from jsonb_array_elements(s.published_content -> 'projects') as saved(value)
        join public.projects pr on pr.id = (saved.value ->> 'id')::uuid and pr.owner_id = p.id and pr.visibility = 'public'
        order by (saved.value ->> 'featured')::boolean desc, (saved.value ->> 'sort_order')::integer asc limit 1
      ),
      'updated_at', s.published_at
    ) as item,
    s.published_at
    from public.profiles p
    join public.portfolio_settings s on s.owner_id = p.id
    where s.is_published = true and s.published_content is not null and p.discovery_enabled = true
      and (nullif(trim(p_query), '') is null or s.published_content #>> '{profile,display_name}' ilike '%' || trim(p_query) || '%' or s.published_content #>> '{profile,headline}' ilike '%' || trim(p_query) || '%' or p.username ilike '%' || trim(p_query) || '%')
      and (nullif(trim(p_skill), '') is null
        or exists(select 1 from jsonb_array_elements_text(s.published_content #> '{profile,skills}') skill(value) where skill.value ilike trim(p_skill))
        or exists(
          select 1
          from jsonb_array_elements(s.published_content -> 'projects') saved(value)
          join public.projects pr on pr.id = (saved.value ->> 'id')::uuid and pr.owner_id = p.id and pr.visibility = 'public',
          jsonb_array_elements_text(saved.value -> 'technologies') technology(value)
          where technology.value ilike trim(p_skill)
        )
      )
    order by s.published_at desc
    limit least(greatest(coalesce(p_limit, 12), 1), 24) offset greatest(coalesce(p_offset, 0), 0)
  ) result;
$$;
revoke all on function public.explore_portfolios(text,text,integer,integer) from public;
grant execute on function public.explore_portfolios(text,text,integer,integer) to anon, authenticated;

-- Account deletion is self-service only. The client removes owned portfolio images first.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Private portfolio uploads are owner-scoped; the RLS helper opens reads only for published image references.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-assets', 'portfolio-assets', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
create or replace function public.is_published_asset(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.portfolio_settings s
    where s.is_published and s.published_content #>> '{profile,avatar_path}' = p_path
  ) or exists (
    select 1
    from public.portfolio_settings s
    cross join lateral jsonb_array_elements(s.published_content -> 'projects') saved(value)
    join public.projects pr on pr.id = (saved.value ->> 'id')::uuid and pr.owner_id = s.owner_id and pr.visibility = 'public'
    where s.is_published and saved.value ->> 'image_path' = p_path
  );
$$;
revoke all on function public.is_published_asset(text) from public;
grant execute on function public.is_published_asset(text) to anon, authenticated;
create policy "owners and published portfolios can read images" on storage.objects for select to anon, authenticated
using (bucket_id = 'portfolio-assets' and (
  (select auth.uid())::text = (storage.foldername(name))[1]
  or public.is_published_asset(name)
));
create policy "owners upload to their own asset folder" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners update their own assets" on storage.objects for update to authenticated using (bucket_id = 'portfolio-assets' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'portfolio-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners delete their own assets" on storage.objects for delete to authenticated using (bucket_id = 'portfolio-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
