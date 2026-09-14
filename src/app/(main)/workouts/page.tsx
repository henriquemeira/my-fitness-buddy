'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Dumbbell, Clock, ArrowRight } from 'lucide-react'

interface WorkoutTemplate {
  id: string
  name: string
  description: string | null
  duration: number | null
  workout_template_exercises: {
    id: string
  }[]
  created_at: string
}

export default function WorkoutsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('workout_templates')
        .select(`
          id,
          name,
          description,
          duration,
          workout_template_exercises (id),
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setTemplates(data)
      }
      setLoading(false)
    }

    fetchTemplates()
  }, [user, supabase])

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Meus Treinos</h1>
        <Link href="/workouts/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </Link>
      </div>

      {/* Lista de Treinos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mx-auto flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-zinc-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  Nenhum treino criado
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Crie seu primeiro treino para começar
                </p>
              </div>
              <Link href="/workouts/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Treino
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Link key={template.id} href={`/workouts/${template.id}`}>
              <Card className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3.5 h-3.5" />
                          {template.workout_template_exercises.length} exercícios
                        </span>
                        {template.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {template.duration} min
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-1">
                          {template.description}
                        </p>
                      )}
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
