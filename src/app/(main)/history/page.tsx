'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { History, Dumbbell, Clock, ArrowRight } from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Session {
  id: string
  started_at: string
  ended_at: string | null
  duration: number | null
  workout_templates: { name: string }[] | null
  workout_session_exercises: { id: string }[] | null
}

export default function HistoryPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchSessions = async () => {
      const { data } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          started_at,
          ended_at,
          duration,
          workout_templates (name),
          workout_session_exercises (id)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20)

      if (data) {
        setSessions(data)
      }
      setLoading(false)
    }

    fetchSessions()
  }, [user, supabase])

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 text-white">Histórico</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 bg-zinc-800 mx-auto flex items-center justify-center">
                <History className="w-8 h-8 text-zinc-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 text-white">
                  Nenhum treino realizado
                </h3>
                <p className="text-sm text-zinc-500 text-zinc-400 mt-1">
                  Complete seu primeiro treino para ver aqui
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/history/${session.id}`}>
              <Card className="border-zinc-200 border-zinc-800 hover:bg-zinc-50 hover:bg-zinc-900 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900 text-white">
                          {session.workout_templates?.[0]?.name || 'Treino livre'}
                        </h3>
                        {session.duration && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 bg-zinc-800 text-zinc-600 text-zinc-400">
                            {session.duration} min
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(session.started_at), "d 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(session.started_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 text-zinc-400 mt-1">
                        {session.workout_session_exercises?.length || 0} exercícios
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Calendar({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}
