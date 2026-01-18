-- UNLOCK EVERYTHING (DEBUG MODE)
-- Disables Row Level Security on main tables to fix "hanging" and access issues.
-- Use this to verify if the problem is permissions-related.

BEGIN;

-- Disable RLS on core tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_requests DISABLE ROW LEVEL SECURITY;

-- Grant generic permissions (just in case)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.trips TO authenticated;
GRANT ALL ON public.trips TO anon;
GRANT ALL ON public.trip_requests TO authenticated;
GRANT ALL ON public.trip_requests TO anon;

COMMIT;
