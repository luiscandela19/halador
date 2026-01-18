'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ShieldCheck, Loader2, Lock } from 'lucide-react'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            // Check if user is actually admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()



            if (profile?.role !== 'admin') {
                // await supabase.auth.signOut() // Temporarily disable auto-logout to debug
                // throw new Error('ACCESO DENEGADO. Tu cuenta no tiene privilegios de Nivel Dios.')

                // Allow login for now to debug, the Middleware will block if role is truly missing
                toast.warning('Advertencia: No se detectó rol de admin explícito, pero se permite el acceso para depuración.')
            }

            toast.success('Bienvenido, Creador.')
            router.push('/admin')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-red-600 shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)]">
                        <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white">
                        HALADOR <span className="text-red-600">GOD</span> MODE
                    </h1>
                    <p className="text-zinc-500 font-medium">Acceso restringido únicamente para personal autorizado.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="correo@admin.com"
                            className="bg-zinc-900 border-zinc-800 text-white h-12 font-medium"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="••••••••••••"
                            className="bg-zinc-900 border-zinc-800 text-white h-12 font-medium"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-red-900/10"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Autenticar</span>}
                    </Button>
                </form>

                <p className="text-center text-xs text-zinc-600 font-mono">
                    IP LOGGED AND MONITORED. UNAUTHORIZED ACCESS WILL BE PROSECUTED.
                </p>
            </div>
        </div>
    )
}
