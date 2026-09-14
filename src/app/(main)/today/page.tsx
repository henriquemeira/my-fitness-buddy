'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, Calendar, Clock, Zap, ArrowRight, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WorkoutTemplate {
  id: string
  name: string
  description: string | null
  duration: number | null
  workout_template_exercises: {
    id: string
  }[]
}

interface RecentSession {
  id: string
  started_at: string
  workout_templates: {
    name: string
  }
}

export default function TodayPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [recentSession, setRecentSession] = useState<RecentSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      // Buscar templates ativos
      const { data: templatesData } = await supabase
        .from('workout_templates')
        .select(`
          id,
          name,
          description,
          duration,
          workout_template_exercises (id)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (templatesData) {
        setTemplates(templatesData)
      }

      // Buscar última sessão
      const { data: sessionData } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          started_at,
          workout_templates (name)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (sessionData) {
        setRecentSession(sessionData as any)
      }

      setLoading(false)
    }

    fetchData()
  }, [user, supabase])

  const nextTemplate = templates[0]
  const today = new Date()
  const dayName = format(today, 'EEEE', { locale: ptBR })

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 text-white">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h1>
          <p className="text-zinc-500 text-zinc-400">Vamos treinar?</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-zinc-200 bg-zinc-800 flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-zinc-600 text-zinc-400" />
        </div>
      </div>

      {/* Próximo Treino Card */}
      {nextTemplate ? (
        <Card className="border-zinc-200 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-zinc-500 text-zinc-400">
              Próximo Treino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 text-white">
                {nextTemplate.name}
              </h2>
              {nextTemplate.description && (
                <p className="text-sm text-zinc-500 text-zinc-400 mt-1">
                  {nextTemplate.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-zinc-500 text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{dayName}</span>
              </div>
              {nextTemplate.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>~{nextTemplate.duration} min</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                <span>{nextTemplate.workout_template_exercises.length} exercícios</span>
              </div>
            </div>

            <Link href={`/workouts/${nextTemplate.id}/start`}>
              <Button className="w-full h-14 text-lg font-semibold">
                <Zap className="w-5 h-5 mr-2" />
                INICIAR TREINO
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-zinc-200 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 bg-zinc-800 mx-auto flex items-center justify-center">
                <Plus className="w-8 h-8 text-zinc-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 text-white">
                  Nenhum treino definido
                </h3>
                <p className="text-sm text-zinc-500 text-zinc-400 mt-1">
                  Crie seu primeiro treino
                </p>
              </div>
              <Link href="/workouts/new">
                <Button variant="outline" className="w-full">
                  Criar Treino
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Último Treino */}
      {recentSession && (
        <Card className="border-zinc-200 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-zinc-500 text-zinc-400">
              Última Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link 
              href={`/history/${recentSession.id}`}
              className="flex items-center justify-between group"
            >
              <div>
                <h3 className="font-semibold text-zinc-900 text-white">
                  {(recentSession as any).workout_templates?.name || 'Treino livre'}
                </h3>
                <p className="text-sm text-zinc-500 text-zinc-400">
                  {format(new Date(recentSession.started_at), "d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:text-zinc-300" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Lista de Treinos */}
      {templates.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 text-white">
              Meus Treinos
            </h3>
            <Link href="/workouts" className="text-sm text-zinc-500 text-zinc-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid gap-2">
            {templates.slice(1, 4).map((template) => (
              <Link key={template.id} href={`/workouts/${template.id}`}>
                <Card className="border-zinc-200 border-zinc-800 hover:bg-zinc-50 hover:bg-zinc-900 transition-colors">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-zinc-900 text-white">
                          {template.name}
                        </h4>
                        <p className="text-sm text-zinc-500 text-zinc-400">
                          {template.workout_template_exercises.length} exercícios
                          {template.duration && ` • ${template.duration} min`}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem IA Placeholder */}
      <Card className="border-zinc-200 border-zinc-800 bg-zinc-50 bg-zinc-900/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-200 bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-zinc-600 text-zinc-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-zinc-900 text-white">
                Coach IA
              </h4>
              <p className="text-sm text-zinc-500 text-zinc-400 mt-1">
                Complete seu perfil para receber recomendações personalizadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
