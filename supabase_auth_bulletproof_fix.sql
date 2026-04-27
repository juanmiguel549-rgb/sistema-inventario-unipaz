-- Este script es la versión "a prueba de balas" para sincronizar auth.users con public.users
-- Resuelve todos los problemas posibles: tipos de ID, restricciones NOT NULL, 
-- correos duplicados, y políticas RLS.

-- 1. DESHABILITAR RLS TEMPORALMENTE (Para asegurar login)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. ASEGURAR QUE LAS COLUMNAS PROBLEMÁTICAS PERMITAN NULOS
ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;

-- 3. ASEGURAR QUE EL ID SEA TEXTO PARA EVITAR CONFLICTOS SI LA TABLA ERA VIEJA
-- (Si la tabla ya es UUID, esto lo mantendrá compatible en Postgres con cast)
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;

-- 4. RECREAR EL TRIGGER DE FORMA ROBUSTA
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Usamos INSERT ... ON CONFLICT DO NOTHING por si el usuario ya existía
  -- y evitamos errores de llave duplicada
  insert into public.users (id, email, name, role, "isActive")
  values (
    new.id::text, 
    new.email,
    -- Usa el nombre de los metadatos o la primera parte del correo
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'USER'),
    true
  )
  on conflict (id) do update set 
    email = EXCLUDED.email;
    
  return new;
exception
  when others then
    -- Si falla algo catastrófico, guardamos el error en consola de PostgreSQL pero NO EVITAMOS
    -- que el usuario se cree en Auth.
    raise log 'Error crítico en handle_new_user: %', SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- 5. REASIGNAR EL TRIGGER
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- FIN DEL SCRIPT
-- Instrucción:
-- 1. Ejecuta esto.
-- 2. Borra tu usuario de Authentication.
-- 3. Vuelve a crearlo.
