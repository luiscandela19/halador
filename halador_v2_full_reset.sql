-- HALADOR V2 - FULL RESET & SCHEMA DEFINITION
-- CAUTION: This will WIPE ALL DATA and recreate the structure from scratch.

BEGIN;

--------------------------------------------------------------------------------
-- 0. CLEANUP (Drop existing objects)
--------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.trip_requests CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.approve_trip_request CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_review CASCADE;

--------------------------------------------------------------------------------
-- 1. PROFILES
--------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('passenger', 'driver', 'admin')) DEFAULT 'passenger',
  phone TEXT,
  
  -- Verification & Trust
  is_verified BOOLEAN DEFAULT FALSE,
  payment_verified BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'pending', 'active')),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Car Details (Drivers)
  car_brand TEXT,
  car_model TEXT,
  car_color TEXT,
  car_plate TEXT,
  
  -- Reputation
  rating_average NUMERIC(3, 2) DEFAULT 5.00,
  rating_count INTEGER DEFAULT 0,
  trips_completed INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 2. TRIPS
--------------------------------------------------------------------------------
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_loc TEXT NOT NULL,
  to_loc TEXT NOT NULL,
  date TEXT NOT NULL, 
  time TEXT NOT NULL, 
  price NUMERIC NOT NULL DEFAULT 0,
  seats_total INTEGER NOT NULL DEFAULT 4,
  seats_available INTEGER NOT NULL DEFAULT 4,
  passengers JSONB DEFAULT '[]'::jsonB,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled', 'completed')),
  driver_lat TEXT,
  driver_lng TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 3. TRIP REQUESTS (With Realtime Optimization)
--------------------------------------------------------------------------------
CREATE TABLE public.trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Key for RLS/Realtime
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  pickup_lat TEXT,
  pickup_lng TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 4. REVIEWS
--------------------------------------------------------------------------------
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Can be driver or passenger
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 5. RPC FUNCTIONS
--------------------------------------------------------------------------------
-- Function to Approve Trip Request safely
CREATE OR REPLACE FUNCTION approve_trip_request(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_id UUID;
  v_seats_available INT;
  v_passenger_id UUID;
  v_passenger_name TEXT;
  v_request_status TEXT;
BEGIN
  -- 1. Lock request
  SELECT trip_id, passenger_id, passenger_name, status
  INTO v_trip_id, v_passenger_id, v_passenger_name, v_request_status
  FROM public.trip_requests
  WHERE id = request_id
  FOR UPDATE;

  IF v_request_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitud no encontrada');
  END IF;

  IF v_request_status = 'accepted' THEN
     RETURN jsonb_build_object('success', false, 'error', 'Ya fue aceptada');
  END IF;

  -- 2. Lock trip and check seats
  SELECT seats_available
  INTO v_seats_available
  FROM public.trips
  WHERE id = v_trip_id
  FOR UPDATE;

  IF v_seats_available < 1 THEN
     RETURN jsonb_build_object('success', false, 'error', 'Sin asientos disponibles');
  END IF;

  -- 3. Update Request
  UPDATE public.trip_requests
  SET status = 'accepted'
  WHERE id = request_id;

  -- 4. Update Trip (Decrement seats, append passenger)
  UPDATE public.trips
  SET 
    seats_available = seats_available - 1,
    passengers = passengers || jsonb_build_object('id', v_passenger_id, 'name', v_passenger_name),
    status = CASE WHEN (seats_available - 1) = 0 THEN 'full' ELSE status END
  WHERE id = v_trip_id;

  -- 5. Increment trips_completed for driver? (Optional, maybe on finish)
  
  RETURN jsonb_build_object('success', true);
END;
$$;

--------------------------------------------------------------------------------
-- 6. TRIGGERS
--------------------------------------------------------------------------------
-- New User -> Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', COALESCE(new.raw_user_meta_data->>'role', 'passenger'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- New Review -> Update Rating
CREATE OR REPLACE FUNCTION public.handle_new_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        rating_count = rating_count + 1,
        rating_average = (rating_average * rating_count + new.rating) / (rating_count + 1)
    WHERE id = new.reviewee_id; -- Update the person being reviewed
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_new_review();

--------------------------------------------------------------------------------
-- 7. REALTIME
--------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

--------------------------------------------------------------------------------
-- 8. RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Self update profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trips
CREATE POLICY "Public trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Drivers insert trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers update own trips" ON public.trips FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Drivers delete own trips" ON public.trips FOR DELETE USING (auth.uid() = driver_id);

-- Requests
CREATE POLICY "Drivers view requests" ON public.trip_requests FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Passengers view own requests" ON public.trip_requests FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "Passengers insert requests" ON public.trip_requests FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Drivers update status" ON public.trip_requests FOR UPDATE USING (auth.uid() = driver_id);

-- Reviews
CREATE POLICY "Public reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

COMMIT;
