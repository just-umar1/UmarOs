-- Run only in a disposable Supabase test database after applying migrations.
begin;
select plan(22);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','user-a@example.test','test-hash',now(),'{"username":"user-a","display_name":"User A"}'::jsonb,now(),now()),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','user-b@example.test','test-hash',now(),'{"username":"user-b","display_name":"User B"}'::jsonb,now(),now());
insert into public.projects(owner_id,title,slug,short_description,visibility)
values ('10000000-0000-4000-8000-000000000002','Private work','private-work','Not public','private');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select is((select count(*)::int from public.profiles where id='10000000-0000-4000-8000-000000000002'),0,'user A cannot read user B profile');
select is((select count(*)::int from public.projects where owner_id='10000000-0000-4000-8000-000000000002'),0,'user A cannot read user B projects');
select is((select count(*)::int from public.portfolio_settings where owner_id='10000000-0000-4000-8000-000000000002'),0,'user A cannot read user B settings');
update public.profiles set bio='changed by A' where id='10000000-0000-4000-8000-000000000002';
update public.portfolio_settings set show_email=true where owner_id='10000000-0000-4000-8000-000000000002';
update public.projects set title='changed by A' where owner_id='10000000-0000-4000-8000-000000000002';
select is((select bio from public.profiles where id='10000000-0000-4000-8000-000000000002'),'','user A cannot update user B profile');
select is((select show_email from public.portfolio_settings where owner_id='10000000-0000-4000-8000-000000000002'),false,'user A cannot update user B settings');
delete from public.projects where owner_id='10000000-0000-4000-8000-000000000002';
select is((select count(*)::int from public.projects where owner_id='10000000-0000-4000-8000-000000000002'),0,'user A cannot observe user B projects');
reset role;
select is((select title from public.projects where owner_id='10000000-0000-4000-8000-000000000002'),'Private work','user A cannot update or delete user B project');
set local role anon;
select throws_ok('select * from public.profiles','42501',null,'anonymous cannot read profile table directly');
select ok(not public.is_username_available('user-b'),'taken username is reported as unavailable');
select is(public.get_public_portfolio('user-b'),null::jsonb,'anonymous-safe RPC hides an unpublished draft');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
update public.profiles set public_email='private@example.test',headline='Published headline',bio='Published biography' where id='10000000-0000-4000-8000-000000000002';
select throws_ok('update public.portfolio_settings set is_published=true where owner_id=auth.uid()','42501',null,'client cannot directly change publication state');
update public.portfolio_settings set show_email=true where owner_id='10000000-0000-4000-8000-000000000002';
select lives_ok('select public.publish_my_portfolio()','owner can publish a valid snapshot');
reset role;
set local role anon;
select ok(public.get_public_portfolio('user-b') is not null,'published portfolio is readable without authentication');
select ok(not (public.get_public_portfolio('user-b')->'profile' ? 'id'),'public snapshot omits auth identifiers');
select is(public.get_public_portfolio('user-b')->'projects','[]'::jsonb,'private project is excluded from published snapshot');
select is(public.get_public_portfolio('user-b')->'profile'->>'public_email','private@example.test','explicitly shared email appears in snapshot');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
update public.profiles set headline='Unpublished headline' where id='10000000-0000-4000-8000-000000000002';
update public.portfolio_settings set show_email=false where owner_id='10000000-0000-4000-8000-000000000002';
update public.projects set visibility='public' where owner_id='10000000-0000-4000-8000-000000000002';
reset role;
set local role anon;
select is(public.get_public_portfolio('user-b')->'profile'->>'headline','Published headline','draft profile edits do not leak to public page');
select is(public.get_public_portfolio('user-b')->'profile'->>'public_email',null,'email opt-out hides address immediately');
select is(public.get_public_portfolio('user-b')->'projects','[]'::jsonb,'newly public project waits for publish');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select lives_ok('select public.publish_my_portfolio()','owner can publish a newer snapshot');
reset role;
set local role anon;
select is(public.get_public_portfolio('user-b')->'profile'->>'headline','Unpublished headline','republish replaces public snapshot');
select is(public.get_public_portfolio('user-b')->'projects'->0->>'title','Private work','project appears after explicit republish');
reset role;

select * from finish();
rollback;
