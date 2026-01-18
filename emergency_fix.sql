-- EMERGENCY FIX: RESTORE ACCESS
-- This script relaxes security slightly to restore functionality issues caused by strict RLS.

BEGIN;

-- 1. Profiles: Ensure everyone can read profiles (needed for login/auth)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow Read Access" ON public.profiles;
DROP POLICY IF EXISTS "Allow Insert Own" ON public.profiles;
DROP POLICY IF EXISTS "Allow Update Own" ON public.profiles;

-- Create broad read policy
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
-- Create self-management policies
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 2. Trips: Restore ability to create trips (Basic Check)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers insert trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers insert trips strict" ON public.trips;
DROP POLICY IF EXISTS "Drivers update own trips" ON public.trips;
DROP POLICY IF EXISTS "Public read trips" ON public.trips;

-- Create standard policies
CREATE POLICY "Public read trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Drivers insert trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers update own trips" ON public.trips FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Drivers delete own trips" ON public.trips FOR DELETE USING (auth.uid() = driver_id);

COMMIT;
