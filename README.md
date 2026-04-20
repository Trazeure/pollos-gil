# Pollos Gil — Sistema de Gestión

Sistema de gestión integral para Pollos Gil, Monclova, Coahuila.

---

## Setup rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y llena los valores:

```bash
cp .env.local.example .env.local
```

#### Dónde obtener cada variable:

**Supabase** → [supabase.com](https://supabase.com) → New Project:
- `NEXT_PUBLIC_SUPABASE_URL` → Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Settings → API → anon public key
- `SUPABASE_SERVICE_ROLE_KEY` → Settings → API → service_role key (guarda en secreto)

**OpenAI** → [platform.openai.com](https://platform.openai.com) → API Keys → Create new:
- `OPENAI_API_KEY` → sk-...

### 3. Crear base de datos

En Supabase Dashboard → **SQL Editor**, ejecuta en orden:

```sql
-- Paso 1: Esquema
[contenido de supabase/migrations/001_initial.sql]

-- Paso 2: Productos
[contenido de supabase/seed/01_productos.sql]
```

### 4. Crear usuario admin

En Supabase Dashboard → **Authentication → Users → Add user**:
- Email: `pollosgil@pollosgil.com`
- Password: `genesis1`
- ✅ Auto Confirm User

### 5. Copiar logo

Copia el logo a la carpeta `public`:
```
public/logo.png
```

### 6. Correr en desarrollo

```bash
npm run dev
```

Abrir: http://localhost:3000

---

## Deploy en Vercel

1. Push el código a GitHub
2. [vercel.com](https://vercel.com) → New Project → importar repo
3. En Environment Variables, agregar las 4 variables del `.env.local`
4. Deploy

---

## Costo mensual estimado

| Servicio | Plan | Costo |
|----------|------|-------|
| Supabase | Free tier (hasta 500MB) | $0 |
| Vercel | Hobby (proyectos personales) | $0 |
| OpenAI GPT-4o-mini | ~$0.15/1M tokens | ~$1–3/mes |
| Open-Meteo | Gratis, sin API key | $0 |
| **Total** | | **~$1–3/mes** |

---

## Fases de desarrollo

- [x] **Fase 1** — Base: auth, layout, sidebar, tipos TS
- [ ] **Fase 2** — Datos maestros: CRUD productos, trabajadores
- [ ] **Fase 3** — Core diario: inventario, ventas, dashboard con clima
- [ ] **Fase 4** — IA: corte Z con vision, sugerencias
- [ ] **Fase 5** — Documentos: facturas PDF, WhatsApp, asistencias
- [ ] **Fase 6** — Analytics: dashboards Recharts, calendario, pedidos
