'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface LoginState {
  error?: string
}

export async function login(
  _prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createClient()

  let email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!email.includes('@')) {
    email = `${email}@pollosgil.com`
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Usuario o contraseña incorrectos. Verifica tus datos.' }
  }

  redirect('/')
}
