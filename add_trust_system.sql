-- 1. EXTEND PROFILES (Car Details & Ratings)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS car_brand TEXT,
ADD COLUMN IF NOT EXISTS car_model TEXT,
ADD COLUMN IF NOT EXISTS car_color TEXT,
ADD COLUMN IF NOT EXISTS car_plate TEXT,
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3, 2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trips_completed INTEGER DEFAULT 0;

-- 2. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS FOR REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews for their completed trips" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

-- 4. FUNCTION TO UPDATE RATINGS
CREATE OR REPLACE FUNCTION public.handle_new_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        rating_count = rating_count + 1,
        rating_average = (rating_average * rating_count + new.rating) / (rating_count + 1)
    WHERE id = new.reviewed_id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_created
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_new_review();
