'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, LogIn } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            toast.success('¡Bienvenido de nuevo!')
            window.location.href = '/'
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-primary italic">HALADOR</h1>
                <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">V2 • Next-Gen Transport</p>
            </div>

            <Card className="w-full shadow-2xl border-none bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle>Iniciar Sesión</CardTitle>
                    <CardDescription>Ingresa tus datos para continuar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" className="w-full text-lg h-12 font-bold" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            Entrar
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        ¿No tienes cuenta?{' '}
                        <a href="/register" className="font-bold text-primary hover:underline">
                            Regístrate aquí
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
