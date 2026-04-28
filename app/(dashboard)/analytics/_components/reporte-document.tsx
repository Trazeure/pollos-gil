import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface ReporteData {
  periodoLabel: string
  generadoEn: string
  resumen: {
    ventas: number
    gastos: number
    utilidad: number
    margen: number
    diasConVenta: number
  }
  detalles: { label: string; ventas: number; gastos: number; utilidad: number }[]
  topProductos: { nombre: string; cantidad: number; monto: number }[]
}

const S = StyleSheet.create({
  page: { padding: 44, fontSize: 10, fontFamily: 'Helvetica', color: '#111827', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#DC2626' },
  brand: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#DC2626', letterSpacing: 2 },
  brandSub: { fontSize: 8, color: '#6B7280', marginTop: 4 },
  docRight: { alignItems: 'flex-end' },
  docLabel: { fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  docPeriodo: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 4 },
  docDate: { fontSize: 8, color: '#9CA3AF', marginTop: 3 },

  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20 },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  kpiBox: { flex: 1, padding: 12, borderRadius: 6, borderWidth: 1 },
  kpiLabel: { fontSize: 7, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  kpiValue: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  kpiSub: { fontSize: 8, color: '#9CA3AF', marginTop: 3 },

  tableHead: { flexDirection: 'row', backgroundColor: '#1F2937', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 4, marginBottom: 0 },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  tableRowPos: { color: '#059669', fontFamily: 'Helvetica-Bold' },
  tableRowNeg: { color: '#DC2626', fontFamily: 'Helvetica-Bold' },

  cLabel: { flex: 2, fontSize: 9 },
  cNum: { flex: 1.5, textAlign: 'right', fontSize: 9 },
  cNumB: { flex: 1.5, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold' },

  barBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 3 },
  barFill: { height: 6, borderRadius: 3 },

  prodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  prodRowAlt: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#F9FAFB' },

  footer: { position: 'absolute', bottom: 28, left: 44, right: 44, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#9CA3AF' },
})

function mxn(n: number) { return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export function ReporteDocument({ data }: { data: ReporteData }) {
  const { periodoLabel, generadoEn, resumen, detalles, topProductos } = data
  const maxVentas = Math.max(...detalles.map(d => d.ventas), 1)
  const maxProd = Math.max(...topProductos.map(p => p.monto), 1)

  return (
    <Document title={`Reporte Pollos Gil — ${periodoLabel}`} author="Pollos Gil">
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.brand}>POLLOS GIL</Text>
            <Text style={S.brandSub}>Monclova, Coahuila · Reporte Financiero</Text>
          </View>
          <View style={S.docRight}>
            <Text style={S.docLabel}>Reporte de ventas</Text>
            <Text style={S.docPeriodo}>{periodoLabel}</Text>
            <Text style={S.docDate}>Generado: {generadoEn}</Text>
          </View>
        </View>

        {/* KPI Summary */}
        <Text style={S.sectionTitle}>Resumen ejecutivo</Text>
        <View style={S.kpiRow}>
          <View style={[S.kpiBox, { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}>
            <Text style={S.kpiLabel}>Total ventas</Text>
            <Text style={[S.kpiValue, { color: '#15803D' }]}>{mxn(resumen.ventas)}</Text>
            <Text style={S.kpiSub}>{resumen.diasConVenta} días con venta</Text>
          </View>
          <View style={[S.kpiBox, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
            <Text style={S.kpiLabel}>Total gastos</Text>
            <Text style={[S.kpiValue, { color: '#1D4ED8' }]}>{mxn(resumen.gastos)}</Text>
            <Text style={S.kpiSub}>Compras de inventario</Text>
          </View>
        </View>
        <View style={[S.kpiRow, { marginTop: 10 }]}>
          <View style={[S.kpiBox, { borderColor: resumen.utilidad >= 0 ? '#A7F3D0' : '#FECACA', backgroundColor: resumen.utilidad >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
            <Text style={S.kpiLabel}>Utilidad bruta</Text>
            <Text style={[S.kpiValue, { color: resumen.utilidad >= 0 ? '#059669' : '#DC2626' }]}>{mxn(resumen.utilidad)}</Text>
            <Text style={S.kpiSub}>{resumen.margen.toFixed(1)}% de margen</Text>
          </View>
          <View style={[S.kpiBox, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
            <Text style={S.kpiLabel}>Promedio diario</Text>
            <Text style={[S.kpiValue, { color: '#92400E' }]}>
              {resumen.diasConVenta > 0 ? mxn(resumen.ventas / resumen.diasConVenta) : '$0.00'}
            </Text>
            <Text style={S.kpiSub}>En días con venta registrada</Text>
          </View>
        </View>

        {/* Margen bar */}
        <View style={{ marginTop: 14, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>Margen bruto del período</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: resumen.margen >= 30 ? '#059669' : resumen.margen >= 15 ? '#D97706' : '#DC2626' }}>
              {resumen.margen.toFixed(1)}%
            </Text>
          </View>
          <View style={S.barBg}>
            <View style={[S.barFill, {
              width: `${Math.min(resumen.margen, 100)}%`,
              backgroundColor: resumen.margen >= 30 ? '#22C55E' : resumen.margen >= 15 ? '#F59E0B' : '#EF4444',
            }]} />
          </View>
        </View>

        {/* Detalles por período */}
        {detalles.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Detalle del período</Text>
            <View style={S.tableHead}>
              <Text style={[S.thText, S.cLabel]}>Período</Text>
              <Text style={[S.thText, S.cNum]}>Ventas</Text>
              <Text style={[S.thText, S.cNum]}>Gastos</Text>
              <Text style={[S.thText, S.cNumB]}>Utilidad</Text>
              <Text style={[S.thText, S.cNum]}>Margen</Text>
            </View>
            {detalles.map((d, i) => {
              const margen = d.ventas > 0 ? (d.utilidad / d.ventas) * 100 : 0
              const barW = Math.round((d.ventas / maxVentas) * 100)
              return (
                <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  <View style={[{ flex: 2 }]}>
                    <Text style={{ fontSize: 9 }}>{d.label}</Text>
                    <View style={[S.barBg, { marginTop: 3, width: `${barW}%` }]}>
                      <View style={[S.barFill, { width: '100%', backgroundColor: '#DC2626' }]} />
                    </View>
                  </View>
                  <Text style={S.cNum}>{mxn(d.ventas)}</Text>
                  <Text style={S.cNum}>{mxn(d.gastos)}</Text>
                  <Text style={[S.cNumB, d.utilidad >= 0 ? S.tableRowPos : S.tableRowNeg]}>{mxn(d.utilidad)}</Text>
                  <Text style={[S.cNum, { color: margen >= 30 ? '#059669' : margen >= 15 ? '#D97706' : '#DC2626' }]}>{margen.toFixed(1)}%</Text>
                </View>
              )
            })}
            <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, backgroundColor: '#1F2937', borderRadius: 4, marginTop: 1 }}>
              <Text style={[S.cLabel, { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#F9FAFB' }]}>TOTAL</Text>
              <Text style={[S.cNum, { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#86EFAC' }]}>{mxn(resumen.ventas)}</Text>
              <Text style={[S.cNum, { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#93C5FD' }]}>{mxn(resumen.gastos)}</Text>
              <Text style={[S.cNumB, { fontSize: 9, color: resumen.utilidad >= 0 ? '#86EFAC' : '#FCA5A5' }]}>{mxn(resumen.utilidad)}</Text>
              <Text style={[S.cNum, { fontSize: 9, color: '#FDE68A' }]}>{resumen.margen.toFixed(1)}%</Text>
            </View>
          </>
        )}

        {/* Top productos */}
        {topProductos.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Top productos del período</Text>
            <View style={S.tableHead}>
              <Text style={[S.thText, { width: 18 }]}>#</Text>
              <Text style={[S.thText, { flex: 2 }]}>Producto</Text>
              <Text style={[S.thText, S.cNum]}>Cantidad</Text>
              <Text style={[S.thText, S.cNumB]}>Monto total</Text>
            </View>
            {topProductos.slice(0, 10).map((p, i) => {
              const barW = Math.round((p.monto / maxProd) * 60)
              return (
                <View key={i} style={i % 2 === 0 ? S.prodRow : S.prodRowAlt}>
                  <Text style={{ width: 18, fontSize: 8, color: '#9CA3AF', fontFamily: 'Helvetica-Bold' }}>{i + 1}</Text>
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontSize: 9 }}>{p.nombre}</Text>
                    <View style={[S.barBg, { width: `${barW}%`, marginTop: 2 }]}>
                      <View style={[S.barFill, { width: '100%', backgroundColor: PROD_COLORS[i % PROD_COLORS.length] }]} />
                    </View>
                  </View>
                  <Text style={[S.cNum, { fontSize: 9 }]}>{p.cantidad}</Text>
                  <Text style={[S.cNumB, { fontSize: 9, color: '#DC2626' }]}>{mxn(p.monto)}</Text>
                </View>
              )
            })}
          </>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Pollos Gil — Sistema de gestión</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

const PROD_COLORS = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E', '#06B6D4']
