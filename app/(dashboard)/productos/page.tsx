import PagePlaceholder from '@/components/shared/page-placeholder'
import { ShoppingBag } from 'lucide-react'

export default function ProductosPage() {
  return (
    <PagePlaceholder
      title="Productos"
      description="Catálogo completo de productos y precios"
      icon={ShoppingBag}
    />
  )
}
