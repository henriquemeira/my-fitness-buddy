'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dumbbell } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      alert('Conta criada! Verifique seu email para confirmar.')
      router.push('/auth/login')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-zinc-50 to-zinc-100 from-zinc-950 to-zinc-900">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 bg-white flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-white text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 text-white">Criar Conta</h1>
          <p className="text-zinc-500 text-zinc-400 mt-1">Comece sua jornada fitness</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          
          {error && (
            <p className="text-sm text-red-500 bg-red-50 bg-red-950/30 p-3 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 text-zinc-400">
          Já tem conta?{' '}
          <Link href="/auth/login" className="font-medium text-zinc-900 text-white hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
