'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import { type Profile } from '@/types'
import { toast } from 'sonner'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async (userId: string) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle() // Use maybeSingle to avoid 406 on no rows

                if (error) {
                    console.error("Error fetching profile:", error)
                }

                if (data) {
                    setProfile(data)
                } else {
                    console.warn("User has no profile. Attempting to regenerate...")
                    // Self-healing: Create profile if missing (e.g. after DB reset)
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert({
                            id: userId,
                            full_name: user?.user_metadata?.full_name || 'Usuario',
                            avatar_url: user?.user_metadata?.avatar_url || '',
                            role: 'passenger' // Default to passenger
                        })
                        .select()
                        .single()

                    if (newProfile) {
                        setProfile(newProfile)
                        console.log("Profile regenerated successfully.")
                        toast.success("Perfil restaurado automáticamente")
                    } else {
                        console.error("Failed to regenerate profile:", createError)
                        setProfile(null)
                    }
                }
            } catch (err) {
                console.error("Unexpected error in fetchProfile:", err)
            }
        }

        // Safety timeout to prevent infinite loading
        const timeout = setTimeout(() => setLoading(false), 5000)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                }

                setLoading(false)
                clearTimeout(timeout)
            }
        )

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [supabase])

    const signOut = async () => {
        // Optimistic UI: Reset state immediately
        setUser(null)
        setProfile(null)

        // Force immediate redirect without waiting
        window.location.href = '/login'

        // Perform cleanup in background (if execution continues before unload)
        try {
            await supabase.auth.signOut()
        } catch (e) {
            console.error('Error signing out:', e)
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
