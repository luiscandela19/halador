-- FORCE GOD MODE
-- Promotes the most recently created user to Admin and Driver with Active Subscription.

BEGIN;

UPDATE public.profiles
SET 
    role = 'driver',
    is_admin = true,
    subscription_status = 'active',
    full_name = 'Super Conductor' -- Optional: Mark to verify change
WHERE id = (
    -- Target the most recent user in the auth system
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
);

COMMIT;
