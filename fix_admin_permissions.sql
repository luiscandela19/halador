-- 1. Habilitar Realtime para la tabla Profiles
-- Esto es crucial para que el conductor vea el cambio instantáneamente.
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 2. Permitir que los Administradores actualicen cualquier perfil
-- Esto permite que el botón "Aprobar" realmente guarde los cambios en la BD.
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
