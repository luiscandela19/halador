-- ⚠️ INSTRUCCIONES:
-- 1. Reemplaza 'tu_correo@gmail.com' con el correo con el que te registraste en la App.
-- 2. Ejecuta este script en Supabase -> SQL Editor -> Run.

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tu_correo@gmail.com'
);

-- Verificación (opcional)
SELECT * FROM public.profiles WHERE role = 'admin';
