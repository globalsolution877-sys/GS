-- ============================================================================
-- GLOBAL SOLUTIONS — schéma complet de la base (Supabase / PostgreSQL)
-- Ces instructions sont idempotentes : elles peuvent être rejouées sans risque.
-- Elles correspondent exactement à l'état du projet jaxnlwtqpyjykjrnuxis.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------- Contenus du site ------------------------------
create table if not exists public.realisations (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  localisation text,
  categorie text,
  annee integer,
  image_url text,
  statut text default 'brouillon',
  created_at timestamptz default now()
);

create table if not exists public.actualites (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  extrait text,
  contenu text,
  image_url text,
  date_publication date,
  statut text default 'brouillon',
  created_at timestamptz default now()
);

create table if not exists public.expertises (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titre text not null,
  description text,
  tags text[] default '{}',
  secteurs text,
  image_url text,
  icone text,
  ordre int default 0,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.equipe (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  fonction text,
  initiales text,
  bio text,
  photo_url text,
  ordre int default 0,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.stats (
  id uuid primary key default gen_random_uuid(),
  valeur text not null,
  label text not null,
  ordre int default 0,
  actif boolean default true
);

create table if not exists public.pages_contenu (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  cle text not null,
  valeur text,
  type text default 'texte',
  label text,
  updated_at timestamptz default now(),
  unique(page, cle)
);

create table if not exists public.site_settings (
  cle text primary key,
  valeur text
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  telephone text,
  entreprise text,
  domaine text,
  objet text,
  message text not null,
  statut text default 'nouveau',
  created_at timestamptz default now()
);

-- --------------------------- Accès administrateur ---------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'admin',
  created_at timestamptz default now()
);

create table if not exists public.app_config (
  cle text primary key,
  valeur text
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- Inscription réservée : le code d'invitation est obligatoire
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare code text;
begin
  select valeur into code from public.app_config where cle = 'invite_code';
  if coalesce(new.raw_user_meta_data->>'invite_code','') <> coalesce(code,'__none__') then
    raise exception 'Code d''invitation invalide';
  end if;
  insert into public.admins(user_id, email, role) values (new.id, new.email, 'admin')
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------- Sécurité -----------------------------------
alter table public.realisations     enable row level security;
alter table public.actualites       enable row level security;
alter table public.expertises       enable row level security;
alter table public.equipe           enable row level security;
alter table public.stats            enable row level security;
alter table public.pages_contenu    enable row level security;
alter table public.site_settings    enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admins           enable row level security;
alter table public.app_config       enable row level security;

-- Lecture publique des contenus publiés
drop policy if exists public_select_realisations on public.realisations;
create policy public_select_realisations on public.realisations for select to anon, authenticated using (statut = 'publie');

drop policy if exists public_select_actualites on public.actualites;
create policy public_select_actualites on public.actualites for select to anon, authenticated using (statut = 'publie');

drop policy if exists public_select_expertises on public.expertises;
create policy public_select_expertises on public.expertises for select to anon, authenticated using (actif = true);

drop policy if exists public_select_equipe on public.equipe;
create policy public_select_equipe on public.equipe for select to anon, authenticated using (actif = true);

drop policy if exists public_select_stats on public.stats;
create policy public_select_stats on public.stats for select to anon, authenticated using (actif = true);

drop policy if exists public_select_pages_contenu on public.pages_contenu;
create policy public_select_pages_contenu on public.pages_contenu for select to anon, authenticated using (true);

drop policy if exists public_select_settings on public.site_settings;
create policy public_select_settings on public.site_settings for select to anon, authenticated using (true);

-- Formulaire de contact : écriture publique, lecture réservée
drop policy if exists public_insert_contact on public.contact_messages;
create policy public_insert_contact on public.contact_messages for insert to anon, authenticated with check (true);

-- Écriture réservée aux administrateurs (fonction is_admin)
drop policy if exists admin_all_expertises on public.expertises;
create policy admin_all_expertises on public.expertises for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_equipe on public.equipe;
create policy admin_all_equipe on public.equipe for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_pages_contenu on public.pages_contenu;
create policy admin_all_pages_contenu on public.pages_contenu for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_stats on public.stats;
create policy admin_all_stats on public.stats for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_realisations on public.realisations;
create policy admin_all_realisations on public.realisations for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_actualites on public.actualites;
create policy admin_all_actualites on public.actualites for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_settings on public.site_settings;
create policy admin_all_settings on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_read_contact on public.contact_messages;
create policy admin_read_contact on public.contact_messages for select to authenticated using (public.is_admin());
drop policy if exists admin_update_contact on public.contact_messages;
create policy admin_update_contact on public.contact_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_delete_contact on public.contact_messages;
create policy admin_delete_contact on public.contact_messages for delete to authenticated using (public.is_admin());
drop policy if exists admin_read_admins on public.admins;
create policy admin_read_admins on public.admins for select to authenticated using (public.is_admin());

-- ------------------------------- Indexes ------------------------------------
create index if not exists idx_expertises_ordre  on public.expertises(ordre);
create index if not exists idx_equipe_ordre      on public.equipe(ordre);
create index if not exists idx_stats_ordre       on public.stats(ordre);
create index if not exists idx_realisations_statut on public.realisations(statut);
create index if not exists idx_actualites_statut on public.actualites(statut);
create index if not exists idx_contact_statut    on public.contact_messages(statut);


-- ============================================================================
-- NOTIFICATIONS E-MAIL DES DEMANDES DE CONTACT
-- ============================================================================

create extension if not exists pg_net with schema extensions;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.contact_messages(id) on delete set null,
  destinataire text,
  sujet text,
  provider text,
  statut text default 'en_attente',
  detail text,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;

drop policy if exists admin_all_notifications on public.notifications;
create policy admin_all_notifications on public.notifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists idx_notifications_created on public.notifications(created_at desc);

insert into public.site_settings (cle, valeur) values ('notify_email','info@globalsolutions.one')
on conflict (cle) do nothing;

insert into public.app_config (cle, valeur) values ('project_url','https://jaxnlwtqpyjykjrnuxis.supabase.co')
on conflict (cle) do nothing;

-- Trigger : appelle l'Edge Function notify-contact après chaque demande
create or replace function public.notify_new_contact() returns trigger
language plpgsql security definer set search_path = public as $$
declare pf text;
begin
  select valeur into pf from public.app_config where cle = 'project_url';
  if pf is null then pf := 'https://jaxnlwtqpyjykjrnuxis.supabase.co'; end if;

  perform net.http_post(
    url := pf || '/functions/v1/notify-contact',
    body := jsonb_build_object('type','INSERT','table','contact_messages','record', to_jsonb(new)),
    headers := jsonb_build_object('Content-Type','application/json'),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  insert into public.notifications (message_id, statut, detail) values (new.id, 'erreur_trigger', sqlerrm);
  return new;
end; $$;

drop trigger if exists on_contact_message_created on public.contact_messages;
create trigger on_contact_message_created
  after insert on public.contact_messages
  for each row execute function public.notify_new_contact();
