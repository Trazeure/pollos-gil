#!/usr/bin/env node
/**
 * Script de setup automático para Pollos Gil
 * Ejecuta la migración SQL, seed de productos y crea el usuario admin
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_REF = 'awixknenxpbqkowidjqr'
const SUPABASE_URL = 'https://awixknenxpbqkowidjqr.supabase.co'

async function runSQL(label, sql, pat) {
  console.log(`\n⏳ ${label}...`)
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error en "${label}": ${text}`)
  }

  console.log(`✅ ${label} completado`)
}

async function createAdminUser(serviceRoleKey) {
  console.log('\n⏳ Creando usuario admin...')

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'pollosgil@pollosgil.com',
      password: 'genesis1',
      email_confirm: true,
      user_metadata: { nombre: 'Pollos Gil' },
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    // Si ya existe, no es error
    const msg = JSON.stringify(data)
    if (msg.includes('already registered') || msg.includes('already been registered') || data.code === 'email_exists') {
      console.log('ℹ️  Usuario ya existe, continuando...')
      return
    }
    throw new Error(`Error creando usuario: ${msg}`)
  }

  console.log(`✅ Usuario creado: pollosgil@pollosgil.com / genesis1`)
}

async function main() {
  const pat = process.env.SUPABASE_PAT
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!pat || !serviceRoleKey) {
    console.error('\n❌ Faltan variables de entorno. Ejecuta así:\n')
    console.error('Windows CMD:')
    console.error('  set SUPABASE_PAT=tu_pat && set SUPABASE_SERVICE_ROLE_KEY=tu_key && node scripts/setup-supabase.mjs\n')
    console.error('Bash/PowerShell:')
    console.error('  SUPABASE_PAT=tu_pat SUPABASE_SERVICE_ROLE_KEY=tu_key node scripts/setup-supabase.mjs\n')
    process.exit(1)
  }

  console.log('🐔 Setup Pollos Gil — Base de datos\n')
  console.log('Proyecto:', PROJECT_REF)

  try {
    const migration = readFileSync(
      join(__dirname, '../supabase/migrations/001_initial.sql'),
      'utf-8'
    )
    await runSQL('Migración (tablas + RLS)', migration, pat)

    const seed = readFileSync(
      join(__dirname, '../supabase/seed/01_productos.sql'),
      'utf-8'
    )
    await runSQL('Seed productos (20 productos)', seed, pat)

    await createAdminUser(serviceRoleKey)

    console.log('\n🎉 ¡Base de datos lista!')
    console.log('   Usuario: pollosgil@pollosgil.com')
    console.log('   Password: genesis1')
    console.log('\nSiguiente paso: npm run dev\n')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  }
}

main()
