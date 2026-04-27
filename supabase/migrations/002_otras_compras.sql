-- Allow 'otras' as a valid tipo in recibimiento_items
alter table public.recibimiento_items
  drop constraint if exists recibimiento_items_tipo_check;

alter table public.recibimiento_items
  add constraint recibimiento_items_tipo_check
  check (tipo in ('menudencia', 'seara', 'pollo', 'otras'));

-- Optional description for 'otras' items
alter table public.recibimiento_items
  add column if not exists descripcion text;

-- Allow authenticated users to delete recibimientos (items cascade automatically)
create policy if not exists "Autenticados eliminan recibimientos"
  on public.recibimientos for delete to authenticated using (true);
