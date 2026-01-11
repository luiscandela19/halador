'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RealtimeManager() {
    const { user, profile } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (!user || !profile) return

        // Global listeners
        const channel = supabase
            .channel('global_user_updates')

        // If Driver, listen for new requests globally to show toast
        if (profile.role === 'driver') {
            channel.on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trip_requests',
                    filter: `driver_id=eq.${user.id}`
                },
                (payload) => {
                    toast.success(`¡Nueva solicitud de viaje de ${payload.new.passenger_name}!`, {
                        action: {
                            label: 'Ver',
                            onClick: () => router.push('/driver')
                        }
                    })
                    // Also play a sound?
                }
            )
        }

        // If Passenger, listen for request acceptance
        if (profile.role === 'passenger') {
            channel.on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'trip_requests',
                    filter: `passenger_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.new.status === 'accepted') {
                        toast.success('¡Tu conductor aceptó el viaje! 🎉', {
                            action: {
                                label: 'Ver',
                                onClick: () => router.push('/passenger')
                            }
                        })
                    } else if (payload.new.status === 'rejected') {
                        toast.error('Lo sentimos, tu solicitud fue rechazada.')
                    }
                }
            )
        }

        channel.subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, profile, router])

    return null
}
