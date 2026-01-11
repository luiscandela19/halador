-- POLICY: Allow drivers to delete their own trips
CREATE POLICY "Drivers can delete own trips" 
ON public.trips 
FOR DELETE 
USING (auth.uid() = driver_id);

-- Optional: If you want cascading deletes to work smoothly, ensure no weird constraints block it.
-- (The schema already has ON DELETE CASCADE for foreign keys, so this is fine).
