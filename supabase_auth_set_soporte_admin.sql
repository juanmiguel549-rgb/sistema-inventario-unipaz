-- Script para establecer a soporte como el administrador principal
-- y quitarle los permisos al correo admin por defecto.

-- 1. Darle rol de ADMIN a soporte
UPDATE public.users 
SET role = 'ADMIN' 
WHERE email = 'soporte@unipaz.edu.mx';

-- 2. Quitarle el rol de ADMIN al antiguo correo (o eliminarlo)
-- Lo pasamos a rol "USER" normal para que pierda privilegios vip
UPDATE public.users 
SET role = 'USER' 
WHERE email = 'admin@unipaz.edu.co';

-- Opcional: Si quieres borrar definitivamente al admin@unipaz de tu tabla pública
-- descomenta la siguiente línea quitando los guiones:
-- DELETE FROM public.users WHERE email = 'admin@unipaz.edu.co';
