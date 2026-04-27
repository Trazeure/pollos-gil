import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface InventarioItem {
  tipo: string
  kilos: number
  precio_kg: number
  subtotal: number
  descripcion?: string
}

interface InventarioPDFData {
  fecha: string
  items: InventarioItem[]
  total_dia: number
}

const S = StyleSheet.create({
  page: { padding: 44, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#DC2626' },
  brand: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#DC2626', letterSpacing: 2 },
  brandSub: { fontSize: 9, color: '#6B7280', marginTop: 3 },
  docType: { alignItems: 'flex-end' },
  docLabel: { fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  docDate: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 4 },
  tableHead: { flexDirection: 'row', backgroundColor: '#1F2937', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, marginBottom: 0 },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  cTipo: { flex: 2, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  cKilos: { flex: 1.5, textAlign: 'right', fontSize: 11 },
  cPrecio: { flex: 1.5, textAlign: 'right', fontSize: 11 },
  cSubtotal: { flex: 1.5, textAlign: 'right', fontSize: 11, fontFamily: 'Helvetica-Bold' },
  totalBox: { marginTop: 16, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#DC2626', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#374151', marginRight: 24, fontFamily: 'Helvetica-Bold' },
  totalVal: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#DC2626' },
  footer: { position: 'absolute', bottom: 32, left: 44, right: 44, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, textAlign: 'center', fontSize: 8, color: '#9CA3AF' },
  tipoColor: { width: 8, height: 8, borderRadius: 4, marginRight: 6, marginTop: 2 },
  tipoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  notaBox: { marginTop: 20, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A' },
  notaText: { fontSize: 9, color: '#92400E' },
})

const TIPO_LABELS: Record<string, string> = {
  menudencia: 'Menudencia',
  seara: 'Seara (Pechuga)',
  pollo: 'Pollo Entero',
  otras: 'Otras compras',
}

function mxn(n: number) { return `$${n.toFixed(2)}` }

function fmtFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00')
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} ${d.getFullYear()}`
}

export function InventarioDocument({ data }: { data: InventarioPDFData }) {
  return (
    <Document title={`Recibimiento ${data.fecha} - Pollos Gil`} author="Pollos Gil">
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.brand}>POLLOS GIL</Text>
            <Text style={S.brandSub}>Pollo Fresco de Calidad</Text>
            <Text style={S.brandSub}>Monclova, Coahuila · México</Text>
          </View>
          <View style={S.docType}>
            <Text style={S.docLabel}>Recibimiento Diario</Text>
            <Text style={S.docDate}>{data.fecha}</Text>
            <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 4 }}>{fmtFecha(data.fecha)}</Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={S.tableHead}>
          <Text style={[S.thText, S.cTipo]}>Concepto</Text>
          <Text style={[S.thText, S.cKilos]}>Kilos</Text>
          <Text style={[S.thText, S.cPrecio]}>Precio/kg</Text>
          <Text style={[S.thText, S.cSubtotal]}>Subtotal</Text>
        </View>

        {data.items.filter(i => i.subtotal > 0).map((item, idx) => (
          <View key={idx} style={idx % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <View style={[S.cTipo, S.tipoRow]}>
              <Text>
                {item.tipo === 'otras'
                  ? (item.descripcion || TIPO_LABELS.otras)
                  : (TIPO_LABELS[item.tipo] ?? item.tipo)}
              </Text>
            </View>
            <Text style={S.cKilos}>{item.tipo === 'otras' ? '—' : `${item.kilos.toFixed(3)} kg`}</Text>
            <Text style={S.cPrecio}>{item.tipo === 'otras' ? '—' : mxn(item.precio_kg)}</Text>
            <Text style={S.cSubtotal}>{mxn(item.subtotal)}</Text>
          </View>
        ))}

        {/* Total */}
        <View style={S.totalBox}>
          <Text style={S.totalLabel}>TOTAL DEL DÍA</Text>
          <Text style={S.totalVal}>{mxn(data.total_dia)}</Text>
        </View>

        {/* Nota */}
        <View style={S.notaBox}>
          <Text style={S.notaText}>
            📋 Documento interno de control de inventario · Pollos Gil · No tiene validez fiscal
          </Text>
        </View>

        {/* Footer */}
        <Text style={S.footer}>
          Generado por Sistema Pollos Gil · {new Date().toLocaleDateString('es-MX')}
        </Text>

      </Page>
    </Document>
  )
}
