export interface Profile {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: 'passenger' | 'driver' | 'admin'
    phone: string | null
    is_verified: boolean
    payment_verified: boolean
    subscription_status: 'inactive' | 'pending' | 'active'
    subscription_end_date: string | null
    created_at: string
    // Trust System
    car_brand?: string
    car_model?: string
    car_color?: string
    car_plate?: string
    rating_average?: number
    rating_count?: number
    trips_completed?: number
}

export interface Trip {
    id: string
    driver_id: string
    from_loc: string
    to_loc: string
    date: string
    time: string
    price: number
    seats_total: number
    seats_available: number
    status: 'open' | 'full' | 'cancelled' | 'completed'
    driver_lat?: string | null
    driver_lng?: string | null
    features?: string[] // JSONB
    passengers?: any[] // JSONB from DB
    created_at: string
}

export interface TripRequest {
    id: string
    trip_id: string
    passenger_id: string
    passenger_name: string
    status: 'pending' | 'accepted' | 'rejected'
    pickup_lat?: string | null
    pickup_lng?: string | null
    created_at: string
    trips?: Trip
    passenger_profile?: { phone: string | null }
    driver_profile?: { phone: string | null }
}
