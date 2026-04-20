-- ============================================================
-- Crear usuario admin: pollosgil / genesis1
--
-- OPCIÓN A (recomendada): Usar Supabase Dashboard
--   1. Ir a Authentication → Users → Add user
--   2. Email: pollosgil@pollosgil.com
--   3. Password: genesis1
--   4. El trigger crea el perfil automáticamente
--
-- OPCIÓN B: SQL directo (requiere acceso a auth schema)
-- ============================================================

-- Solo ejecutar si usas Opción B y tienes permisos:
/*
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'pollosgil@pollosgil.com',
  crypt('genesis1', gen_salt('bf')),
  now(),
  '{"nombre": "Pollos Gil"}',
  now(),
  now()
);
*/
