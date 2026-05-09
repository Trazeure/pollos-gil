import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface ReporteAbuelosData {
  tipo: 'diario' | 'semanal' | 'mensual' | 'anual'
  periodoLabel: string
  generadoEn: string
  totalVentas: number
  totalGastos: number
  totalGanancia: number
  ayerVentas?: number
  ayerGastos?: number
  ayerGanancia?: number
  periodos: { label: string; ventas: number; gastos: number }[]
}

const VERDE = '#2D7A2D'
const ROJO = '#C43E3E'
const NEGRO = '#1A1A1A'
const GRIS_FONDO = '#F5F5F0'
const GRIS_TEXTO = '#555555'
const VERDE_FONDO = '#F0FFF0'
const ROJO_FONDO = '#FFF5F5'

const S = StyleSheet.create({
  page: { padding: 44, fontSize: 12, fontFamily: 'Helvetica', color: NEGRO, backgroundColor: '#FFFFFF' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: ROJO },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: ROJO, letterSpacing: 2 },
  brandSub: { fontSize: 10, color: GRIS_TEXTO, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  tipoBadge: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: GRIS_TEXTO, textTransform: 'uppercase', letterSpacing: 1 },
  generadoText: { fontSize: 9, color: '#9CA3AF', marginTop: 4 },

  periodoTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: NEGRO, marginBottom: 18, textAlign: 'center' },

  mainBox: { borderWidth: 3, borderRadius: 8, padding: 18, alignItems: 'center', marginBottom: 20 },
  mainLabel: { fontSize: 14, color: GRIS_TEXTO, marginBottom: 6, textAlign: 'center' },
  mainAmount: { fontSize: 36, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 8 },
  mainStatus: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center' },

  threeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  box: { flex: 1, borderWidth: 2, borderRadius: 6, padding: 14, alignItems: 'center' },
  boxLabel: { fontSize: 11, color: GRIS_TEXTO, textAlign: 'center', marginBottom: 8 },
  boxAmount: { fontSize: 20, fontFamily: 'Helvetica-Bold', textAlign: 'center' },

  sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: NEGRO, marginBottom: 12, marginTop: 10 },

  compareRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  compareBox: { flex: 1, backgroundColor: GRIS_FONDO, borderRadius: 6, padding: 14, alignItems: 'center' },
  compareBoxLabel: { fontSize: 10, color: GRIS_TEXTO, marginBottom: 6, textAlign: 'center' },
  compareBoxAmount: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: NEGRO },

  arrowBox: { width: 60, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 28, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  arrowLabel: { fontSize: 9, color: GRIS_TEXTO, textAlign: 'center', marginTop: 2 },

  chartLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NEGRO, marginBottom: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  barType: { width: 60, fontSize: 10, color: GRIS_TEXTO },
  barTrack: { flex: 1, flexDirection: 'row', height: 16 },
  barFill: { height: 16, borderRadius: 4 },
  barAmount: { width: 70, fontSize: 10, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  gananciaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  gananciaLabel: { width: 60, fontSize: 10, color: GRIS_TEXTO },
  gananciaVal: { fontSize: 10, fontFamily: 'Helvetica-Bold' },

  footer: { position: 'absolute', bottom: 28, left: 44, right: 44 },
  footerLine: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 9, color: '#9CA3AF' },
  footerNote: { fontSize: 10, color: GRIS_TEXTO, textAlign: 'center', marginBottom: 8 },
})

function mxn(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Summary bar: just 2 rows (total entró / total salió) for the top of non-daily reports
function SummaryBar({ ventas, gastos }: { ventas: number; gastos: number }) {
  const maxVal = Math.max(ventas, gastos, 1)
  const toFlex = (v: number) => Math.max((v / maxVal) * 100, 0.5)
  const ganancia = ventas - gastos

  return (
    <View
      style={{
        backgroundColor: '#FAFAFA',
        borderRadius: 6,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 10, backgroundColor: VERDE, borderRadius: 2 }} />
          <Text style={{ fontSize: 11, color: GRIS_TEXTO }}>Lo que entró (ventas)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 10, backgroundColor: ROJO, borderRadius: 2 }} />
          <Text style={{ fontSize: 11, color: GRIS_TEXTO }}>Lo que salió (compras)</Text>
        </View>
      </View>

      {/* Ventas bar */}
      <View style={S.barRow}>
        <Text style={S.barType}>Lo que entró</Text>
        <View style={S.barTrack}>
          <View style={[S.barFill, { flex: toFlex(ventas), backgroundColor: VERDE }]} />
          <View style={{ flex: 100 - toFlex(ventas) }} />
        </View>
        <Text style={[S.barAmount, { color: VERDE }]}>{mxn(ventas)}</Text>
      </View>

      {/* Gastos bar */}
      <View style={S.barRow}>
        <Text style={S.barType}>Lo que salió</Text>
        <View style={S.barTrack}>
          <View style={[S.barFill, { flex: toFlex(gastos), backgroundColor: ROJO }]} />
          <View style={{ flex: 100 - toFlex(gastos) }} />
        </View>
        <Text style={[S.barAmount, { color: ROJO }]}>{mxn(gastos)}</Text>
      </View>

      {/* Net */}
      <View style={[S.gananciaRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
        <Text style={[S.gananciaLabel, { fontSize: 12, fontFamily: 'Helvetica-Bold', width: 70 }]}>Lo que quedó:</Text>
        <Text style={[S.gananciaVal, { fontSize: 14, color: ganancia >= 0 ? VERDE : ROJO }]}>
          {ganancia >= 0 ? '+' : ''}{mxn(ganancia)}
        </Text>
      </View>
    </View>
  )
}

function BarChart({ periodos, chartTitle }: { periodos: { label: string; ventas: number; gastos: number }[]; chartTitle: string }) {
  const maxVal = Math.max(...periodos.flatMap(p => [p.ventas, p.gastos]), 1)
  const toFlex = (v: number) => Math.max((v / maxVal) * 100, 0.5)

  return (
    <View>
      <Text style={S.sectionTitle}>{chartTitle}</Text>

      {periodos.map((p, i) => {
        const vFlex = toFlex(p.ventas)
        const gFlex = toFlex(p.gastos)
        const ganancia = p.ventas - p.gastos
        const isEven = i % 2 === 0

        return (
          // wrap={false} prevents this block from being split across pages
          <View
            key={i}
            wrap={false}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 10,
              backgroundColor: isEven ? '#FAFAFA' : '#FFFFFF',
              borderRadius: 4,
              marginBottom: 4,
              borderWidth: 1,
              borderColor: '#F0F0F0',
            }}
          >
            <Text style={S.chartLabel}>{p.label}</Text>

            <View style={S.barRow}>
              <Text style={S.barType}>Lo que entró</Text>
              <View style={S.barTrack}>
                <View style={[S.barFill, { flex: vFlex, backgroundColor: VERDE }]} />
                <View style={{ flex: 100 - vFlex }} />
              </View>
              <Text style={[S.barAmount, { color: VERDE }]}>{mxn(p.ventas)}</Text>
            </View>

            <View style={S.barRow}>
              <Text style={S.barType}>Lo que salió</Text>
              <View style={S.barTrack}>
                <View style={[S.barFill, { flex: gFlex, backgroundColor: ROJO }]} />
                <View style={{ flex: 100 - gFlex }} />
              </View>
              <Text style={[S.barAmount, { color: ROJO }]}>{mxn(p.gastos)}</Text>
            </View>

            <View style={S.gananciaRow}>
              <Text style={S.gananciaLabel}>Quedó:</Text>
              <Text style={[S.gananciaVal, { color: ganancia >= 0 ? VERDE : ROJO }]}>
                {ganancia >= 0 ? '+' : ''}{mxn(ganancia)}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

export function ReporteAbuelosDocument({ data }: { data: ReporteAbuelosData }) {
  const { tipo, periodoLabel, generadoEn, totalVentas, totalGastos, totalGanancia, periodos } = data
  const positivo = totalGanancia >= 0

  const tipoLabel =
    tipo === 'diario'   ? 'Reporte del día'     :
    tipo === 'semanal'  ? 'Reporte de la semana' :
    tipo === 'mensual'  ? 'Reporte del mes'      :
                          'Reporte del año'

  const mainLabel =
    tipo === 'diario'   ? 'Este día ganaron:'     :
    tipo === 'semanal'  ? 'Esta semana ganaron:'  :
    tipo === 'mensual'  ? 'Este mes ganaron:'     :
                          'Este año ganaron:'

  const chartTitle =
    tipo === 'semanal'  ? 'Cómo estuvo cada día'    :
    tipo === 'mensual'  ? 'Cómo estuvo cada semana' :
    tipo === 'anual'    ? 'Cómo estuvo cada mes'    :
                          ''

  const ayerGanancia = data.ayerGanancia ?? 0
  const diff = totalGanancia - ayerGanancia
  const mejoro = diff >= 0

  return (
    <Document title={`${tipoLabel} — Pollos Gil`} author="Pollos Gil">
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.brand}>POLLOS GIL</Text>
            <Text style={S.brandSub}>Monclova, Coahuila</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.tipoBadge}>{tipoLabel}</Text>
            <Text style={S.generadoText}>Generado: {generadoEn}</Text>
          </View>
        </View>

        {/* Period title */}
        <Text style={S.periodoTitle}>{periodoLabel}</Text>

        {/* Main result box */}
        <View style={[S.mainBox, {
          borderColor: positivo ? VERDE : ROJO,
          backgroundColor: positivo ? VERDE_FONDO : ROJO_FONDO,
        }]}>
          <Text style={S.mainLabel}>{mainLabel}</Text>
          <Text style={[S.mainAmount, { color: positivo ? VERDE : ROJO }]}>
            {mxn(totalGanancia)}
          </Text>
          <Text style={[S.mainStatus, { color: positivo ? VERDE : ROJO }]}>
            {positivo ? '✓  Todo va bien' : '⚠  Hay que revisar'}
          </Text>
        </View>

        {/* Three summary boxes */}
        <View style={S.threeRow}>
          <View style={[S.box, { borderColor: VERDE, backgroundColor: '#F9FFFB' }]}>
            <Text style={S.boxLabel}>Lo que entró</Text>
            <Text style={[S.boxAmount, { color: VERDE }]}>{mxn(totalVentas)}</Text>
          </View>
          <View style={[S.box, { borderColor: ROJO, backgroundColor: '#FFFBFB' }]}>
            <Text style={S.boxLabel}>Lo que salió</Text>
            <Text style={[S.boxAmount, { color: ROJO }]}>{mxn(totalGastos)}</Text>
          </View>
          <View style={[S.box, {
            borderColor: positivo ? VERDE : ROJO,
            backgroundColor: positivo ? '#F9FFFB' : '#FFFBFB',
          }]}>
            <Text style={S.boxLabel}>Lo que quedó</Text>
            <Text style={[S.boxAmount, { color: positivo ? VERDE : ROJO }]}>{mxn(totalGanancia)}</Text>
          </View>
        </View>

        {/* Diario: comparison with yesterday */}
        {tipo === 'diario' && data.ayerGanancia !== undefined && (
          <>
            <Text style={S.sectionTitle}>¿Cómo estuvo comparado con ayer?</Text>
            <View style={S.compareRow}>
              <View style={S.compareBox}>
                <Text style={S.compareBoxLabel}>Ayer ganaron:</Text>
                <Text style={[S.compareBoxAmount, { color: ayerGanancia >= 0 ? VERDE : ROJO }]}>
                  {mxn(ayerGanancia)}
                </Text>
              </View>
              <View style={S.arrowBox}>
                <Text style={[S.arrowText, { color: mejoro ? VERDE : ROJO }]}>
                  {mejoro ? '↑' : '↓'}
                </Text>
                <Text style={[S.arrowLabel, { color: mejoro ? VERDE : ROJO }]}>
                  {mxn(Math.abs(diff))}
                </Text>
              </View>
              <View style={S.compareBox}>
                <Text style={S.compareBoxLabel}>Hoy ganaron:</Text>
                <Text style={[S.compareBoxAmount, { color: totalGanancia >= 0 ? VERDE : ROJO }]}>
                  {mxn(totalGanancia)}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: mejoro ? '#F0FFF4' : '#FFF5F5', borderRadius: 6, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: mejoro ? VERDE : ROJO, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>
                {mejoro
                  ? `Hoy fue ${mxn(Math.abs(diff))} mejor que ayer. ¡Muy bien!`
                  : `Hoy fue ${mxn(Math.abs(diff))} menos que ayer.`}
              </Text>
            </View>
          </>
        )}

        {/* Semanal/Mensual/Anual: summary bar + detail chart */}
        {tipo !== 'diario' && (
          <>
            <SummaryBar ventas={totalVentas} gastos={totalGastos} />
            {periodos.length > 0 && (
              <BarChart periodos={periodos} chartTitle={chartTitle} />
            )}
          </>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <View style={S.footerLine}>
            <Text style={S.footerText}>Pollos Gil — Sistema de gestión</Text>
            <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
