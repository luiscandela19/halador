-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive', -- 'inactive', 'pending', 'active'
ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz DEFAULT null;

-- Optional: Add a comment
COMMENT ON COLUMN public.profiles.subscription_status IS 'Status of driver subscription: inactive, pending (waiting admin), active';
