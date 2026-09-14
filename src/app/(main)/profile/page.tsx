'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, signOut } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Scale, Ruler, Calendar, Target, Save, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  name: string
  birth_date: string | null
  gender: string | null
  weight: number | null
  height: number | null
  experience: string | null
  objectives: string[] | null
  available_days: number[] | null
  session_time: number | null
  notes: string | null
}

const experienceLevels = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]

const daysOfWeek = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

export default function ProfilePage() {
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [experience, setExperience] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setName(data.name || '')
        setBirthDate(data.birth_date || '')
        setGender(data.gender || '')
        setWeight(data.weight?.toString() || '')
        setHeight(data.height?.toString() || '')
        setExperience(data.experience || '')
        setSessionTime(data.session_time?.toString() || '')
        setAvailableDays(data.available_days || [])
        setNotes(data.notes || '')
      }
      setLoading(false)
    }

    fetchProfile()
  }, [user, supabase])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        birth_date: birthDate || null,
        gender: gender || null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        experience: experience || null,
        session_time: sessionTime ? parseInt(sessionTime) : null,
        available_days: availableDays,
        notes: notes || null,
      })
      .eq('user_id', user.id)

    if (error) {
      alert('Erro ao salvar perfil')
    } else {
      alert('Perfil salvo com sucesso!')
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const toggleDay = (day: number) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day))
    } else {
      setAvailableDays([...availableDays, day].sort())
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Perfil</h1>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data de Nascimento"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Sexo
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-12 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2 text-sm"
              >
                <option value="">Selecione</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Medidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Peso (kg)"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Input
              label="Altura (cm)"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Experiência */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Experiência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nível de Experiência
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="flex h-12 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {experienceLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Dias disponíveis para treino
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    availableDays.includes(day.value)
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Duração média por sessão (minutos)"
            type="number"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação relevante..."
            className="flex w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Salvar */}
      <Button className="w-full h-12" onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  )
}
