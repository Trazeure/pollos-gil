-- Seed: Catálogo de productos Pollos Gil
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de 001_initial.sql)

insert into public.productos (nombre, categoria, precio, unidad) values
-- Pollo Fresco Mexicano
('Pollo Entero',             'Pollo Fresco Mexicano', 100, 'pieza'),
('Pechuga c/hueso',          'Pollo Fresco Mexicano', 110, 'pieza'),
('Pierna',                   'Pollo Fresco Mexicano', 100, 'pieza'),
('Bate o Muslo',             'Pollo Fresco Mexicano', 100, 'pieza'),
('Alitas',                   'Pollo Fresco Mexicano', 100, 'kg'),
('Pechuga s/hueso',          'Pollo Fresco Mexicano', 220, 'kg'),
('Milanesa s/empanizar',     'Pollo Fresco Mexicano', 220, 'kg'),
('Milanesa de Pierna',       'Pollo Fresco Mexicano', 220, 'pieza'),

-- Especialidades
('Milanesa Empanizada',      'Especialidades', 180, 'pieza'),
('Fajita (pimienta limón empanizada)', 'Especialidades', 180, 'pieza'),
('Ensalada de Pollo',        'Especialidades', 220, 'pieza'),
('Deshebrada',               'Especialidades', 260, 'pieza'),
('Nuggets hechos a mano',    'Especialidades', 220, 'pieza'),
('Molida de pollo especial', 'Especialidades', 270, 'kg'),
('Albóndigas',               'Especialidades', 220, 'pieza'),
('Hamburguesa',              'Especialidades', 220, 'pieza'),

-- Especialidades 2
('Milanesa Rellena (jamón y queso)', 'Especialidades 2', 220, 'pieza'),
('Pierna Light',             'Especialidades 2', 150, 'pieza'),
('Escalopa',                 'Especialidades 2', 220, 'pieza'),
('Menudencia',               'Especialidades 2',  60, 'kg');
