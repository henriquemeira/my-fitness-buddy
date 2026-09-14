// Tipos gerados a partir do modelo de dados do Supabase

export type UUID = string

// Enums
export type Gender = 'male' | 'female' | 'other' | null
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type BlockType = 'normal' | 'superset' | 'biset' | 'triset' | 'circuit' | 'giant_set'
export type LoadUnit = 'kg' | 'lb' | 'bodyweight' | 'time' | 'distance'
export type WorkoutMood = '1' | '2' | '3' | '4' | '5'
export type WorkoutFatigue = '1' | '2' | '3' | '4' | '5'
export type WorkoutPain = 'none' | 'mild' | 'moderate' | 'severe'

// Tabelas
export interface Profile {
  id: UUID
  user_id: UUID
  name: string
  birth_date: string | null
  gender: Gender
  weight: number | null
  height: number | null
  experience: ExperienceLevel | null
  objectives: string[] | null
  available_days: number[] | null
  session_time: number | null // minutos
  sports: string[] | null
  notes: string | null
  limitations: string[] | null
  like_exercises: UUID[] | null
  dislike_exercises: UUID[] | null
  available_equipment: UUID[] | null
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: UUID
  name: string
  name_en: string | null
  category: string | null
  created_at: string
}

export interface Exercise {
  id: UUID
  name: string
  alt_name: string | null
  description: string | null
  instructions: string | null
  primary_muscle: string
  secondary_muscles: string[] | null
  movement_pattern: string
  is_unilateral: boolean
  is_compound: boolean
  is_bodyweight: boolean
  load_unit: LoadUnit
  has_distance: boolean
  has_time: boolean
  notes: string | null
  tags: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExerciseEquipment {
  exercise_id: UUID
  equipment_id: UUID
}

export interface WorkoutTemplate {
  id: UUID
  user_id: UUID
  name: string
  description: string | null
  objective: string | null
  duration: number | null // minutos estimados
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkoutTemplateBlock {
  id: UUID
  template_id: UUID
  block_type: BlockType
  order_index: number
  rest_seconds: number | null
  notes: string | null
}

export interface WorkoutTemplateExercise {
  id: UUID
  template_id: UUID
  block_id: UUID
  exercise_id: UUID
  order_index: number
  sets: number
  reps_min: number | null
  reps_max: number | null
  target_rir: number | null
  rest_seconds: number | null
  weight_suggest: number | null
  notes: string | null
  is_optional: boolean
}

export interface WorkoutSession {
  id: UUID
  user_id: UUID
  template_id: UUID | null
  started_at: string
  ended_at: string | null
  duration: number | null // minutos
  notes: string | null
  skipped_exercises: UUID[] | null
  overall_rate: number | null // 1-5
  fatigue: WorkoutFatigue | null
  pain: WorkoutPain | null
  mood: WorkoutMood | null
  created_at: string
}

export interface WorkoutSessionExercise {
  id: UUID
  session_id: UUID
  exercise_id: UUID
  order_index: number
  notes: string | null
  created_at: string
}

export interface WorkoutSet {
  id: UUID
  session_exercise_id: UUID
  set_number: number
  weight: number | null
  reps: number | null
  rir: number | null
  rpe: number | null
  duration_sec: number | null
  distance: number | null
  is_completed: boolean
  pain_flag: boolean
  notes: string | null
  created_at: string
}

export interface PersonalRecord {
  id: UUID
  user_id: UUID
  exercise_id: UUID
  weight: number
  reps: number
  estimated_1rm: number | null
  set_id: UUID | null
  achieved_at: string
  created_at: string
}

// Tipos auxiliares para relacionamentos
export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  blocks: (WorkoutTemplateBlock & {
    exercises: (WorkoutTemplateExercise & {
      exercise: Exercise
    })[]
  })[]
}

export interface WorkoutSessionWithExercises extends WorkoutSession {
  exercises: (WorkoutSessionExercise & {
    exercise: Exercise
    sets: WorkoutSet[]
  })[]
}

// Tipos para criação/atualização
export interface CreateProfileInput {
  name: string
  birth_date?: string | null
  gender?: Gender
  weight?: number | null
  height?: number | null
  experience?: ExperienceLevel | null
  objectives?: string[] | null
  available_days?: number[] | null
  session_time?: number | null
  sports?: string[] | null
  notes?: string | null
  limitations?: string[] | null
  like_exercises?: UUID[] | null
  dislike_exercises?: UUID[] | null
  available_equipment?: UUID[] | null
}

export interface CreateWorkoutTemplateInput {
  name: string
  description?: string | null
  objective?: string | null
  duration?: number | null
}

export interface CreateWorkoutTemplateExerciseInput {
  template_id: UUID
  block_id: UUID
  exercise_id: UUID
  order_index: number
  sets: number
  reps_min?: number | null
  reps_max?: number | null
  target_rir?: number | null
  rest_seconds?: number | null
  weight_suggest?: number | null
  notes?: string | null
  is_optional?: boolean
}

export interface CreateWorkoutSetInput {
  session_exercise_id: UUID
  set_number: number
  weight?: number | null
  reps?: number | null
  rir?: number | null
  rpe?: number | null
  duration_sec?: number | null
  distance?: number | null
  is_completed?: boolean
  pain_flag?: boolean
  notes?: string | null
}
