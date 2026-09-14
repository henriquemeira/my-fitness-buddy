'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dumbbell } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/today')
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Digite seu email para receber o link mágico')
      return
    }
    
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setError('')
      alert('Link de acesso enviado para seu email!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-white dark:text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">FitTrack</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Seu coach de treino pessoal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
          
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-50 dark:bg-zinc-900 px-2 text-zinc-500">ou</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-12"
          onClick={handleMagicLink}
          disabled={loading}
        >
          Entrar com Link Mágico
        </Button>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Não tem conta?{' '}
          <Link href="/auth/register" className="font-medium text-zinc-900 dark:text-white hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
