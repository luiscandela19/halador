-- UPGRADE SCRIPT: VIBES, REVIEWS & PWA SUPPORT

-- 1. Add 'features' (Vibes) to trips
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonB;

-- 2. Ensure Reviews Table Exists (Safe to run multiple times)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure Profile Stats Columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3, 2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trips_completed INTEGER DEFAULT 0;

-- 4. Enable Realtime for Reviews (for instant updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- 5. RLS for Reviews (If not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public reviews are viewable by everyone'
    ) THEN
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Public reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
        CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
    END IF;
END $$;
