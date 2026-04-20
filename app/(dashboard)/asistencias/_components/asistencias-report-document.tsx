import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface WorkerStat {
  id: string
  nombre: string
  puesto: string
}

export interface AsistenciaSemanalData {
  tipo: 'semanal'
  fechaInicio: string
  fechaFin: string
  trabajadores: WorkerStat[]
  dias: string[] // array of 7 ISO dates (Mon-Sun)
  records: Record<string, Record<string, string>> // trabajador_id -> fecha -> estado
}

export interface AsistenciaMensualData {
  tipo: 'mensual'
  mes: number
  anio: number
  trabajadores: (WorkerStat & { presentes: number; retardos: number; ausentes: number; sinRegistro: number; totalDias: number })[]
}

export interface AsistenciaAnualData {
  tipo: 'anual'
  anio: number
  trabajadores: (WorkerStat & { meses: Record<number, number>; total: number })[]
}

export type AsistenciaReportData = AsistenciaSemanalData | AsistenciaMensualData | AsistenciaAnualData

const S = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#111827' },
  pageL: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: '#DC2626' },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#DC2626', letterSpacing: 2 },
  brandSub: { fontSize: 8, color: '#6B7280', marginTop: 2 },
  docTitle: { alignItems: 'flex-end' },
  docLabel: { fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  docPeriod: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 3 },
  // Table shared
  tHead: { flexDirection: 'row', backgroundColor: '#1F2937', paddingVertical: 7, paddingHorizontal: 8, borderRadius: 3 },
  thTxt: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: 0.3 },
  tRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tRowAlt: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  // Semanal
  sColWorker: { flex: 2.5 },
  sColDay: { flex: 1, textAlign: 'center' },
  sColTotal: { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  // Mensual
  mColWorker: { flex: 2.5 },
  mCol: { flex: 1, textAlign: 'center' },
  mColPct: { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  // Anual
  aColWorker: { flex: 2 },
  aColMes: { flex: 0.9, textAlign: 'center' },
  aColTotal: { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  // Badges
  presente: { color: '#16A34A' },
  retardo: { color: '#D97706' },
  ausente: { color: '#DC2626' },
  sinReg: { color: '#9CA3AF' },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 7, color: '#9CA3AF' },
})

const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function estadoChar(e: string | undefined) {
  if (e === 'presente') return 'P'
  if (e === 'retardo') return 'R'
  if (e === 'ausente') return 'A'
  return '–'
}

function estadoStyle(e: string | undefined) {
  if (e === 'presente') return S.presente
  if (e === 'retardo') return S.retardo
  if (e === 'ausente') return S.ausente
  return S.sinReg
}

function fmtFecha(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`
}

/* ──────── SEMANAL ──────── */
function SemanalDoc({ data }: { data: AsistenciaSemanalData }) {
  const dayNums = data.dias.map(d => {
    const dt = new Date(d + 'T12:00:00')
    return `${DIAS_CORTO[dt.getDay() === 0 ? 6 : dt.getDay() - 1]} ${dt.getDate()}`
  })

  return (
    <Document title="Reporte Semanal Asistencias - Pollos Gil">
      <Page size="A4" orientation="landscape" style={S.pageL}>
        <View style={S.header}>
          <View>
            <Text style={S.brand}>POLLOS GIL</Text>
            <Text style={S.brandSub}>Reporte de Asistencias Semanal</Text>
          </View>
          <View style={S.docTitle}>
            <Text style={S.docLabel}>Semana</Text>
            <Text style={S.docPeriod}>{fmtFecha(data.fechaInicio)} — {fmtFecha(data.fechaFin)}</Text>
          </View>
        </View>

        {/* Leyenda */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
          <Text style={[{ fontSize: 8 }, S.presente]}>P = Presente</Text>
          <Text style={[{ fontSize: 8 }, S.retardo]}>R = Retardo</Text>
          <Text style={[{ fontSize: 8 }, S.ausente]}>A = Ausente</Text>
          <Text style={[{ fontSize: 8 }, S.sinReg]}>– = Sin registro</Text>
        </View>

        <View style={S.tHead}>
          <Text style={[S.thTxt, S.sColWorker]}>Trabajador</Text>
          {dayNums.map((d, i) => <Text key={i} style={[S.thTxt, S.sColDay]}>{d}</Text>)}
          <Text style={[S.thTxt, S.sColTotal]}>Total</Text>
        </View>

        {data.trabajadores.map((w, wi) => {
          const recs = data.records[w.id] ?? {}
          const presentes = data.dias.filter(d => recs[d] === 'presente').length
          return (
            <View key={w.id} style={wi % 2 === 0 ? S.tRow : S.tRowAlt}>
              <View style={S.sColWorker}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{w.nombre}</Text>
                <Text style={{ color: '#6B7280', fontSize: 7 }}>{w.puesto}</Text>
              </View>
              {data.dias.map((d, di) => (
                <Text key={di} style={[S.sColDay, estadoStyle(recs[d])]}>
                  {estadoChar(recs[d])}
                </Text>
              ))}
              <Text style={[S.sColTotal, presentes >= 5 ? S.presente : presentes >= 3 ? S.retardo : S.ausente]}>
                {presentes}/{data.dias.length}
              </Text>
            </View>
          )
        })}

        <Text style={S.footer}>
          Generado por Sistema Pollos Gil · {new Date().toLocaleDateString('es-MX')} · P=Presente R=Retardo A=Ausente
        </Text>
      </Page>
    </Document>
  )
}

/* ──────── MENSUAL ──────── */
function MensualDoc({ data }: { data: AsistenciaMensualData }) {
  return (
    <Document title={`Reporte Mensual ${MESES_LARGO[data.mes - 1]} ${data.anio} - Pollos Gil`}>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <View>
            <Text style={S.brand}>POLLOS GIL</Text>
            <Text style={S.brandSub}>Reporte de Asistencias Mensual</Text>
          </View>
          <View style={S.docTitle}>
            <Text style={S.docLabel}>Período</Text>
            <Text style={S.docPeriod}>{MESES_LARGO[data.mes - 1]} {data.anio}</Text>
          </View>
        </View>

        <View style={S.tHead}>
          <Text style={[S.thTxt, S.mColWorker]}>Trabajador</Text>
          <Text style={[S.thTxt, S.mCol]}>Presentes</Text>
          <Text style={[S.thTxt, S.mCol]}>Retardos</Text>
          <Text style={[S.thTxt, S.mCol]}>Ausentes</Text>
          <Text style={[S.thTxt, S.mCol]}>Sin Reg.</Text>
          <Text style={[S.thTxt, S.mColPct]}>% Asist.</Text>
        </View>

        {data.trabajadores.map((w, wi) => {
          const pct = w.totalDias > 0 ? Math.round(((w.presentes + w.retardos * 0.5) / w.totalDias) * 100) : 0
          return (
            <View key={w.id} style={wi % 2 === 0 ? S.tRow : S.tRowAlt}>
              <View style={S.mColWorker}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>{w.nombre}</Text>
                <Text style={{ color: '#6B7280', fontSize: 7 }}>{w.puesto}</Text>
              </View>
              <Text style={[S.mCol, S.presente]}>{w.presentes}</Text>
              <Text style={[S.mCol, S.retardo]}>{w.retardos}</Text>
              <Text style={[S.mCol, S.ausente]}>{w.ausentes}</Text>
              <Text style={[S.mCol, S.sinReg]}>{w.sinRegistro}</Text>
              <Text style={[S.mColPct, pct >= 80 ? S.presente : pct >= 60 ? S.retardo : S.ausente]}>
                {pct}%
              </Text>
            </View>
          )
        })}

        <Text style={S.footer}>
          Generado por Sistema Pollos Gil · {new Date().toLocaleDateString('es-MX')} · % Asistencia = (Presentes + Retardos×0.5) / Días del mes
        </Text>
      </Page>
    </Document>
  )
}

/* ──────── ANUAL ──────── */
function AnualDoc({ data }: { data: AsistenciaAnualData }) {
  return (
    <Document title={`Reporte Anual ${data.anio} - Pollos Gil`}>
      <Page size="A4" orientation="landscape" style={S.pageL}>
        <View style={S.header}>
          <View>
            <Text style={S.brand}>POLLOS GIL</Text>
            <Text style={S.brandSub}>Reporte de Asistencias Anual</Text>
          </View>
          <View style={S.docTitle}>
            <Text style={S.docLabel}>Año</Text>
            <Text style={S.docPeriod}>{data.anio}</Text>
          </View>
        </View>

        <View style={S.tHead}>
          <Text style={[S.thTxt, S.aColWorker]}>Trabajador</Text>
          {MESES_CORTO.map((m, i) => <Text key={i} style={[S.thTxt, S.aColMes]}>{m}</Text>)}
          <Text style={[S.thTxt, S.aColTotal]}>Total</Text>
        </View>

        {data.trabajadores.map((w, wi) => (
          <View key={w.id} style={wi % 2 === 0 ? S.tRow : S.tRowAlt}>
            <View style={S.aColWorker}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{w.nombre}</Text>
              <Text style={{ color: '#6B7280', fontSize: 7 }}>{w.puesto}</Text>
            </View>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <Text key={m} style={[S.aColMes, { color: (w.meses[m] ?? 0) > 0 ? '#16A34A' : '#9CA3AF' }]}>
                {w.meses[m] ?? '–'}
              </Text>
            ))}
            <Text style={[S.aColTotal, S.presente]}>{w.total}</Text>
          </View>
        ))}

        <Text style={S.footer}>
          Generado por Sistema Pollos Gil · {new Date().toLocaleDateString('es-MX')} · Valores = días con asistencia (Presente + Retardo)
        </Text>
      </Page>
    </Document>
  )
}

/* ──────── Export ──────── */
export function AsistenciasReportDocument({ data }: { data: AsistenciaReportData }) {
  if (data.tipo === 'semanal') return <SemanalDoc data={data} />
  if (data.tipo === 'mensual') return <MensualDoc data={data} />
  return <AnualDoc data={data} />
}
