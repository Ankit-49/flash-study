'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LogIn, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    checkUser()

    // Setup auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) {
    return <div className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-pulse w-10 h-10" />
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-500/20 transition-all shadow-sm group"
        title="Sign out"
      >
        <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>
    )
  }

  return (
    <button
      onClick={() => router.push('/login')}
      className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium text-sm hover:bg-primary/20 transition-all shadow-sm group"
      title="Sign in"
    >
      <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
      <span className="hidden sm:inline">Sign In</span>
    </button>
  )
}
