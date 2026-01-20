
-- 1. PROFILES (Usuarios)
-- Se vincula automáticamente con la tabla auth.users de Supabase
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text default 'user', -- 'admin_root', 'business_owner', 'user'
  status text default 'active',
  favorites text[] default '{}', -- Array de IDs de negocios favoritos
  strikes int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Seguridad)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 2. BUSINESSES (Negocios)
create table public.businesses (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id), -- Dueño del negocio
  name text not null,
  sector_id text not null,
  pack_id text not null, -- 'basic', 'medium', 'premium', 'super_top'
  nif text,
  phone text,
  address text,
  city text,
  province text,
  cp text,
  lat float,
  lng float,
  status text default 'active',
  main_image text,
  images text[] default '{}',
  tags text[] default '{}',
  description text,
  credits int default 0,
  reliability_score int default 50,
  total_ad_spend float default 0,
  
  -- JSONB para estructuras complejas
  stats jsonb default '{"views": 0, "clicks": 0, "ctr": 0}'::jsonb,
  direcciones_adicionales jsonb default '[]'::jsonb,
  opening_hours jsonb default '{}'::jsonb,
  redeemed_coupons jsonb default '[]'::jsonb,
  stories jsonb default '[]'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.businesses enable row level security;
create policy "Businesses are viewable by everyone." on public.businesses for select using (true);
create policy "Owners can update their business." on public.businesses for update using (auth.uid() = owner_id);

-- 3. INVOICES (Facturas)
create table public.invoices (
  id text primary key, -- Usamos IDs como 'INV-2024-001'
  business_id uuid references public.businesses(id),
  client_name text,
  client_nif text,
  date date,
  total_amount float,
  base_amount float,
  iva_amount float,
  status text, -- 'paid', 'unpaid'
  concept text,
  data jsonb, -- Guardamos el objeto completo por si acaso
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invoices enable row level security;
create policy "Owners can view their invoices." on public.invoices for select using (
  exists ( select 1 from public.businesses where businesses.id = invoices.business_id and businesses.owner_id = auth.uid() )
);

-- 4. COUPONS (Cupones de Descuento)
create table public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  type text, -- 'porcentaje', 'fijo'
  value float,
  status text default 'active',
  usage_limit int default 100,
  usage_count int default 0,
  valid_to timestamp with time zone,
  applicable_targets text[] -- ['plan_subscription', 'ad_banner']
);

alter table public.coupons enable row level security;
create policy "Coupons are viewable by everyone." on public.coupons for select using (true);

-- 5. LEADS (Solicitudes de Eventos)
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  target_business_id uuid references public.businesses(id), -- Opcional, si es directo
  client_name text,
  client_contact text, -- Email o teléfono
  event_type text,
  date date,
  budget text,
  location text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. NOTIFICATION LOGS (Registro de Emails)
create table public.notification_logs (
  id uuid default gen_random_uuid() primary key,
  recipient text,
  template_type text,
  subject_sent text,
  status text default 'queued',
  trigger_source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. STORAGE BUCKETS (Configuración de Almacenamiento)
-- Nota: Esto normalmente se hace en la UI de Supabase, pero aquí está el SQL si tienes permisos de superadmin
-- insert into storage.buckets (id, name, public) values ('business-images', 'business-images', true);

-- POLICY PARA IMÁGENES
-- create policy "Public Access" on storage.objects for select using ( bucket_id = 'business-images' );
-- create policy "Auth Upload" on storage.objects for insert with check ( bucket_id = 'business-images' and auth.role() = 'authenticated' );
