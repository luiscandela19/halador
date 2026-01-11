-- HALADOR V2 DEFINITIVE SCHEMA
-- Run this AFTER wipe_database_v2.sql

BEGIN;

-- 1. PROFILES (Extends Auth.Users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('passenger', 'driver', 'admin')) DEFAULT 'passenger',
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  payment_verified BOOLEAN DEFAULT FALSE,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TRIPS
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_loc TEXT NOT NULL,
  to_loc TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  time TEXT NOT NULL, -- HH:MM
  shift TEXT,         -- Mañana, Tarde, Noche
  price NUMERIC NOT NULL DEFAULT 0,
  seats_total INTEGER NOT NULL DEFAULT 4,
  seats_available INTEGER NOT NULL DEFAULT 4,
  passengers JSONB DEFAULT '[]'::jsonB,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled', 'completed')),
  driver_lat TEXT,
  driver_lng TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TRIP REQUESTS
CREATE TABLE public.trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  pickup_lat TEXT,
  pickup_lng TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. REALTIME ENABLEMENT
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_requests;

-- 5. RLS POLICIES (Simplified for Launch)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public trips are viewable by everyone" ON public.trips FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Drivers can insert trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Passengers can insert requests" ON public.trip_requests FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Users can view relevant requests" ON public.trip_requests FOR SELECT USING (
  auth.uid() = passenger_id OR 
  auth.uid() IN (SELECT driver_id FROM public.trips WHERE id = trip_id)
);

-- 6. TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', COALESCE(new.raw_user_meta_data->>'role', 'passenger'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
