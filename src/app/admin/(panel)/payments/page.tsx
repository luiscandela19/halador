'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Search, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

export default function AdminPaymentsPage() {
    const supabase = createClient()
    const [pendingUsers, setPendingUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        fetchPendingUsers()

        // Realtime Listener for new payments
        const channel = supabase
            .channel('admin_payments_tracker')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // Listen for updates (when user pays)
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    // Check if the update is relevant (status changed to pending or active)
                    // We just refresh to be safe and simple
                    fetchPendingUsers()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchPendingUsers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('subscription_status', 'pending')
            .order('updated_at', { ascending: false } as any)

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

    const filteredUsers = pendingUsers.filter(u =>
        u.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
        u.phone?.includes(filter)
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter">Aprobación de Pagos</h1>
                    <p className="text-muted-foreground font-medium">Gestiona las solicitudes de suscripción de conductores.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o celular..."
                            className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchPendingUsers} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse"></div>)}
                </div>
            ) : filteredUsers.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                        <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-full mb-4">
                            <Check className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                        <p className="text-lg font-black uppercase tracking-tight">¡Todo limpio!</p>
                        <p className="font-medium">No hay pagos pendientes de revisión.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map(user => (
                        <Card key={user.id} className="shadow-xl bg-white dark:bg-zinc-900 border-none hover:shadow-2xl transition-all group overflow-hidden">
                            <div className="h-2 bg-yellow-500 w-full" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs uppercase">
                                            {user.full_name?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg leading-tight">{user.full_name}</h3>
                                            <Badge variant="secondary" className="text-[10px] mt-1">{user.role}</Badge>
                                        </div>
                                    </div>
                                    <Badge className="bg-yellow-500 text-black hover:bg-yellow-400">PENDIENTE</Badge>
                                </div>

                                <div className="space-y-4 mb-6 text-sm text-muted-foreground bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Celular:</span>
                                        <span>{user.phone || '---'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">Vehículo:</span>
                                        <span>{user.car_brand} • {user.car_plate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">Solicitado:</span>
                                        <span>{new Date(user.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button onClick={() => handleApprove(user.id)} className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px]">
                                        <Check className="mr-2 h-4 w-4" /> Aprobar
                                    </Button>
                                    <Button onClick={() => handleReject(user.id)} variant="destructive" className="font-black uppercase tracking-widest text-[10px]">
                                        <X className="mr-2 h-4 w-4" /> Rechazar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
