import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Factura } from '@/lib/types'

const S = StyleSheet.create({
  page: { padding: 44, fontSize: 10, fontFamily: 'Helvetica', color: '#111827', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#DC2626' },
  brandWrap: { flexDirection: 'column' },
  brand: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#DC2626', letterSpacing: 2 },
  brandTagline: { fontSize: 9, color: '#6B7280', marginTop: 3 },
  brandAddress: { fontSize: 8, color: '#9CA3AF', marginTop: 1 },
  folioWrap: { alignItems: 'flex-end' },
  folioLabel: { fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  folioNum: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 2 },
  folioDate: { fontSize: 9, color: '#6B7280', marginTop: 4 },
  clientSection: { marginBottom: 24, padding: 14, backgroundColor: '#F9FAFB', borderRadius: 6 },
  sectionLabel: { fontSize: 7, textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 6 },
  clientName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111827' },
  clientRfc: { fontSize: 9, color: '#6B7280', marginTop: 3 },
  tableWrap: { marginBottom: 20 },
  tableHead: { flexDirection: 'row', backgroundColor: '#1F2937', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4 },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  cDesc: { flex: 3, fontSize: 10 },
  cQty: { flex: 1, textAlign: 'center', fontSize: 10 },
  cPrice: { flex: 1.5, textAlign: 'right', fontSize: 10 },
  cSub: { flex: 1.5, textAlign: 'right', fontSize: 10, fontFamily: 'Helvetica-Bold' },
  totalsWrap: { alignItems: 'flex-end', marginTop: 4 },
  totalsBox: { width: 200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 10, color: '#6B7280' },
  totalVal: { fontSize: 10, color: '#374151' },
  divider: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginVertical: 6 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  grandLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111827' },
  grandVal: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#DC2626' },
  footer: { position: 'absolute', bottom: 32, left: 44, right: 44 },
  footerLine: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, textAlign: 'center', fontSize: 8, color: '#9CA3AF' },
  badge: { position: 'absolute', bottom: 56, right: 44, fontSize: 7, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: 1 },
})

function mxn(n: number) {
  return `$${n.toFixed(2)} MXN`
}

function padFolio(n: number) {
  return `#${String(n).padStart(4, '0')}`
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${d.getDate()} de ${meses[d.getMonth()]} ${d.getFullYear()}`
}

export function FacturaDocument({ factura }: { factura: Factura }) {
  return (
    <Document title={`Factura ${padFolio(factura.folio)} - Pollos Gil`} author="Pollos Gil">
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View style={S.brandWrap}>
            <Text style={S.brand}>POLLOS GIL</Text>
            <Text style={S.brandTagline}>Pollo Fresco de Calidad</Text>
            <Text style={S.brandAddress}>Monclova, Coahuila · México</Text>
          </View>
          <View style={S.folioWrap}>
            <Text style={S.folioLabel}>Nota de venta</Text>
            <Text style={S.folioNum}>{padFolio(factura.folio)}</Text>
            <Text style={S.folioDate}>{fmtDate(factura.created_at)}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={S.clientSection}>
          <Text style={S.sectionLabel}>Cliente</Text>
          <Text style={S.clientName}>{factura.cliente_nombre}</Text>
          {factura.cliente_rfc ? (
            <Text style={S.clientRfc}>RFC: {factura.cliente_rfc}</Text>
          ) : null}
        </View>

        {/* Tabla de items */}
        <View style={S.tableWrap}>
          <View style={S.tableHead}>
            <Text style={[S.thText, S.cDesc]}>Descripción</Text>
            <Text style={[S.thText, S.cQty]}>Cant.</Text>
            <Text style={[S.thText, S.cPrice]}>Precio unit.</Text>
            <Text style={[S.thText, S.cSub]}>Subtotal</Text>
          </View>
          {factura.items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
              <Text style={S.cDesc}>{item.producto_nombre}</Text>
              <Text style={S.cQty}>{item.cantidad}</Text>
              <Text style={S.cPrice}>{mxn(item.precio_unitario)}</Text>
              <Text style={S.cSub}>{mxn(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={S.totalsWrap}>
          <View style={S.totalsBox}>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>Subtotal</Text>
              <Text style={S.totalVal}>{mxn(factura.subtotal)}</Text>
            </View>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>IVA (16%)</Text>
              <Text style={S.totalVal}>{mxn(factura.iva)}</Text>
            </View>
            <View style={S.divider} />
            <View style={S.grandRow}>
              <Text style={S.grandLabel}>TOTAL</Text>
              <Text style={S.grandVal}>{mxn(factura.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerLine}>
            Gracias por su preferencia · Pollos Gil · Este documento no tiene validez fiscal oficial
          </Text>
        </View>

      </Page>
    </Document>
  )
}
