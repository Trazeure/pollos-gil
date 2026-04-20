'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { login } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12 text-base"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Ingresando...
        </>
      ) : (
        'Ingresar'
      )}
    </Button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div
              className="px-6 py-3 rounded-2xl shadow-2xl"
              style={{
                background: '#1a1a1a',
                border: '3px solid #FBBF24',
                boxShadow: '0 0 30px rgba(220,38,38,0.3)',
              }}
            >
              <span
                className="font-black text-3xl tracking-widest"
                style={{
                  color: '#FBBF24',
                  WebkitTextStroke: '1px #DC2626',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                POLLOS
              </span>
              <span
                className="font-black text-3xl tracking-widest ml-2"
                style={{
                  color: '#DC2626',
                  WebkitTextStroke: '1px #8B0000',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                GIL
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Sistema de Gestión</p>
          <p className="text-gray-600 text-xs mt-0.5">Monclova, Coahuila</p>
        </div>

        {/* Card */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="pb-2 pt-6">
            <h1 className="text-xl font-bold text-center text-gray-900">
              Iniciar Sesión
            </h1>
          </CardHeader>
          <CardContent className="pt-4">
            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Usuario
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="pollosgil"
                  autoComplete="username"
                  className="h-12 text-base"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 text-base"
                  required
                />
              </div>

              {state?.error && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{state.error}</p>
                </div>
              )}

              <SubmitButton />
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 Pollos Gil · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
