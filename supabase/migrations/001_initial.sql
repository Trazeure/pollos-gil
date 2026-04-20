-- ============================================================
-- Pollos Gil — Migración inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- PROFILES (extiende auth.users)
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  nombre     text        not null default 'Usuario',
  rol        text        not null default 'admin' check (rol in ('admin', 'empleado')),
  created_at timestamptz not null default now()
);

-- Trigger: crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'admin'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Autenticados pueden ver perfiles"
  on public.profiles for select
  to authenticated using (true);

create policy "Usuarios actualizan su propio perfil"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- PRODUCTOS
-- ────────────────────────────────────────────────────────────
create table if not exists public.productos (
  id         uuid        primary key default gen_random_uuid(),
  nombre     text        not null,
  categoria  text        not null,
  precio     numeric(10,2) not null default 0,
  unidad     text        not null default 'pieza',
  activo     boolean     not null default true,
  created_at timestamptz not null default now()
);

alter table public.productos enable row level security;

create policy "Todos los autenticados leen productos"
  on public.productos for select
  to authenticated using (true);

create policy "Admin administra productos"
  on public.productos for all
  to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
  );

-- ────────────────────────────────────────────────────────────
-- RECIBIMIENTOS (inventario diario)
-- ────────────────────────────────────────────────────────────
create table if not exists public.recibimientos (
  id         uuid        primary key default gen_random_uuid(),
  fecha      date        not null default current_date,
  created_by uuid        references public.profiles(id),
  total_dia  numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (fecha)
);

create table if not exists public.recibimiento_items (
  id               uuid        primary key default gen_random_uuid(),
  recibimiento_id  uuid        references public.recibimientos(id) on delete cascade,
  tipo             text        not null check (tipo in ('menudencia', 'seara', 'pollo')),
  kilos            numeric(8,2) not null default 0,
  precio_kg        numeric(8,2) not null default 0,
  subtotal         numeric(10,2) not null default 0
);

alter table public.recibimientos enable row level security;
alter table public.recibimiento_items enable row level security;

create policy "Autenticados leen recibimientos"
  on public.recibimientos for select to authenticated using (true);
create policy "Autenticados escriben recibimientos"
  on public.recibimientos for insert to authenticated with check (true);
create policy "Autenticados actualizan recibimientos"
  on public.recibimientos for update to authenticated using (true);

create policy "Autenticados leen items de recibimiento"
  on public.recibimiento_items for select to authenticated using (true);
create policy "Autenticados escriben items de recibimiento"
  on public.recibimiento_items for all to authenticated using (true);

-- ────────────────────────────────────────────────────────────
-- VENTAS
-- ────────────────────────────────────────────────────────────
create table if not exists public.ventas (
  id         uuid        primary key default gen_random_uuid(),
  fecha      date        not null default current_date,
  items      jsonb       not null default '[]',
  total      numeric(10,2) not null default 0,
  metodo     text        not null default 'manual' check (metodo in ('manual', 'foto_ia')),
  foto_url   text,
  created_by uuid        references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.ventas enable row level security;

create policy "Autenticados leen ventas"
  on public.ventas for select to authenticated using (true);
create policy "Autenticados crean ventas"
  on public.ventas for insert to authenticated with check (true);
create policy "Admin actualiza ventas"
  on public.ventas for update to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
  );

-- ────────────────────────────────────────────────────────────
-- FACTURAS
-- ────────────────────────────────────────────────────────────
create table if not exists public.facturas (
  id              uuid         primary key default gen_random_uuid(),
  folio           serial,
  cliente_nombre  text         not null,
  cliente_rfc     text,
  items           jsonb        not null default '[]',
  subtotal        numeric(10,2) not null default 0,
  iva             numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  pdf_url         text,
  created_at      timestamptz  not null default now()
);

alter table public.facturas enable row level security;

create policy "Autenticados acceden a facturas"
  on public.facturas for all to authenticated using (true);

-- ────────────────────────────────────────────────────────────
-- PEDIDOS
-- ────────────────────────────────────────────────────────────
create table if not exists public.pedidos (
  id             uuid         primary key default gen_random_uuid(),
  cliente        text         not null,
  telefono       text,
  items          jsonb        not null default '[]',
  total          numeric(10,2) not null default 0,
  estado         text         not null default 'pendiente' check (estado in ('pagado', 'pendiente', 'a_deber')),
  fecha_entrega  date,
  notas          text,
  created_at     timestamptz  not null default now()
);

alter table public.pedidos enable row level security;

create policy "Autenticados acceden a pedidos"
  on public.pedidos for all to authenticated using (true);

-- ────────────────────────────────────────────────────────────
-- TRABAJADORES
-- ────────────────────────────────────────────────────────────
create table if not exists public.trabajadores (
  id         uuid         primary key default gen_random_uuid(),
  nombre     text         not null,
  puesto     text         not null,
  telefono   text,
  salario    numeric(10,2) not null default 0,
  activo     boolean      not null default true,
  created_at timestamptz  not null default now()
);

create table if not exists public.asistencias (
  id             uuid         primary key default gen_random_uuid(),
  trabajador_id  uuid         references public.trabajadores(id) on delete cascade,
  fecha          date         not null default current_date,
  estado         text         not null check (estado in ('presente', 'ausente', 'retardo')),
  notas          text,
  unique (trabajador_id, fecha)
);

alter table public.trabajadores enable row level security;
alter table public.asistencias enable row level security;

create policy "Autenticados leen trabajadores"
  on public.trabajadores for select to authenticated using (true);
create policy "Admin administra trabajadores"
  on public.trabajadores for all to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
  );

create policy "Autenticados acceden a asistencias"
  on public.asistencias for all to authenticated using (true);
