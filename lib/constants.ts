export const RUTAS = {
  DASHBOARD: '/',
  INVENTARIO: '/inventario',
  PRODUCTOS: '/productos',
  VENTAS: '/ventas',
  FACTURAS: '/facturas',
  PEDIDOS: '/pedidos',
  TRABAJADORES: '/trabajadores',
  CALENDARIO: '/calendario',
  ANALYTICS: '/analytics',
  SUGERENCIAS: '/sugerencias',
  LOGIN: '/login',
} as const

export const MONCLOVA_COORDS = {
  lat: 26.9,
  lon: -101.42,
} as const

export const CATEGORIAS_PRODUCTO = [
  'Pollo Fresco Mexicano',
  'Especialidades',
  'Especialidades 2',
] as const

export const ESTADOS_PEDIDO = {
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  a_deber: { label: 'A deber', color: 'bg-red-100 text-red-800' },
} as const

export const ESTADOS_ASISTENCIA = {
  presente: { label: 'Presente', color: 'bg-green-100 text-green-800' },
  ausente: { label: 'Ausente', color: 'bg-red-100 text-red-800' },
  retardo: { label: 'Retardo', color: 'bg-yellow-100 text-yellow-800' },
} as const
