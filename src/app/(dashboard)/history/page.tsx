'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquare, MapPin, Calendar, Clock, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function HistoryPage() {
    const { user, profile } = useAuth()
    const supabase = createClient()

    const [trips, setTrips] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Review State
    const [reviewingTrip, setReviewingTrip] = useState<string | null>(null)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)

    useEffect(() => {
        if (!user || !profile) return
        fetchHistory()
    }, [user, profile])

    const fetchHistory = async () => {
        if (!profile) return
        setLoading(true)

        try {
            if (profile.role === 'driver') {
                // Fetch completed trips as driver
                const { data, error } = await supabase
                    .from('trips')
                    .select('*, passengers_count:trip_requests(count)')
                    .eq('driver_id', profile.id)
                    .eq('status', 'completed')
                    .order('date', { ascending: false })

                if (error) throw error
                setTrips(data || [])
            } else {
                // Fetch completed trips as passenger
                // We need to verify if we have already reviewed them
                const { data, error } = await supabase
                    .from('trip_requests')
                    .select(`
                        *,
                        trips!inner (
                            *,
                            driver_profile:driver_id (
                                id,
                                full_name,
                                avatar_url
                            )
                        )
                    `)
                    .eq('passenger_id', profile.id)
                    .eq('status', 'accepted')
                    .eq('trips.status', 'completed')
                // .order('created_at', { ascending: false }) // Ambiguous if not specific, assume created_at of request

                if (error) throw error

                // Now check for existing reviews
                // Alternatively, we could do a left join on reviews but it's complex with Supabase syntax on same table refs
                // Let's just fetch my reviews
                const { data: myReviews } = await supabase
                    .from('reviews')
                    .select('trip_id')
                    .eq('reviewer_id', profile.id)

                const reviewedTripIds = new Set(myReviews?.map(r => r.trip_id))

                const formattedTrips = data?.map(req => ({
                    ...req.trips,
                    request_id: req.id,
                    has_reviewed: reviewedTripIds.has(req.trips.id)
                }))

                setTrips(formattedTrips || [])
            }
        } catch (error: any) {
            toast.error('Error al cargar historial: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitReview = async (tripId: string, driverId: string) => {
        if (!user) return
        setSubmittingReview(true)
        try {
            const { error } = await supabase.from('reviews').insert({
                trip_id: tripId,
                reviewer_id: user.id,
                reviewee_id: driverId,
                rating,
                comment
            })

            if (error) throw error

            toast.success('¡Gracias por tu calificación!')
            setReviewingTrip(null)
            setComment('')
            setRating(5)
            fetchHistory() // Refresh to update "has_reviewed"
        } catch (error: any) {
            toast.error('Error: ' + error.message)
        } finally {
            setSubmittingReview(false)
        }
    }

    return (
        <div className="flex flex-col space-y-6 p-4 pb-20">
            <header className="py-4 border-b">
                <h1 className="text-2xl font-black italic tracking-tighter">HISTORIAL</h1>
                <p className="text-muted-foreground text-sm font-medium">
                    {profile?.role === 'driver' ? 'Tus rutas completadas' : 'Tus viajes realizados'}
                </p>
            </header>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border-none shadow-md">
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-12 w-full mb-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : trips.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <History className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-tighter">
                            No tienes viajes completados
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {trips.map(trip => (
                        <Card key={trip.id} className="shadow-md border-none bg-card overflow-hidden group">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-black bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                Completado
                                            </Badge>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">{trip.date} • {trip.time}</span>
                                        </div>
                                        <h3 className="text-lg font-black italic uppercase italic tracking-tighter">
                                            {trip.from_loc} <span className="text-muted-foreground not-italic mx-1">→</span> {trip.to_loc}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black italic text-primary leading-tight">S/ {trip.price}</p>
                                    </div>
                                </div>

                                {profile?.role === 'passenger' && (
                                    <div className="mt-4 pt-4 border-t border-muted/50">
                                        {trip.has_reviewed ? (
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="text-xs font-black uppercase tracking-wide">Ya calificaste este viaje</span>
                                            </div>
                                        ) : reviewingTrip === trip.id ? (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 bg-muted/30 p-3 rounded-xl">
                                                <p className="text-xs font-bold uppercase text-center">Califica a {trip.driver_profile?.full_name}</p>
                                                <div className="flex justify-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setRating(star)}
                                                            className={cn("transition-transform hover:scale-110", rating >= star ? "text-yellow-500" : "text-muted-foreground/30")}
                                                        >
                                                            <Star className="h-6 w-6 fill-current" />
                                                        </button>
                                                    ))}
                                                </div>
                                                <Textarea
                                                    placeholder="Comentario (opcional)..."
                                                    value={comment}
                                                    onChange={e => setComment(e.target.value)}
                                                    className="text-xs bg-background"
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => setReviewingTrip(null)}>Cancelar</Button>
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 font-black uppercase text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        onClick={() => handleSubmitReview(trip.id, trip.driver_profile?.id)}
                                                        disabled={submittingReview}
                                                    >
                                                        Enviar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="w-full border-dashed border-2 font-bold text-xs uppercase text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5"
                                                onClick={() => setReviewingTrip(trip.id)}
                                            >
                                                <Star className="h-3 w-3 mr-2" />
                                                Calificar Conductor
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {profile?.role === 'driver' && (
                                    <div className="mt-2 text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        Pasajeros transportados
                                        {/* Note: passengers_count is an array of objects from Supabase count query, need to extract safely if using raw count, but standard select with count returns different structure. 
                                             Let's assume simple rendering or hide for now if complex.
                                         */}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function History({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
            <path d="M3 3v9h9" />
            <path d="M12 7v5l4 2" />
        </svg>
    )
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
