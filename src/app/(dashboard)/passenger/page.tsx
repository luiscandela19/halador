'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Navigation, Loader2, Users, Calendar, Clock, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { PERU_CITIES } from '@/lib/cities'
import { type Trip } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketModal } from '@/components/ticket-modal'
import { ReviewModal } from '@/components/review-modal'
import { Music, Wind, Dog, Package, CigaretteOff, Star } from 'lucide-react'

import { useTrips, useMyRequests } from '@/hooks/use-trips'

export default function PassengerDashboard() {
    const { user, profile } = useAuth()
    const supabase = createClient()

    // SWR Hooks (Instant Cache & Background Update)
    const { trips, isLoading: loadingTrips } = useTrips()
    const { requests: myRequests, isLoading: loadingRequests } = useMyRequests()

    const [search, setSearch] = useState('')
    const [selectedCity, setSelectedCity] = useState<string>('')

    // Ticket State
    const [showTicketModal, setShowTicketModal] = useState(false)
    const [selectedTicketTrip, setSelectedTicketTrip] = useState<any>(null)

    // Review State
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [selectedReviewTrip, setSelectedReviewTrip] = useState<any>(null)

    const loading = loadingTrips || loadingRequests

    const handleRequestSeat = async (tripId: string) => {
        if (!profile) {
            return toast.error('Inicia sesión para reservar')
        }

        try {
            const payload = {
                trip_id: tripId,
                driver_id: trips.find(t => t.id === tripId)?.driver_id, // Get driver_id from the trip object
                passenger_id: profile.id,
                passenger_name: profile.full_name || 'Pasajero',
                status: 'pending'
            }

            const { error } = await supabase
                .from('trip_requests')
                .insert(payload)

            if (error) throw error

            toast.success('¡Solicitud enviada!')
            // Mutate logic is handled by SWR auto-revalidation or we could import mutate from hook
        } catch (error: any) {
            toast.error('Error: ' + (error.message || 'Desconocido'))
        }
    }

    const filteredTrips = trips.filter(t => {
        const matchesSearch = t.from_loc.toLowerCase().includes(search.toLowerCase()) ||
            t.to_loc.toLowerCase().includes(search.toLowerCase())
        const matchesCity = selectedCity ? t.from_loc === selectedCity : true
        return matchesSearch && matchesCity
    })

    return (
        <div className="flex flex-col space-y-6 p-4 pb-20">
            <header className="py-4 border-b">
                <h1 className="text-2xl font-black italic tracking-tighter">HALADOR <span className="text-primary not-italic font-bold text-xs ml-2 border px-2 py-0.5 rounded-full uppercase tracking-tighter">Pasajero</span></h1>
                <p className="text-muted-foreground text-sm font-medium">Busca y únete a un viaje seguro</p>
            </header>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative col-span-2">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar ciudad..."
                            className="pl-10 h-10 rounded-2xl bg-muted/30 border-none shadow-inner"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="col-span-2 flex h-10 w-full rounded-2xl border-none bg-muted/30 px-3 py-2 text-sm font-bold appearance-none"
                        value={selectedCity}
                        onChange={e => setSelectedCity(e.target.value)}
                    >
                        <option value="">Todas las ciudades</option>
                        {PERU_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                </div>

                <section className="space-y-4">
                    {/* REALTIME LISTENER */}
                    <RealtimeRequestUpdater userId={user?.id} onUpdate={() => { /* SWR handles it automatically via useMyRequests hook revalidation if we call mutate globally, but here we let the component re-render */ window.location.reload() }} />

                    {/* LIVE TRIP MODE */}
                    {myRequests.find(r => r.status === 'accepted') ? (
                        <div className="animate-in slide-in-from-top-4 duration-700">
                            {myRequests.filter(r => r.status === 'accepted').map(req => {
                                const trip = req.trips
                                return (
                                    <Card key={req.id} className="border-none shadow-2xl bg-indigo-600 text-white overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-2 animate-pulse">
                                                        <div className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                                                        VIAJE ACTIVO
                                                    </Badge>
                                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase">
                                                        Rumbo a {trip?.to_loc}
                                                    </h3>
                                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">
                                                        Salida: {trip?.time}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                                                        <Navigation className="h-6 w-6 text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DRIVER MINI PROFILE */}
                                            <div className="bg-indigo-900/30 rounded-xl p-4 mb-6 flex items-center gap-4 backdrop-blur-sm">
                                                <div className="h-12 w-12 rounded-full bg-indigo-500 border-2 border-white/20 overflow-hidden">
                                                    {trip?.driver_profile?.photo_url && <img src={trip.driver_profile.photo_url} className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg leading-none">{trip?.driver_profile?.full_name}</p>
                                                    <p className="text-indigo-300 text-xs uppercase font-bold mt-1">
                                                        {trip?.driver_profile?.car_brand} • {trip?.driver_profile?.car_plate}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest border-0 h-12 shadow-lg shadow-red-900/20"
                                                    onClick={() => window.open('tel:105')}
                                                >
                                                    SOS ALERTA
                                                </Button>
                                                <Button
                                                    className="bg-white text-indigo-900 hover:bg-indigo-50 font-black uppercase tracking-widest border-0 h-12 shadow-lg"
                                                    onClick={() => {
                                                        const text = `Voy en un viaje de Halador con ${trip?.driver_profile?.full_name}. Placa: ${trip?.driver_profile?.car_plate}. Ruta: ${trip?.from_loc} - ${trip?.to_loc}.`;
                                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                >
                                                    COMPARTIR
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <>
                            {/* PENDING REQUESTS */}
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 flex items-center gap-2">
                                <Users className="h-4 w-4" /> Mis Solicitudes
                            </h2>
                            {myRequests.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic pl-1">No tienes viajes pendientes.</p>
                            ) : (
                                <div className="space-y-2">
                                    {myRequests.map(req => (
                                        <Card key={req.id} className="border-l-4 border-l-yellow-400 shadow-sm bg-background">
                                            <CardContent className="p-4 flex justify-between items-center">
                                                <div>
                                                    <p className="font-black italic uppercase text-sm">
                                                        {req.trips?.from_loc} <span className="text-muted-foreground">→</span> {req.trips?.to_loc}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-[10px] uppercase font-black bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                                            ESPERANDO CONFIRMACIÓN
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>



                <section className="pt-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Viajes Próximos</h2>
                        {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="shadow-lg border-none bg-card border-l-4 border-l-muted">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-4 w-24" />
                                                </div>
                                            </div>
                                            <div className="space-y-2 flex flex-col items-end">
                                                <Skeleton className="h-8 w-16" />
                                                <Skeleton className="h-3 w-12" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-muted">
                                            <Skeleton className="h-6 w-24" />
                                            <Skeleton className="h-8 w-24 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : filteredTrips.length === 0 ? (
                        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-black">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                <Navigation className="h-10 w-10 mb-4 text-indigo-200 animate-pulse" />
                                <p className="text-xs font-bold uppercase tracking-tighter text-slate-400">No hay viajes disponibles por ahora</p>
                                <Button variant="outline" className="mt-6 rounded-full font-bold px-8" onClick={() => { setSelectedCity(''); setSearch('') }}>Limpiar filtros</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredTrips.map((trip: any) => (
                                <Card key={trip.id} className="shadow-lg border-none bg-card hover:translate-y-[-2px] transition-all cursor-pointer overflow-hidden border-l-4 border-l-primary group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50" />
                                    <CardContent className="p-0">
                                        <div className="p-5">
                                            {/* DRIVER INFO HEADER */}
                                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-100 dark:border-gray-800">
                                                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                                                    {trip.driver_profile?.photo_url ? (
                                                        <img src={trip.driver_profile.photo_url} alt="Driver" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="font-black text-xs text-muted-foreground">{trip.driver_profile?.full_name?.[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-sm truncate">{trip.driver_profile?.full_name || 'Conductor Halador'}</p>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">
                                                        {trip.driver_profile?.car_brand} {trip.driver_profile?.car_model} • {trip.driver_profile?.car_plate || 'SIN PLACA'}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter py-0 rounded-full h-6 flex items-center gap-1 bg-background/50 backdrop-blur">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.9
                                                </Badge>
                                            </div>

                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                                            <span className="text-sm font-black uppercase tracking-tight">{trip.from_loc}</span>
                                                        </div>
                                                        <div className="w-0.5 h-3 bg-muted-foreground/20 ml-[4px] my-0.5" />
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-600" />
                                                            <span className="text-sm font-black uppercase tracking-tight">{trip.to_loc}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black italic text-indigo-600 leading-none">S/ {trip.price}</p>
                                                    <span className="text-[10px] font-bold text-muted-foreground flex items-center justify-end gap-1 mt-1">
                                                        <Clock className="h-3 w-3" /> {trip.time}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* VIBES */}
                                            {trip.features && trip.features.length > 0 && (
                                                <div className="flex gap-2 mb-4 px-1">
                                                    {trip.features.map((feat: string) => {
                                                        const Icon = { ac: Wind, music: Music, trunk: Package, pet: Dog, smoke_free: CigaretteOff }[feat] as any
                                                        if (!Icon) return null
                                                        return (
                                                            <div key={feat} className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" title={feat}>
                                                                <Icon className="h-3 w-3" />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    <span>{trip.seats_available} asientos disp.</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="rounded-full px-5 font-black italic text-[10px] tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                                                    onClick={() => handleRequestSeat(trip.id)}
                                                >
                                                    RESERVAR <ChevronRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {/* TICKET MODAL */}
            <TicketModal
                isOpen={showTicketModal}
                onClose={() => setShowTicketModal(false)}
                trip={selectedTicketTrip}
                passengerName={profile?.full_name || 'Pasajero'}
            />
            {/* REVIEW MODAL */}
            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                trip={selectedReviewTrip}
                reviewerId={user?.id || ''}
            />
        </div>
    )
}

// REALTIME HELPER COMPONENT (Internal)
function RealtimeRequestUpdater({ userId, onUpdate }: { userId?: string, onUpdate: () => void }) {
    useEffect(() => {
        if (!userId) return
        const supabase = createClient()
        const channel = supabase.channel('passenger_requests_fix')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // Listen for Accepted/Rejected
                    schema: 'public',
                    table: 'trip_requests',
                    filter: `passenger_id=eq.${userId}`
                },
                (payload) => {
                    toast.info('¡Estado de viaje actualizado!')
                    onUpdate()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, onUpdate])
    return null
}
