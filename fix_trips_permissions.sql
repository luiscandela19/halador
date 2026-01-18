BEGIN;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers insert trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers update own trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers delete own trips" ON public.trips;

CREATE POLICY "Public read trips" ON public.trips FOR SELECT USING (true);

CREATE POLICY "Drivers insert trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers update own trips" ON public.trips FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Drivers delete own trips" ON public.trips FOR DELETE USING (auth.uid() = driver_id);

COMMIT;
