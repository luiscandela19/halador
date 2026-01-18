import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripRequest } from '@/types'

const fetcher = async (key: string) => {
    const supabase = createClient()
    const [path, params] = key.split('?')

    // Logic for loading trips
    if (path === '/api/trips') {
        const { data, error } = await supabase
            .from('trips')
            .select(`
                *,
                driver_profile:driver_id (
                    full_name,
                    car_brand,
                    car_model,
                    car_plate,
                    photo_url
                ),
                passengers:trip_requests(count)
            `)
            .eq('status', 'open')
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })

        if (error) throw error

        // Transform count to array-like for compatibility if needed, or update frontend
        // Assuming frontend checks passengers.length. 
        // Supabase count returns [{count: N}]. Let's keep it simple or map it.
        // Easier: Just select trip_requests!inner(id) is heavy.
        // Actually, let's select passengers deeply? No, privacy.
        // Let's just trust seats_available for availability.

        return data as unknown as Trip[]
    }

    // Logic for loading my requests
    if (path === '/api/my-requests') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

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

        if (error) throw error
        return data
    }

    return null
}

export function useTrips() {
    const { data, error, isLoading, mutate } = useSWR('/api/trips', fetcher, {
        refreshInterval: 10000, // Poll every 10s for updates naturally
        revalidateOnFocus: true
    })

    return {
        trips: data || [],
        isLoading,
        isError: error,
        mutate
    }
}

export function useMyRequests() {
    const { data, error, isLoading, mutate } = useSWR('/api/my-requests', fetcher, {
        refreshInterval: 5000,
        revalidateOnFocus: true
    })

    return {
        requests: data || [],
        isLoading,
        isError: error,
        mutate
    }
}

export function useDriverTrips(driverId?: string) {
    const key = driverId ? `/api/driver/trips?id=${driverId}` : null
    const { data, error, isLoading, mutate } = useSWR(key, async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Trip[]
    }, {
        refreshInterval: 10000
    })

    return { trips: data || [], isLoading, isError: error, mutate }
}

export function useDriverRequests(driverId?: string) {
    const key = driverId ? `/api/driver/requests?id=${driverId}` : null
    const { data, error, isLoading, mutate } = useSWR(key, async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('trip_requests')
            .select(`
                *,
                trips!inner(*),
                passenger_profile:passenger_id(phone)
            `)
            .eq('trips.driver_id', driverId)
            .neq('status', 'rejected')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as any[]
    }, {
        refreshInterval: 5000
    })

    return { requests: data || [], isLoading, isError: error, mutate }
}
