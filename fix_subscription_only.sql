-- FIX SUBSCRIPTION SECURITY ONLY
-- Run this to enforce that only active subscribers can create trips.

BEGIN;

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

COMMIT;
