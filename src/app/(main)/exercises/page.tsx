'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Dumbbell, Filter } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  primary_muscle: string
  secondary_muscles: string[] | null
  movement_pattern: string
  is_compound: boolean
  is_bodyweight: boolean
}

const muscleGroups = [
  'Todos',
  'Quadríceps',
  'Isquiotibiais',
  'Glúteos',
  'Peito',
  'Dorso',
  'Deltoide',
  'Bíceps',
  'Tríceps',
  'Core',
  'Panturrilha',
]

export default function ExercisesPage() {
  const supabase = createClient()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('Todos')

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (data) {
        setExercises(data)
      }
      setLoading(false)
    }

    fetchExercises()
  }, [supabase])

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const matchesMuscle = selectedMuscle === 'Todos' || ex.primary_muscle === selectedMuscle
    return matchesSearch && matchesMuscle
  })

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 text-white">Exercícios</h1>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-10 pr-4 rounded-lg border border-zinc-200 border-zinc-800 bg-white bg-zinc-950"
        />
      </div>

      {/* Filtro por músculo */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {muscleGroups.map((muscle) => (
          <button
            key={muscle}
            onClick={() => setSelectedMuscle(muscle)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedMuscle === muscle
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 bg-zinc-800 text-zinc-600 text-zinc-400'
            }`}
          >
            {muscle}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="border-zinc-200 border-zinc-800">
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-zinc-600 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{exercise.name}</h3>
                    <p className="text-sm text-zinc-500 truncate">
                      {exercise.primary_muscle}
                      {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
                        <span> • {exercise.secondary_muscles.join(', ')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {exercise.is_compound && (
                      <span className="px-2 py-0.5 text-xs rounded bg-zinc-100 bg-zinc-800 text-zinc-600 text-zinc-400">
                        Composto
                      </span>
                    )}
                    {exercise.is_bodyweight && (
                      <span className="px-2 py-0.5 text-xs rounded bg-zinc-100 bg-zinc-800 text-zinc-600 text-zinc-400">
                        Peso corporal
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-zinc-500">
        {filteredExercises.length} exercícios
      </p>
    </div>
  )
}
