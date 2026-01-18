'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, UserPlus, Car, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'passenger' | 'driver'>('passenger')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    }
                }
            })

            if (error) throw error

            toast.success('¡Cuenta creada correctamente!')
            toast.info('Revisa tu correo para confirmar (o inicia sesión si el correo está desactivado).')
            window.location.href = '/login'
        } catch (error: any) {
            toast.error(error.message || 'Error al registrarse')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] p-4">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-primary italic">HALADOR</h1>
                <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Únete a la nueva era</p>
            </div>

            <Card className="w-full shadow-2xl border-none bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle>Crear Cuenta</CardTitle>
                    <CardDescription>Regístrate para empezar a viajar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setRole('passenger')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300",
                                    role === 'passenger' ? "border-primary bg-primary/10 shadow-lg scale-105" : "border-muted/50 hover:border-muted-foreground/50 opacity-60 hover:opacity-100"
                                )}
                            >
                                <User className={cn("h-8 w-8 mb-2 transition-transform duration-300", role === 'passenger' ? "text-primary scale-110" : "text-muted-foreground")} />
                                <span className={cn("text-xs font-black uppercase tracking-widest", role === 'passenger' ? "text-primary" : "text-muted-foreground")}>Pasajero</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('driver')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300",
                                    role === 'driver' ? "border-primary bg-primary/10 shadow-lg scale-105" : "border-muted/50 hover:border-muted-foreground/50 opacity-60 hover:opacity-100"
                                )}
                            >
                                <Car className={cn("h-8 w-8 mb-2 transition-transform duration-300", role === 'driver' ? "text-primary scale-110" : "text-muted-foreground")} />
                                <span className={cn("text-xs font-black uppercase tracking-widest", role === 'driver' ? "text-primary" : "text-muted-foreground")}>Conductor</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Input
                                placeholder="Nombre Completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
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
                                placeholder="Escoge una clave segura"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" className="w-full text-lg h-12 font-bold" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Registrarme
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        ¿Ya tienes cuenta?{' '}
                        <a href="/login" className="font-bold text-primary hover:underline">
                            Entra aquí
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
