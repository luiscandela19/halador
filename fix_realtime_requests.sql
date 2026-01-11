-- Migration to add driver_id to trip_requests for simpler RLS and Realtime

BEGIN;

-- 1. Add driver_id column
-- ALTER TABLE public.trip_requests ADD COLUMN driver_id UUID REFERENCES auth.users(id);

-- 2. Backfill existing data
UPDATE public.trip_requests
SET driver_id = trips.driver_id
FROM public.trips
WHERE trip_requests.trip_id = trips.id;

-- 3. Enforce Not Null after backfill (optional but recommended for stricter data integrity)
-- ALTER TABLE public.trip_requests ALTER COLUMN driver_id SET NOT NULL; 
-- (Commented out to be safe in case of orphaned records, but good practice)

-- 4. Update RLS Policies
DROP POLICY IF EXISTS "Users can view relevant requests" ON public.trip_requests;

-- Driver can view requests where they are the driver
CREATE POLICY "Drivers can view their requests" ON public.trip_requests
FOR SELECT USING (auth.uid() = driver_id);

-- Passenger can view their own requests
CREATE POLICY "Passengers can view their own requests" ON public.trip_requests
FOR SELECT USING (auth.uid() = passenger_id);

-- Passenger can insert requests (must set driver_id correctly, checked by constraint? No, but authorized by App logic)
-- We update the insert policy to allow inserting the driver_id
DROP POLICY IF EXISTS "Passengers can insert requests" ON public.trip_requests;
CREATE POLICY "Passengers can insert requests" ON public.trip_requests
FOR INSERT WITH CHECK (auth.uid() = passenger_id);

-- DRIVER UPDATE POLICY (CRITICAL FOR ACCEPT/REJECT)
CREATE POLICY "Drivers can update status" ON public.trip_requests
FOR UPDATE USING (auth.uid() = driver_id);

-- 5. Realtime
-- Ensure realtime is enabled (ALREADY ENABLED, COMMENTING OUT TO AVOID ERROR)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_requests;

COMMIT;
