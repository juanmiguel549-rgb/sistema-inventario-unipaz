-- El error 406 Not Acceptable en Supabase al hacer .eq('id', uuid)
-- ocurre porque la columna "id" de la tabla "users" es de tipo TEXT,
-- pero estamos intentando buscar por un UUID nativo.
-- PostgREST se confunde con los tipos.
--
-- SOLUCIÓN: Cambiar el tipo de la columna "id" en public.users a UUID.
-- Como es la llave primaria (Primary Key) y tal vez esté relacionada
-- con otras tablas (como transactions o resguardos), esto puede ser laborioso.
-- 
-- Alternativamente, dado que ya hicimos un trigger que castea a TEXT:
--   new.id::text
-- El problema real es que en el Frontend estamos haciendo:
--   .eq('id', session.user.id) 
-- y session.user.id es un UUID. Supabase JS envía esto como tipo UUID y 
-- Postgres se queja.
-- No necesitamos SQL para esto, lo arreglamos en el código frontend forzando el tipo o 
-- pasándolo como string correctamente, o mejor aún, migramos el ID a UUID.

-- Pero la forma más limpia y robusta a largo plazo es que la tabla use UUIDs:

ALTER TABLE public.users ALTER COLUMN id SET DATA TYPE UUID USING id::uuid;

-- Nota: Si esto falla porque hay IDs existentes que no son UUID válidos (por ejemplo "admin"),
-- fallará.
-- En ese caso, la solución debe ser en el FRONTEND: cambiar dataService.ts
