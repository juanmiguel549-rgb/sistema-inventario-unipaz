-- Si el error 406 Not Acceptable persiste a pesar de que el ID ahora es UUID,
-- la causa más probable es que Row Level Security (RLS) esté habilitado
-- en la tabla "users" y esté bloqueando la lectura, lo cual hace que
-- PostgREST rechace la cabecera "Accept: application/vnd.pgrst.object+json"
-- que Supabase JS envía cuando usas ".single()". Cuando RLS bloquea la fila, 
-- ".single()" recibe 0 resultados en lugar de 1, y PostgREST devuelve 406 en lugar de 404.

-- SOLUCIÓN:
-- Vamos a verificar y deshabilitar temporalmente las políticas RLS
-- en la tabla "users" para confirmar si este es el problema.

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Nota: Solo deshabilita esto para probar. Si esto arregla el login, 
-- significa que necesitas configurar políticas RLS correctas. 
-- Generalmente algo como:
-- CREATE POLICY "Permitir lectura a usuarios autenticados" 
-- ON public.users FOR SELECT USING (auth.role() = 'authenticated');
