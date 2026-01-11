'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Shield, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { redirect } from 'next/navigation'

export default function AdminPage() {
    const { profile } = useAuth()
    const supabase = createClient()
    const [pendingUsers, setPendingUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Security Check: Redirect if not admin
    useEffect(() => {
        if (profile && profile.role !== 'admin') {
            redirect('/')
        }
    }, [profile])

    useEffect(() => {
        if (profile?.role === 'admin') {
            fetchPendingUsers()
        }
    }, [profile])

    const fetchPendingUsers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('subscription_status', 'pending')
            .order('updated_at', { ascending: false } as any) // Type assertion if needed

        if (error) {
            toast.error('Error cargando usuarios: ' + error.message)
        } else {
            setPendingUsers(data || [])
        }
        setLoading(false)
    }

    const handleApprove = async (userId: string) => {
        const nextMonth = new Date()
        nextMonth.setDate(nextMonth.getDate() + 30)

        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'active',
                subscription_end_date: nextMonth.toISOString()
            })
            .eq('id', userId)

        if (error) {
            toast.error('Error al aprobar: ' + error.message)
        } else {
            toast.success('Usuario activado correctamente')
            fetchPendingUsers()
        }
    }

    const handleReject = async (userId: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'inactive',
                subscription_end_date: null
            })
            .eq('id', userId)

        if (error) {
            toast.error('Error al rechazar: ' + error.message)
        } else {
            toast.success('Pago rechazado')
            fetchPendingUsers()
        }
    }

    if (!profile || profile.role !== 'admin') {
        return <div className="p-8 text-center">Verificando permisos...</div>
    }

    return (
        <div className="flex flex-col space-y-6 p-4 pb-20">
            <header className="py-4 border-b flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-indigo-600">MODO DIOS</h1>
                    <p className="text-muted-foreground text-sm font-medium">Administración de Pagos</p>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchPendingUsers} disabled={loading}>
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </header>

            <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Pagos Pendientes ({pendingUsers.length})
                </h2>

                {pendingUsers.length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/20">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Check className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-tighter">Todo al día, jefe.</p>
                        </CardContent>
                    </Card>
                ) : (
                    pendingUsers.map(user => (
                        <Card key={user.id} className="shadow-lg border-l-4 border-l-yellow-500 overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black uppercase italic tracking-tight">{user.full_name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase">
                                                {user.role === 'driver' ? 'Conductor' : 'Pasajero'}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground">{user.phone || 'Sin teléfono'}</span>
                                        </div>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 uppercase font-black text-[10px]">
                                        Pendiente
                                    </Badge>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleApprove(user.id)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs"
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Aprobar
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(user.id)}
                                        variant="destructive"
                                        className="flex-1 font-black uppercase tracking-widest text-xs"
                                    >
                                        <X className="mr-2 h-4 w-4" /> Rechazar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
