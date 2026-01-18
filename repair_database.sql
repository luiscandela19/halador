-- REPAIR DATABASE SCRIPT
-- Fixes missing columns and tables identified during diagnostics.

BEGIN;

-- 1. Add subscription_status column to PROFILES if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription_status') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
    END IF;
END $$;

-- 2. Create TRIP_REQUESTS table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trip_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES public.profiles(id),
    driver_id UUID REFERENCES public.profiles(id),
    passenger_name TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enables RLS on trip_requests just in case
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- 4. Apply The Strict Security Policy for Drivers
-- This prevents drivers from posting trips unless they have subscription_status = 'active'
DROP POLICY IF EXISTS "Drivers insert trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers insert trips strict" ON public.trips;

CREATE POLICY "Drivers insert trips strict" 
ON public.trips 
FOR INSERT 
WITH CHECK (
  auth.uid() = driver_id 
  AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_status = 'active'
  )
);

-- 5. Allow everyone to read trip requests (filtered by user normally via other policies, but let's ensure base access)
-- Ideally: Passengers see their own, Drivers see theirs.
DROP POLICY IF EXISTS "Users read own requests" ON public.trip_requests;
CREATE POLICY "Users read own requests" ON public.trip_requests
FOR SELECT USING (
    auth.uid() = passenger_id OR auth.uid() = driver_id
);

-- 6. Allow passengers to create requests
DROP POLICY IF EXISTS "Passengers create requests" ON public.trip_requests;
CREATE POLICY "Passengers create requests" ON public.trip_requests
FOR INSERT WITH CHECK (
    auth.uid() = passenger_id
);

-- 7. Allow drivers to update requests (accept/reject)
DROP POLICY IF EXISTS "Drivers update requests" ON public.trip_requests;
CREATE POLICY "Drivers update requests" ON public.trip_requests
FOR UPDATE USING (
    auth.uid() = driver_id
);

COMMIT;
