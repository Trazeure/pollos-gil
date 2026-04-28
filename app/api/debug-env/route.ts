import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.OPENAI_API_KEY ?? ''
  return NextResponse.json({
    key_length: key.length,
    key_last4: key.slice(-4),
    key_first8: key.slice(0, 8),
  })
}
