-- SECURITY AND UX UPGRADE SCRIPT (SIMPLE VERSION)

BEGIN;

-- 1. Unique Constraint (Si falla porque ya existe, está bien)
ALTER TABLE trip_requests 
ADD CONSTRAINT unique_trip_passenger_request 
UNIQUE (trip_id, passenger_id);

-- 2. Strict RLS for Trip Creation
DROP POLICY IF EXISTS "Drivers insert trips" ON trips;
DROP POLICY IF EXISTS "Drivers insert trips strict" ON trips;

CREATE POLICY "Drivers insert trips strict" 
ON trips 
FOR INSERT 
WITH CHECK (
  auth.uid() = driver_id 
  AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND subscription_status = 'active'
  )
);

COMMIT;
