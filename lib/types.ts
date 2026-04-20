export type Rol = 'admin' | 'empleado'
export type EstadoPedido = 'pagado' | 'pendiente' | 'a_deber'
export type TipoRecibimiento = 'menudencia' | 'seara' | 'pollo'
export type EstadoAsistencia = 'presente' | 'ausente' | 'retardo'
export type MetodoVenta = 'manual' | 'foto_ia'

export interface Profile {
  id: string
  nombre: string
  rol: Rol
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  categoria: string
  precio: number
  unidad: string
  activo: boolean
}

export interface RecibimientoItem {
  id: string
  recibimiento_id: string
  tipo: TipoRecibimiento
  kilos: number
  precio_kg: number
  subtotal: number
}

export interface Recibimiento {
  id: string
  fecha: string
  created_by: string
  total_dia: number
  items?: RecibimientoItem[]
}

export interface VentaItem {
  producto_id: string
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Venta {
  id: string
  fecha: string
  items: VentaItem[]
  total: number
  metodo: MetodoVenta
  foto_url?: string
  created_by: string
}

export interface FacturaItem {
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Factura {
  id: string
  folio: number
  cliente_nombre: string
  cliente_rfc?: string
  items: FacturaItem[]
  subtotal: number
  iva: number
  total: number
  pdf_url?: string
  created_at: string
}

export interface PedidoItem {
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Pedido {
  id: string
  cliente: string
  telefono?: string
  items: PedidoItem[]
  total: number
  estado: EstadoPedido
  fecha_entrega?: string
  notas?: string
  created_at: string
}

export interface Trabajador {
  id: string
  nombre: string
  puesto: string
  telefono?: string
  salario: number
  activo: boolean
}

export interface Asistencia {
  id: string
  trabajador_id: string
  fecha: string
  estado: EstadoAsistencia
  notas?: string
}

export interface WeatherData {
  temperature: number
  weatherCode: number
  description: string
}
