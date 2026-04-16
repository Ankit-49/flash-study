import { createClient } from '@/utils/supabase/client'
import { StudyKitData } from '@/components/StudyKit'

const supabase = createClient()

export interface Profile {
  id: string
  email: string
  streak: number
  last_active: string
}

export interface StudySession {
  id: string
  user_id: string
  title: string
  data: StudyKitData
  created_at: string
  is_pinned: boolean
}

// --- Profile Functions ---

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return data as Profile
}

export async function updateStreak() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const profile = await getProfile()
  if (!profile) return

  const today = new Date().toDateString()
  const lastActive = new Date(profile.last_active).toDateString()

  if (today === lastActive) return

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const wasActiveYesterday = lastActive === yesterday.toDateString()

  const newStreak = wasActiveYesterday ? profile.streak + 1 : 1

  await supabase
    .from('profiles')
    .update({ 
      streak: newStreak, 
      last_active: new Date().toISOString() 
    })
    .eq('id', user.id)
}

export async function syncStreak(localStreak: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await getProfile()
  if (!profile) return null

  // If cloud streak is less than local, hoist the local streak
  if (profile.streak < localStreak) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ streak: localStreak })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error syncing streak:', error)
      return null
    }
    return data as Profile
  }
  return profile
}

// --- Session Functions ---

export async function fetchSessions() {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }
  return data as StudySession[]
}

export async function upsertSession(session: Partial<StudySession>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('study_sessions')
    .upsert({
      ...session,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting session:', error)
    return null
  }
  return data as StudySession
}

export async function deleteSession(id: string) {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting session:', error)
    return false
  }
  return true
}

export async function togglePinSession(id: string, isPinned: boolean) {
  const { error } = await supabase
    .from('study_sessions')
    .update({ is_pinned: isPinned })
    .eq('id', id)

  if (error) {
    console.error('Error toggling pin:', error)
    return false
  }
  return true
}
