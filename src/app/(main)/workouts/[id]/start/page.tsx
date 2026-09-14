'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Check, Clock, Play, Pause, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ExerciseInTemplate {
  id: string
  exercise_id: string
  sets: number
  reps_min: number | null
  reps_max: number | null
  target_rir: number | null
  rest_seconds: number | null
  order_index: number
  exercise: {
    id: string
    name: string
    primary_muscle: string
  }
  previous_sets?: {
    weight: number | null
    reps: number | null
    rir: number | null
  }[]
}

interface TemplateData {
  id: string
  name: string
  description: string | null
  exercises: ExerciseInTemplate[]
}

export default function StartWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()

  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionExercises, setSessionExercises] = useState<any[]>([])
  
  // Registro de série
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRir] = useState(2)
  const [saving, setSaving] = useState(false)

  // Timer
  const [restTime, setRestTime] = useState(0)
  const [isResting, setIsResting] = useState(false)

  const templateId = params.id as string

  useEffect(() => {
    if (!user) return

    const fetchTemplate = async () => {
      // Buscar template com exercícios
      const { data: templateData } = await supabase
        .from('workout_templates')
        .select(`
          id,
          name,
          description,
          workout_template_blocks (
            workout_template_exercises (
              id,
              sets,
              reps_min,
              reps_max,
              target_rir,
              rest_seconds,
              order_index,
              exercise:exercises (
                id,
                name,
                primary_muscle
              )
            )
          )
        `)
        .eq('id', templateId)
        .single()

      if (templateData) {
        const exercises = templateData.workout_template_blocks
          .flatMap((block: any) => block.workout_template_exercises)
          .sort((a: any, b: any) => a.order_index - b.order_index)
        
        // Buscar última sessão deste template para sugerido de carga
        const { data: lastSession } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('template_id', templateId)
          .order('started_at', { ascending: false })
          .limit(1)
          .single()

        let previousSets: any = {}
        
        if (lastSession) {
          const { data: sessionExercisesData } = await supabase
            .from('workout_session_exercises')
            .select(`
              exercise_id,
              workout_sets (
                weight,
                reps,
                rir
              )
            `)
            .eq('session_id', lastSession.id)

          if (sessionExercisesData) {
            sessionExercisesData.forEach((se: any) => {
              if (se.workout_sets && se.workout_sets.length > 0) {
                previousSets[se.exercise_id] = se.workout_sets
              }
            })
          }
        }

        const exercisesWithPrevious = exercises.map((ex: any) => ({
          ...ex,
          previous_sets: previousSets[ex.exercise_id] || []
        }))

        setTemplate({
          id: templateData.id,
          name: templateData.name,
          description: templateData.description,
          exercises: exercisesWithPrevious
        })

        // Preencher valores padrão
        if (exercisesWithPrevious.length > 0) {
          const firstEx = exercisesWithPrevious[0]
          if (firstEx.previous_sets && firstEx.previous_sets.length > 0) {
            const lastSet = firstEx.previous_sets[firstEx.previous_sets.length - 1]
            setWeight(lastSet.weight?.toString() || '')
            setReps(lastSet.reps?.toString() || (firstEx.reps_max?.toString() || ''))
          } else {
            setReps(firstEx.reps_max?.toString() || '10')
          }
        }
      }

      setLoading(false)
    }

    fetchTemplate()
  }, [user, supabase, templateId])

  // Timer de descanso
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsResting(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTime])

  const startWorkout = async () => {
    if (!user || !template) return

    const { data: session } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        template_id: template.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (session) {
      setSessionId(session.id)

      // Criar exercícios da sessão
      const sessionExercisesData = await Promise.all(
        template.exercises.map((ex, index) =>
          supabase
            .from('workout_session_exercises')
            .insert({
              session_id: session.id,
              exercise_id: ex.exercise_id,
              order_index: index,
            })
            .select()
            .single()
        )
      )

      setSessionExercises(sessionExercisesData.map((s) => s.data))
    }
  }

  const completeSet = async () => {
    if (!sessionId || !sessionExercises[currentExerciseIndex]) return

    setSaving(true)

    const sessionExerciseId = sessionExercises[currentExerciseIndex].id

    await supabase
      .from('workout_sets')
      .insert({
        session_exercise_id: sessionExerciseId,
        set_number: currentSet,
        weight: weight ? parseFloat(weight) : null,
        reps: reps ? parseInt(reps) : null,
        rir,
        is_completed: true,
      })

    // Próxima série ou exercício
    const currentEx = template?.exercises[currentExerciseIndex]
    
    if (currentSet < (currentEx?.sets || 3)) {
      setCurrentSet(currentSet + 1)
      // Sugerir mesmo peso
    } else if (currentExerciseIndex < (template?.exercises.length || 0) - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setCurrentSet(1)
      
      // Reset valores para próximo exercício
      const nextEx = template?.exercises[currentExerciseIndex + 1]
      if (nextEx?.previous_sets && nextEx.previous_sets.length > 0) {
        const lastSet = nextEx.previous_sets[nextEx.previous_sets.length - 1]
        setWeight(lastSet.weight?.toString() || '')
        setReps(lastSet.reps?.toString() || (nextEx.reps_max?.toString() || '10'))
      } else {
        setWeight('')
        setReps(nextEx?.reps_max?.toString() || '10')
      }
    } else {
      // Treino completo
      await finishWorkout()
    }

    // Iniciar descanso
    if (currentEx?.rest_seconds) {
      setRestTime(currentEx.rest_seconds)
      setIsResting(true)
    }

    setSaving(false)
  }

  const finishWorkout = async () => {
    if (!sessionId) return

    await supabase
      .from('workout_sessions')
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    router.push('/history')
  }

  const skipRest = () => {
    setIsResting(false)
    setRestTime(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-4">
        <p>Treino não encontrado</p>
        <Link href="/workouts">
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    )
  }

  const currentExercise = template.exercises[currentExerciseIndex]

  // Tela inicial - iniciar treino
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-zinc-200 border-zinc-800 p-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Link href="/today">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-lg">Iniciar Treino</h1>
            <div className="w-9" />
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-2">{template.name}</h2>
              {template.description && (
                <p className="text-zinc-500 text-zinc-400 mb-4">
                  {template.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span>{template.exercises.length} exercícios</span>
                <span>•</span>
                <span>{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2 mb-6">
            {template.exercises.map((ex, index) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 bg-zinc-900"
              >
                <span className="w-6 h-6 rounded-full bg-zinc-200 bg-zinc-800 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{ex.exercise.name}</p>
                  <p className="text-xs text-zinc-500">{ex.exercise.primary_muscle}</p>
                </div>
                <span className="text-sm text-zinc-500">
                  {ex.sets}×{ex.reps_min}-{ex.reps_max}
                </span>
              </div>
            ))}
          </div>

          <Button className="w-full h-14 text-lg" onClick={startWorkout}>
            <Play className="w-5 h-5 mr-2" />
            Começar Treino
          </Button>
        </div>
      </div>
    )
  }

  // Durante o treino
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-zinc-200 border-zinc-800 p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <span className="text-sm text-zinc-500">
            {currentExerciseIndex + 1}/{template.exercises.length}
          </span>
          <h1 className="font-semibold">{template.name}</h1>
          <Button variant="ghost" size="sm" onClick={finishWorkout}>
            Finalizar
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Timer de descanso */}
        {isResting && (
          <Card className="mb-6 bg-zinc-900 bg-zinc-800">
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-sm text-zinc-400 mb-2">Descanso</p>
                <p className="text-5xl font-bold text-white mb-4">
                  {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
                </p>
                <Button variant="outline" onClick={skipRest}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Pular
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercício atual */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-zinc-500 mb-1">{currentExercise.exercise.primary_muscle}</p>
            <h2 className="text-2xl font-bold">{currentExercise.exercise.name}</h2>
          </div>

          {/* Info da última sessão */}
          {currentExercise.previous_sets && currentExercise.previous_sets.length > 0 && (
            <Card className="bg-zinc-50 bg-zinc-900">
              <CardContent className="py-3">
                <p className="text-sm text-zinc-500 mb-2">Última vez:</p>
                <div className="flex gap-4">
                  <span className="text-sm">
                    {currentExercise.previous_sets[0]?.weight || '—'} kg
                  </span>
                  <span className="text-sm">
                    {currentExercise.previous_sets.map((s: any) => s.reps).join(' / ')} reps
                  </span>
                  <span className="text-sm">
                    RIR {currentExercise.previous_sets[0]?.rir || '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-zinc-100 bg-zinc-800">
              Meta: {currentExercise.sets}×{currentExercise.reps_min}-{currentExercise.reps_max}
            </span>
            {currentExercise.target_rir !== null && (
              <span className="px-3 py-1 rounded-full bg-zinc-100 bg-zinc-800">
                RIR alvo: {currentExercise.target_rir}
              </span>
            )}
          </div>

          {/* Série atual */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">
                Série {currentSet} de {currentExercise.sets}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-2 text-center">Peso (kg)</label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="text-center text-xl h-14"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-2 text-center">Reps</label>
                <Input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="text-center text-xl h-14"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-2 text-center">RIR</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRir(r)}
                      className={`flex-1 h-14 rounded-lg font-medium transition-colors ${
                        rir === r
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 bg-zinc-800 hover:bg-zinc-200 hover:bg-zinc-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg mt-4"
              onClick={completeSet}
              disabled={saving}
            >
              {saving ? (
                'Salvando...'
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Concluir Série
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Lista de exercícios */}
        <div className="mt-8">
          <p className="text-sm text-zinc-500 mb-3">Exercícios</p>
          <div className="space-y-2">
            {template.exercises.map((ex, index) => (
              <div
                key={ex.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  index === currentExerciseIndex
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-50 bg-zinc-900'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === currentExerciseIndex
                    ? 'bg-white/20'
                    : 'bg-zinc-200 bg-zinc-800'
                }`}>
                  {index + 1}
                </span>
                <span className="flex-1">{ex.exercise.name}</span>
                <span className="text-xs opacity-60">{ex.sets}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
