-- FIX PERMISSIONS FOR ADMIN PANEL AND PAYMENTS

BEGIN;

-- 1. Helper Function to safely check Admin Role (Security Definer avoids RLS infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable RLS on profiles (Safety First)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop restrictive policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Read access for everyone" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow Read Access" ON public.profiles;
DROP POLICY IF EXISTS "Allow Insert Own" ON public.profiles;
DROP POLICY IF EXISTS "Allow Update Own" ON public.profiles;
DROP POLICY IF EXISTS "Allow Admin Update All" ON public.profiles;

-- 4. CREATE NEW ROBUST POLICIES

-- A) READ: Allow EVERYONE to read profiles (Simplest for social app + admin)
CREATE POLICY "Allow Read Access" ON public.profiles FOR SELECT USING (true);

-- B) INSERT: Allow users to create their own profile during registration
CREATE POLICY "Allow Insert Own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- C) UPDATE: 
--    Allow users to update their own profile
CREATE POLICY "Allow Update Own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

--    Allow ADMINS to update ANY profile (Crucial for Approvals)
CREATE POLICY "Allow Admin Update All" ON public.profiles FOR UPDATE USING (
    public.is_admin()
);

COMMIT;
