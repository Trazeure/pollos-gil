import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  formatStr = "EEEE, d 'de' MMMM 'de' yyyy"
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: es })
}

export function getGreeting(nombre: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Buenos días, ${nombre}`
  if (hour < 19) return `Buenas tardes, ${nombre}`
  return `Buenas noches, ${nombre}`
}
