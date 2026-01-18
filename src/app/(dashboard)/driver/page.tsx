'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, MapPin, Calendar, Clock, Loader2, Navigation, Trash2, Users, Plus, Phone, Check, Music, Wind, Dog, Package, CigaretteOff } from 'lucide-react'
import { toast } from 'sonner'
import { PERU_CITIES } from '@/lib/cities'
import { type Trip, type TripRequest } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

import { useDriverTrips, useDriverRequests } from '@/hooks/use-trips'

export default function DriverDashboard() {
    const { user, profile } = useAuth()
    const supabase = createClient()

    // SWR Hooks
    const { trips, isLoading: loadingTrips, mutate: mutateTrips } = useDriverTrips(user?.id)
    const { requests, isLoading: loadingRequests, mutate: mutateRequests } = useDriverRequests(user?.id)

    const loading = loadingTrips || loadingRequests

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        date: '',
        time: '',
        price: '30', // String to handle input correctly
        seats: 4,
        features: [] as string[]
    })

    // Realtime logic handled implicitly by SWR refreshInterval + manual mutation on change, 
    // but we can keep subscriptions purely for notification toasts if desired, 
    // or just rely on SWR's fast polling. For "Turbo" feel, SWR polling (5s) + optimistic update is best.
    // We will keep Profile listener as it's critical.

    useEffect(() => {
        if (!user) return

        // 1. Profile Tracker (Subscription status)
        const profileChannel = supabase
            .channel('driver_profile_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                (payload: any) => {
                    if (payload.new.subscription_status === 'active') {
                        toast.success('¡Suscripción Activada! 🚀')
                        setTimeout(() => window.location.reload(), 1500)
                    }
                }
            )
            .subscribe()

        // 2. Incoming Requests Tracker (Realtime Booking)
        const requestsChannel = supabase
            .channel('driver_incoming_requests')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trip_requests',
                    filter: `driver_id=eq.${user.id}`
                },
                (payload) => {
                    // New Request Arrived!
                    toast.success('¡Nueva solicitud de pasajero!')
                    mutateRequests() // Instant refresh SWR
                    const audio = new Audio('/sounds/notification.mp3') // Optional simple beep if file exists, or browser default
                    audio.play().catch(() => { })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(profileChannel)
            supabase.removeChannel(requestsChannel)
        }
    }, [user, mutateRequests])

    // Helper to refresh everything
    const refreshAll = () => {
        mutateTrips()
        mutateRequests()
    }

    const handlePublishClick = () => {
        if (profile?.subscription_status === 'active') {
            setShowForm(true)
        } else {
            setShowPaymentModal(true)
        }
    }

    const handleConfirmPayment = async () => {
        if (!user) return
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_status: 'pending' })
                .eq('id', user.id)

            if (error) throw error
            toast.success('Pago reportado. Esperando validación del admin.')
            setShowPaymentModal(false)
        } catch (error: any) {
            toast.error('Error: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAcceptRequest = async (requestId: string) => {
        try {
            const { data, error } = await supabase.rpc('approve_trip_request', { request_id: requestId })

            if (error) throw error
            if (data && !data.success) throw new Error(data.error)

            toast.success('Pasajero aceptado correctamente')
            mutateRequests() // Refresh requests
            mutateTrips()    // Refresh trips (seats update)
        } catch (error: any) {
            toast.error(error.message || 'Error al aceptar')
        }
    }

    const handleRejectRequest = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('trip_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId)

            if (error) throw error
            toast.success('Solicitud rechazada')
            mutateRequests()
        } catch (error: any) {
            toast.error(error.message)
        }
    }


    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setIsSubmitting(true)

        // 1. Validate Inputs
        if (!formData.from || !formData.to || !formData.date || !formData.time) {
            toast.error("Por favor completa todos los campos")
            setIsSubmitting(false)
            return
        }

        const price = parseFloat(formData.price.toString())
        const seats = parseInt(formData.seats.toString())

        if (isNaN(price) || price <= 0) {
            toast.error("El precio debe ser mayor a 0")
            setIsSubmitting(false)
            return
        }

        if (isNaN(seats) || seats < 1) {
            toast.error("Debe haber al menos 1 asiento")
            setIsSubmitting(false)
            return
        }

        try {
            // Find coordinates
            const cityData = PERU_CITIES.find(c => c.name === formData.from)
            const lat = cityData ? cityData.lat.toString() : null
            const lng = cityData ? cityData.lng.toString() : null

            // 2. Add Timeout to prevent infinite hang
            const insertPromise = supabase.from('trips').insert({
                driver_id: user.id,
                from_loc: formData.from,
                to_loc: formData.to,
                date: formData.date,
                time: formData.time,
                price: price, // Use parsed price
                seats_total: seats, // Use parsed seats
                seats_available: seats, // Use parsed seats
                driver_lat: lat,
                driver_lng: lng,
                status: 'open',
                features: formData.features
            })

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Tiempo de espera agotado (10s). Revisa tu conexión.")), 10000)
            )

            // Race: Database vs Timeout
            const { error } = await Promise.race([insertPromise, timeoutPromise]) as any

            if (error) {
                console.error("Supabase Error Full Object:", error)
                throw error
            }

            toast.success('¡Viaje publicado con éxito!')
            setShowForm(false)
            mutateTrips()
        } catch (error: any) {
            toast.error('Error: ' + (error.message || 'Error desconocido'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteTrip = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar este viaje?')) return

        try {
            const { error } = await supabase.from('trips').delete().eq('id', id)
            if (error) throw error
            toast.success('Viaje eliminado')
            mutateTrips()
        } catch (error: any) {
            toast.error('Error: ' + error.message)
        }
    }

    return (
        <div className="flex flex-col space-y-6 p-4 pb-20">
            <header className="py-4 border-b">
                <h1 className="text-2xl font-black italic tracking-tighter">HALADOR <span className="text-primary not-italic font-bold text-xs ml-2 border px-2 py-0.5 rounded-full uppercase tracking-tighter">Conductor</span></h1>
                <p className="text-muted-foreground text-sm font-medium">Gestiona tus rutas y pasajeros</p>
            </header>

            {requests.length > 0 && (
                <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl animate-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            Gestión de Pasajeros ({requests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {requests.map((req) => (
                            <div key={req.id} className="flex flex-col gap-3 bg-background p-3 rounded-xl shadow-sm border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm">{req.passenger_name}</p>
                                            <Badge variant={req.status === 'accepted' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                                {req.status === 'accepted' ? 'Confirmado' : 'Pendiente'}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] uppercase font-black text-muted-foreground">
                                            {req.trips?.from_loc} <span className="lowercase">a</span> {req.trips?.to_loc} • {req.trips?.time}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {req.status === 'pending' ? (
                                        <>
                                            <Button size="sm" onClick={() => handleAcceptRequest(req.id)} className="flex-1 font-black text-xs uppercase tracking-wider bg-green-600 hover:bg-green-700 text-white">
                                                Aceptar
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req.id)} className="flex-1 font-black text-xs uppercase tracking-wider text-destructive border-destructive/30 hover:bg-destructive/10">
                                                Rechazar
                                            </Button>
                                        </>
                                    ) : (
                                        req.passenger_profile?.phone && (
                                            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs" onClick={() => window.open(`https://wa.me/${req.passenger_profile?.phone}?text=Hola ${req.passenger_name}, soy tu conductor de Halador.`, '_blank')}>
                                                Contactar WhatsApp
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {!showForm ? (
                <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Navigation className="h-20 w-20" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-black italic">¿A dónde vamos hoy?</CardTitle>
                        <CardDescription className="text-primary-foreground/70 font-medium italic">Publica un nuevo viaje en segundos</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {/* Publicar Viaje Button */}
                        {!showForm && (
                            <Button
                                className="w-full h-14 text-lg font-black italic tracking-widest shadow-xl bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02] transition-transform"
                                onClick={handlePublishClick}
                            >
                                <Plus className="mr-2 h-6 w-6" /> PUBLICAR VIAJE
                            </Button>
                        )}        </CardContent>
                </Card>
            ) : (
                <Card className="border-2 border-primary shadow-2xl animate-in zoom-in-95 duration-200">
                    <CardHeader>
                        <CardTitle className="italic font-black">NUEVO VIAJE</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateTrip} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Origen</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.from}
                                        onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                                        required
                                    >
                                        <option value="">Ciudad...</option>
                                        {PERU_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Destino</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.to}
                                        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                                        required
                                    >
                                        <option value="">Ciudad...</option>
                                        {PERU_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha</label>
                                    <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hora</label>
                                    <Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Precio (S/)</label>
                                    <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asientos</label>
                                    <Input type="number" min="1" max="10" value={formData.seats} onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) })} required />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Comodidades (Vibes)</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'ac', label: 'A/C', icon: Wind },
                                        { id: 'music', label: 'Música', icon: Music },
                                        { id: 'trunk', label: 'Maletera', icon: Package },
                                        { id: 'pet', label: 'Mascotas OK', icon: Dog },
                                        { id: 'smoke_free', label: 'No Fumar', icon: CigaretteOff },
                                    ].map(feat => {
                                        const isSelected = formData.features.includes(feat.id)
                                        const Icon = feat.icon
                                        return (
                                            <button
                                                key={feat.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    features: prev.features.includes(feat.id)
                                                        ? prev.features.filter(f => f !== feat.id)
                                                        : [...prev.features, feat.id]
                                                }))}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-bold transition-all ${isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                                    : 'bg-background hover:bg-muted text-muted-foreground'
                                                    }`}
                                            >
                                                <Icon className="h-3 w-3" /> {feat.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1 font-bold h-12" onClick={() => setShowForm(false)} disabled={isSubmitting}>Cancelar</Button>
                                <Button type="submit" className="flex-1 font-black italic h-12" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LANZAR RUTA'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <section className="space-y-4 pt-4">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 flex justify-between items-center">
                    Tus Viajes en Curso
                    {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                </h2>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <Card key={i} className="shadow-md border-none bg-card">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Skeleton className="h-4 w-16 rounded-full" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <Skeleton className="h-6 w-40" />
                                        </div>
                                        <div className="space-y-2 flex flex-col items-end">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-3 w-12" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : trips.length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/20">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <MapPin className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-tighter">Todavía no has publicado viajes</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {trips.map(trip => (
                            <Card key={trip.id} className="shadow-md border-none bg-card hover:shadow-lg transition-all group overflow-hidden">
                                <CardContent className="p-4 relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant={trip.status === 'open' ? 'default' : 'secondary'} className="rounded-full px-2 py-0 text-[10px] uppercase font-black">
                                                    {trip.status === 'open' ? 'Abierto' : trip.status}
                                                </Badge>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase">{trip.date} • {trip.time}</span>
                                            </div>
                                            <h3 className="text-lg font-black italic uppercase italic tracking-tighter">
                                                {trip.from_loc} <span className="text-muted-foreground not-italic mx-1">→</span> {trip.to_loc}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black italic text-primary leading-tight">S/ {trip.price}</p>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground justify-end">
                                                <Users className="h-3 w-3" /> {trip.seats_available}/{trip.seats_total}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute right-2 bottom-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {(trip.status === 'open' || trip.status === 'full') && (
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                                                title="Finalizar Viaje"
                                                onClick={async () => {
                                                    if (!confirm('¿Marcar viaje como finalizado? Esto permitirá a los pasajeros dejar reseñas.')) return
                                                    const { error } = await supabase.from('trips').update({ status: 'completed' }).eq('id', trip.id)
                                                    if (error) toast.error(error.message)
                                                    else {
                                                        toast.success('Viaje finalizado')
                                                        mutateTrips()
                                                    }
                                                }}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            size="icon"
                                            className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 text-white"
                                            title="Compartir en WhatsApp"
                                            onClick={() => {
                                                const text = `¡Hola! Viajo de ${trip.from_loc} a ${trip.to_loc} el ${trip.date} a las ${trip.time}. Precio: S/ ${trip.price}. Reserva aquí: https://halador.app`
                                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                                            }}
                                        >
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => handleDeleteTrip(trip.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
            {/* PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <Card className="w-full max-w-sm border-none shadow-2xl bg-white dark:bg-zinc-900">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-indigo-600">
                                SUSCRIPCIÓN HALADOR
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="text-center space-y-2">
                                <p className="text-sm font-bold text-muted-foreground">Para publicar viajes, necesitas una suscripción activa.</p>
                                <div className="py-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900">
                                    <p className="text-3xl font-black text-indigo-600">S/ 15.00</p>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Mensual</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="flex-1 p-3 bg-purple-600 rounded-xl text-white text-center">
                                        <p className="font-black italic">YAPE</p>
                                        <p className="text-xs font-bold mt-1">999-999-999</p>
                                    </div>
                                    <div className="flex-1 p-3 bg-cyan-500 rounded-xl text-white text-center">
                                        <p className="font-black italic">PLIN</p>
                                        <p className="text-xs font-bold mt-1">999-999-999</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-center text-muted-foreground font-medium px-4">
                                    Realiza el pago y haz clic en confirmar. Activaremos tu cuenta en breve.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={handleConfirmPayment}
                                    disabled={isSubmitting || profile?.subscription_status === 'pending'}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                        profile?.subscription_status === 'pending' ? 'ESPERANDO VALIDACIÓN' : 'YA REALICÉ EL PAGO'}
                                </Button>
                                <Button variant="ghost" className="w-full font-bold text-xs" onClick={() => setShowPaymentModal(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
