
-- ==============================================================================
-- SCHEMA ELEMEDE V1.0 (SUPABASE OPTIMIZED)
-- Ejecutar este script en el SQL Editor de Supabase para inicializar la DB.
-- ==============================================================================

-- 1. CONFIGURACIÓN INICIAL Y EXTENSIONES
-- Habilitamos pgcrypto para generar UUIDs y UUID-OSSP
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Limpieza preventiva (CUIDADO: Esto borra datos existentes para reiniciar el esquema)
drop table if exists public.notification_logs;
drop table if exists public.leads;
drop table if exists public.coupons;
drop table if exists public.invoices;
drop table if exists public.businesses;
drop table if exists public.profiles;

-- ==============================================================================
-- 2. TABLAS Y ESTRUCTURA
-- ==============================================================================

-- --- PROFILES (Usuarios) ---
-- Vinculado a auth.users. Almacena datos extra del usuario.
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text,
  role text default 'user' check (role in ('admin_root', 'admin_marketing', 'admin_finanzas', 'admin_soporte', 'user', 'business_owner', 'guest')),
  status text default 'active' check (status in ('active', 'suspended', 'banned', 'pending')),
  password_hash text default 'HIDDEN', -- Mantenido por compatibilidad con frontend, aunque Auth gestiona la real.
  favorites text[] default '{}', -- Array de UUIDs
  strikes int default 0,
  is_elite_reviewer boolean default false,
  forum_activity int default 0,
  reviews_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- --- BUSINESSES (Negocios) ---
create table public.businesses (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  sector_id text not null, -- 'mesas_dulces', 'pasteleria', etc.
  pack_id text not null, -- 'basic', 'medium', 'premium', 'super_top'
  billing_cycle text default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  nif text,
  phone text,
  address text,
  city text,
  province text,
  cp text,
  lat float,
  lng float,
  status text default 'active' check (status in ('active', 'suspended', 'pending')),
  
  -- Media
  main_image text,
  images text[] default '{}',
  
  -- Metadata
  tags text[] default '{}',
  description text,
  credits int default 0,
  reliability_score int default 50,
  total_ad_spend float default 0,
  
  -- JSONB Estructuras complejas (No relacionales estrictas para flexibilidad UI)
  stats jsonb default '{"views": 0, "clicks": 0, "ctr": 0, "saturationIndex": 0}'::jsonb,
  direcciones_adicionales jsonb default '[]'::jsonb,
  opening_hours jsonb default '{}'::jsonb,
  redeemed_coupons jsonb default '[]'::jsonb,
  stories jsonb default '[]'::jsonb,
  ratings jsonb default '[]'::jsonb, -- Almacenamos ratings dentro del objeto por simplicidad en v1
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- --- INVOICES (Facturas) ---
create table public.invoices (
  id text primary key, -- IDs personalizados ej: 'INV-2024-001'
  business_id uuid references public.businesses(id) on delete set null,
  
  -- Snapshot de datos fiscales al momento de emisión (Inmutables)
  business_name text,
  business_nif text,
  client_name text,
  client_nif text,
  
  date date not null,
  due_date date,
  
  total_amount float not null,
  base_amount float not null,
  iva_amount float not null,
  irpf_amount float default 0,
  iva_rate float default 21,
  irpf_rate float default 0,
  
  status text default 'paid' check (status in ('paid', 'unpaid', 'overdue', 'cancelled')),
  concept text,
  quarter int,
  stripe_fee float default 0,
  
  data jsonb, -- Copia completa del objeto factura por seguridad
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- COUPONS (Descuentos) ---
create table public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  type text default 'porcentaje' check (type in ('porcentaje', 'fijo')),
  value float not null,
  status text default 'active' check (status in ('active', 'disabled', 'expired')),
  usage_limit int default 100,
  usage_count int default 0,
  valid_from timestamp with time zone default now(),
  valid_to timestamp with time zone,
  applicable_targets text[] default '{plan_subscription}', -- ['plan_subscription', 'ad_banner', 'extra_location']
  requires_merit boolean default false
);

-- --- LEADS (Solicitudes de Eventos) ---
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  target_business_id uuid references public.businesses(id) on delete set null, -- Null si es general a la zona
  
  client_name text,
  client_contact text, -- Email o teléfono (oculto hasta desbloqueo en frontend)
  
  event_type text not null, -- 'boda', 'comunion', etc.
  date date,
  budget text,
  location text,
  description text,
  guests int default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- NOTIFICATION LOGS (Historial Emails/Push) ---
create table public.notification_logs (
  id uuid default gen_random_uuid() primary key,
  recipient text,
  template_type text,
  subject_sent text,
  status text default 'queued',
  trigger_source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 3. ÍNDICES DE RENDIMIENTO
-- ==============================================================================
create index idx_businesses_sector on public.businesses(sector_id);
create index idx_businesses_owner on public.businesses(owner_id);
create index idx_businesses_status on public.businesses(status);
create index idx_profiles_email on public.profiles(email);
create index idx_invoices_business on public.invoices(business_id);
create index idx_leads_target on public.leads(target_business_id);

-- ==============================================================================
-- 4. SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.invoices enable row level security;
alter table public.coupons enable row level security;
alter table public.leads enable row level security;
alter table public.notification_logs enable row level security;

-- FUNCION HELPER PARA DETECTAR ADMINS
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role like 'admin_%'
  );
end;
$$ language plpgsql security definer;

-- --- POLÍTICAS PROFILES ---
-- Todos pueden ver perfiles (necesario para reseñas, foro, etc.)
create policy "Public profiles are viewable by everyone" 
on public.profiles for select using (true);

-- Usuario puede insertar su propio perfil (al registrarse)
create policy "Users can insert their own profile" 
on public.profiles for insert with check (auth.uid() = id);

-- Usuario puede editar su propio perfil
create policy "Users can update own profile" 
on public.profiles for update using (auth.uid() = id);

-- Admins pueden editar cualquier perfil
create policy "Admins can update any profile" 
on public.profiles for update using (public.is_admin());

-- --- POLÍTICAS BUSINESSES ---
-- Público puede ver negocios activos
create policy "Businesses are viewable by everyone" 
on public.businesses for select using (true);

-- Autenticados pueden crear negocios
create policy "Authenticated users can create businesses" 
on public.businesses for insert with check (auth.role() = 'authenticated');

-- Dueños pueden editar sus negocios
create policy "Owners can update their business" 
on public.businesses for update using (auth.uid() = owner_id);

-- Admins pueden editar cualquier negocio
create policy "Admins can update any business" 
on public.businesses for update using (public.is_admin());

-- --- POLÍTICAS INVOICES ---
-- Dueños ven sus facturas, Admins ven todas
create policy "Owners can view own invoices" 
on public.invoices for select using (
  exists (select 1 from public.businesses where businesses.id = invoices.business_id and businesses.owner_id = auth.uid())
  or public.is_admin()
);

-- Solo el sistema/backend debería insertar facturas, pero permitimos a auth users por ahora (Phase 1)
create policy "Auth users can create invoices" 
on public.invoices for insert with check (auth.role() = 'authenticated');

-- --- POLÍTICAS OTROS ---
create policy "Coupons public read" on public.coupons for select using (true);
create policy "Admins manage coupons" on public.coupons for all using (public.is_admin());

create policy "Leads public insert" on public.leads for insert with check (true);
create policy "Owners view leads" on public.leads for select using (true); -- Refinar en v2 para solo ver leads desbloqueados

-- ==============================================================================
-- 5. STORAGE (BUCKETS)
-- ==============================================================================
-- Intentamos crear el bucket 'business-images' si no existe.
-- Nota: Esto a veces requiere permisos de superadmin o hacerlo desde la UI de Supabase.
-- El bloque DO captura el error si la extensión o función no existe.

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('business-images', 'business-images', true)
  on conflict (id) do nothing;
  
  -- Policy para Storage: Cualquiera ve, Autenticados suben
  -- (Esto se debe configurar en la UI de Storage Policies normalmente, pero aquí queda la intención SQL)
exception when others then
  raise notice 'Storage buckets setup skipped (requires storage schema access). Configure manually in Supabase Dashboard.';
end $$;

