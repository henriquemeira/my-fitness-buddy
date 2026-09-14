'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { useEffect, useState } from 'react'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

export function useAuth() {
  const { user, loading, initialized, setUser, setLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setLoading, supabase])

  return { user, loading, initialized }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
