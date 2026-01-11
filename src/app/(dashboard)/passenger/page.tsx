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

export default function PassengerDashboard() {
    const { user, profile } = useAuth()
    const supabase = createClient()

    const [trips, setTrips] = useState<Trip[]>([])
    const [myRequests, setMyRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedCity, setSelectedCity] = useState<string>('')

    useEffect(() => {
        fetchTrips()
        fetchMyRequests()
    }, [])

    const fetchMyRequests = async () => {
        if (!user) return
        // Fetch requests I made, including trip details and driver phone
        const { data, error } = await supabase
            .from('trip_requests')
            .select(`
                *,
                trips (
                    *,
                    driver_profile:driver_id (
                        phone,
                        full_name
                    )
                )
            `)
            .eq('passenger_id', user.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setMyRequests(data)
        }
    }
    // Realtime Subscription
    useEffect(() => {
        // This useEffect is specifically for the realtime subscription.
        // Initial fetch is handled by the useEffect above.
        // We re-fetch trips on any change to ensure the list is up-to-date.
        // We also re-fetch requests as their status might change.
        const channel = supabase
            .channel('passenger_dashboard')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'trips'
                },
                (payload) => {
                    // Refresh completely to handle filtering/sorting correctly
                    console.log('Realtime change detected:', payload)
                    fetchTrips()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'trip_requests',
                    filter: `passenger_id=eq.${user?.id}`
                },
                () => {
                    fetchMyRequests()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedCity]) // Re-subscribe if filters change? No, fetchTrips handles filters. But we put it here to mount once. 
    // Actually, simple fetchTrips() inside the callback will read the *current* state of selectedCity if we use a ref or just rely on closure (careful with closure stale state).
    // Better strategy: Just re-fetch.


    const fetchTrips = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('trips')
                .select('*')
                .eq('status', 'open')
                .order('date', { ascending: true })

            if (selectedCity) {
                query = query.eq('from_loc', selectedCity)
            }

            const { data, error } = await query

            if (error) throw error
            setTrips(data || [])
        } catch (error: any) {
            toast.error('Error al cargar viajes: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

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
        } catch (error: any) {
            toast.error('Error: ' + (error.message || 'Desconocido'))
        }
    }

    useEffect(() => {
        fetchTrips()
    }, [selectedCity])

    const filteredTrips = trips.filter(t =>
        t.from_loc.toLowerCase().includes(search.toLowerCase()) ||
        t.to_loc.toLowerCase().includes(search.toLowerCase())
    )

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
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Mis Solicitudes
                    </h2>
                    {myRequests.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic pl-1">No tienes viajes activos.</p>
                    ) : (
                        <div className="space-y-2">
                            {myRequests.map(req => {
                                const trip = req.trips
                                return (
                                    <Card key={req.id} className="border-l-4 border-l-primary shadow-sm">
                                        <CardContent className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-black italic uppercase text-sm">
                                                    {trip?.from_loc} <span className="text-muted-foreground">→</span> {trip?.to_loc}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant={req.status === 'accepted' ? 'default' : 'secondary'} className="text-[10px] uppercase font-black">
                                                        {req.status === 'accepted' ? 'Aceptado' : 'Pendiente'}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{trip?.date} {trip?.time}</span>
                                                </div>
                                            </div>

                                            {req.status === 'accepted' && trip?.driver_profile?.phone && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px]" onClick={() => window.open(`https://wa.me/${trip.driver_profile.phone}?text=Hola, soy ${profile?.full_name}, voy contigo a ${trip.to_loc}!`, '_blank')}>
                                                    WhatsApp
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
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
                            {filteredTrips.map(trip => (
                                <Card key={trip.id} className="shadow-lg border-none bg-card hover:translate-y-[-2px] transition-all cursor-pointer overflow-hidden border-l-4 border-l-primary">
                                    <CardContent className="p-0">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter py-0 rounded-full">
                                                            ASIENTOS: {trip.seats_available}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-2.5 w-2.5" /> {trip.date}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                                            <span className="text-sm font-black uppercase tracking-tight">{trip.from_loc}</span>
                                                        </div>
                                                        <div className="w-0.5 h-3 bg-muted-foreground/20 ml-[3px] my-0.5" />
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full border-2 border-primary" />
                                                            <span className="text-sm font-black uppercase tracking-tight">{trip.to_loc}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black italic text-primary leading-none">S/ {trip.price}</p>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{trip.time}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-muted">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary">
                                                        {trip.passengers?.length || 0}
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Pasajeros unidos</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="rounded-full px-4 font-black italic text-[10px] tracking-widest"
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
        </div>
    )
}
