-- 1. Añadir columna email a la tabla pública (si no existe) y hacer que sea el nuevo identificador
-- Asumiendo que username dejará de usarse o será opcional.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Actualizar la estructura para soportar auth de supabase
-- El ID de auth.users es de tipo UUID, así que necesitamos que nuestra tabla public.users pueda relacionarse.
-- Lo ideal es que el 'id' de public.users sea el mismo UUID que auth.users.id
-- Como ya hay datos, lo mejor es crear una relación o recrear la tabla (esto último es más limpio para la migración).

-- En este script, crearemos un trigger para que cuando se cree un usuario en auth.users,
-- automáticamente se cree su perfil en public.users.

-- Crear la función del trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, email, name, role, "isActive")
  values (
    new.id, 
    -- Si raw_user_meta_data tiene username, lo usamos, si no, nulo
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    -- Intentamos obtener el nombre de los metadatos o usamos el correo inicial
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    -- Asignamos ADMIN si lo pasamos por metadatos, sino USER (o el rol por defecto de tu sistema)
    coalesce(new.raw_user_meta_data->>'role', 'USER'),
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Crear el trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- IMPORTANTE: Migración de datos existentes
-- Como la tabla public.users actual tiene IDs de texto ('id' default uuid_generate_v4() tal vez) 
-- y contraseñas en texto plano, los usuarios existentes NO se podrán loguear en auth.users (Supabase)
-- tendríamos que recrearlos a través de Supabase Auth o que el administrador los re-cree.
