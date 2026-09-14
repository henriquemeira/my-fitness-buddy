'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, X, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  id: string
  name: string
  primary_muscle: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [exercises, setExercises] = useState<any[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase
        .from('exercises')
        .select('id, name, primary_muscle')
        .eq('is_active', true)
        .order('name')

      if (data) {
        setAvailableExercises(data)
      }
    }

    fetchExercises()
  }, [supabase])

  const addExercise = (exercise: Exercise) => {
    setExercises([
      ...exercises,
      {
        ...exercise,
        sets: 3,
        reps_min: 8,
        reps_max: 12,
        target_rir: 2,
        rest_seconds: 90,
      },
    ])
    setShowExercisePicker(false)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: string, value: any) => {
    setExercises(
      exercises.map((ex, i) =>
        i === index ? { ...ex, [field]: value } : ex
      )
    )
  }

  const handleSave = async () => {
    if (!user || !name || exercises.length === 0) return

    setLoading(true)

    // Criar template
    const { data: template, error: templateError } = await supabase
      .from('workout_templates')
      .insert({
        user_id: user.id,
        name,
        description,
        duration: duration ? parseInt(duration) : null,
      })
      .select()
      .single()

    if (templateError) {
      alert('Erro ao criar treino')
      setLoading(false)
      return
    }

    // Criar bloco padrão
    const { data: block } = await supabase
      .from('workout_template_blocks')
      .insert({
        template_id: template.id,
        block_type: 'normal',
        order_index: 0,
      })
      .select()
      .single()

    // Criar exercícios do template
    const templateExercises = exercises.map((ex, index) => ({
      template_id: template.id,
      block_id: block.id,
      exercise_id: ex.id,
      order_index: index,
      sets: ex.sets,
      reps_min: ex.reps_min,
      reps_max: ex.reps_max,
      target_rir: ex.target_rir,
      rest_seconds: ex.rest_seconds,
    }))

    const { error: exercisesError } = await supabase
      .from('workout_template_exercises')
      .insert(templateExercises)

    if (exercisesError) {
      alert('Erro ao adicionar exercícios')
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/workouts')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href="/workouts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Novo Treino</h1>
          <Button onClick={handleSave} disabled={loading || !name || exercises.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Informações básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do Treino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome do Treino"
              placeholder="Ex: Full Body, Push, Pull..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Descrição (opcional)"
              placeholder="Ex: Treino completo para quem está começando"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Duração estimada (minutos)"
              type="number"
              placeholder="60"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Lista de exercícios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Exercícios</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowExercisePicker(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <p>Nenhum exercício adicionado</p>
                <p className="text-sm mt-1">Adicione exercícios ao seu treino</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div
                    key={`${exercise.id}-${index}`}
                    className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{exercise.name}</h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {exercise.primary_muscle}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(index)}
                      >
                        <Trash2 className="w-4 h-4 text-zinc-400" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-zinc-500">Séries</label>
                        <Input
                          type="number"
                          min={1}
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExercise(index, 'sets', parseInt(e.target.value))
                          }
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Reps min</label>
                        <Input
                          type="number"
                          min={1}
                          value={exercise.reps_min}
                          onChange={(e) =>
                            updateExercise(index, 'reps_min', parseInt(e.target.value))
                          }
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Reps max</label>
                        <Input
                          type="number"
                          min={1}
                          value={exercise.reps_max}
                          onChange={(e) =>
                            updateExercise(index, 'reps_max', parseInt(e.target.value))
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs text-zinc-500">RIR alvo</label>
                        <Input
                          type="number"
                          min={0}
                          max={4}
                          value={exercise.target_rir}
                          onChange={(e) =>
                            updateExercise(index, 'target_rir', parseInt(e.target.value))
                          }
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Descanso (s)</label>
                        <Input
                          type="number"
                          min={0}
                          value={exercise.rest_seconds}
                          onChange={(e) =>
                            updateExercise(index, 'rest_seconds', parseInt(e.target.value))
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full max-h-[80vh] rounded-t-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold">Selecionar Exercício</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowExercisePicker(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <Input
                placeholder="Buscar exercício..."
                className="mb-4"
                onChange={(e) => {
                  const search = e.target.value.toLowerCase()
                  // Filter exercises
                }}
              />
              <div className="space-y-1">
                {availableExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="w-full text-left p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-zinc-500">{exercise.primary_muscle}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
