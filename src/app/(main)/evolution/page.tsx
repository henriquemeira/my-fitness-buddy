'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Dumbbell, Calendar, Award } from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Stats {
  totalWorkouts: number
  totalVolume: number
  currentStreak: number
  thisWeekWorkouts: number
}

interface ExerciseStats {
  exercise_id: string
  exercise_name: string
  maxWeight: number
  totalSets: number
  totalReps: number
}

export default function EvolutionPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({
    totalWorkouts: 0,
    totalVolume: 0,
    currentStreak: 0,
    thisWeekWorkouts: 0,
  })
  const [topExercises, setTopExercises] = useState<ExerciseStats[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('4weeks')

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      // Calcular período
      let startDate: Date
      const now = new Date()
      
      switch (timeRange) {
        case '4weeks':
          startDate = subDays(now, 28)
          break
        case '8weeks':
          startDate = subDays(now, 56)
          break
        case '3months':
          startDate = subDays(now, 90)
          break
        case '6months':
          startDate = subDays(now, 180)
          break
        case '1year':
          startDate = subDays(now, 365)
          break
        default:
          startDate = subDays(now, 28)
      }

      // Buscar sessões no período
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('started_at, ended_at, duration')
        .eq('user_id', user.id)
        .gte('started_at', startDate.toISOString())

      if (sessions) {
        // Total de treinos
        const totalWorkouts = sessions.length
        
        // Treinos dessa semana
        const weekStart = startOfWeek(now, { weekStartsOn: 0 })
        const thisWeekWorkouts = sessions.filter(
          (s) => new Date(s.started_at) >= weekStart
        ).length

        // Calcular streak
        let streak = 0
        let currentDate = now
        while (true) {
          const dayStart = new Date(currentDate)
          dayStart.setHours(0, 0, 0, 0)
          const hasWorkout = sessions.some((s) => {
            const sessionDate = new Date(s.started_at)
            sessionDate.setHours(0, 0, 0, 0)
            return sessionDate.getTime() === dayStart.getTime()
          })
          
          if (hasWorkout) {
            streak++
            currentDate = subDays(currentDate, 1)
          } else {
            break
          }
        }

        setStats({
          totalWorkouts,
          totalVolume: 0, // Simplificado
          currentStreak: streak,
          thisWeekWorkouts,
        })
      }

      // Buscar exercícios mais executados
      const { data: exerciseData } = await supabase
        .from('workout_sets')
        .select(`
          session_exercise_id,
          workout_session_exercises!inner (
            exercise_id,
            exercises!inner (name)
          ),
          weight,
          reps
        `)
        .gte('created_at', startDate.toISOString())
        .eq('is_completed', true)

      if (exerciseData) {
        const exerciseMap = new Map<string, ExerciseStats>()
        
        exerciseData.forEach((set: any) => {
          const exerciseId = set.workout_session_exercises.exercise_id
          const exerciseName = set.workout_session_exercises.exercises.name
          const weight = set.weight || 0
          const reps = set.reps || 0

          if (!exerciseMap.has(exerciseId)) {
            exerciseMap.set(exerciseId, {
              exercise_id: exerciseId,
              exercise_name: exerciseName,
              maxWeight: 0,
              totalSets: 0,
              totalReps: 0,
            })
          }

          const stats = exerciseMap.get(exerciseId)!
          stats.maxWeight = Math.max(stats.maxWeight, weight)
          stats.totalSets++
          stats.totalReps += reps
        })

        const sortedExercises = Array.from(exerciseMap.values())
          .sort((a, b) => b.totalSets - a.totalSets)
          .slice(0, 5)

        setTopExercises(sortedExercises)
      }

      setLoading(false)
    }

    fetchData()
  }, [user, supabase, timeRange])

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Evolução</h1>

      {/* Filtro de período */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: '4weeks', label: '4 semanas' },
          { value: '8weeks', label: '8 semanas' },
          { value: '3months', label: '3 meses' },
          { value: '6months', label: '6 meses' },
          { value: '1year', label: '1 ano' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setTimeRange(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              timeRange === option.value
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                    <p className="text-sm text-zinc-500">Treinos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.currentStreak}</p>
                    <p className="text-sm text-zinc-500">Sequência</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.thisWeekWorkouts}</p>
                    <p className="text-sm text-zinc-500">Esta semana</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Award className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{topExercises.length}</p>
                    <p className="text-sm text-zinc-500">Exercícios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exercícios mais executados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exercícios Mais Executados</CardTitle>
            </CardHeader>
            <CardContent>
              {topExercises.length === 0 ? (
                <p className="text-center text-zinc-500 py-4">
                  Nenhum exercício registrado no período
                </p>
              ) : (
                <div className="space-y-4">
                  {topExercises.map((ex, index) => (
                    <div key={ex.exercise_id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{ex.exercise_name}</p>
                        <p className="text-sm text-zinc-500">
                          {ex.maxWeight} kg máx • {ex.totalSets} séries • {ex.totalReps} reps
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Volume de Treino</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end justify-between gap-2">
                {[...Array(7)].map((_, i) => {
                  const height = Math.random() * 80 + 20
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-zinc-500">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
