-- El problema que persiste con 406 Not Acceptable es en gran parte
-- culpa del Frontend al interactuar con una tabla que tiene IDs tipo TEXT,
-- y Supabase JS que lo fuerza a ser compatible solo si los tipos coinciden perfectamente,
-- o también a que PostgREST falla al hacer cast implícitos en consultas de selección.

-- SOLUCIÓN DEFINITIVA PARA LA BASE DE DATOS:
-- Vamos a cambiar la columna id de public.users a UUID.
-- Esto eliminará de raíz cualquier error de compatibilidad entre auth.users y public.users.

-- 1. Primero, cambiamos el tipo de la columna "id" a UUID
-- (Esto asume que los registros actuales tienen formato UUID válido)
ALTER TABLE public.users 
  ALTER COLUMN id SET DATA TYPE UUID USING (id::uuid);

-- 2. Asegurarnos que el nuevo trigger no haga conversiones innecesarias de tipo
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role, "isActive")
  values (
    new.id, -- Pasamos el UUID tal cual
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'USER'),
    true
  );
  return new;
exception
  when others then
    raise log 'Error en handle_new_user: %', SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- 3. Limpiar cualquier usuario huérfano roto que se haya creado
-- en el intento anterior
-- Si pudiste crear el admin en auth.users, pero NO se guardó en public.users
-- o se guardó mal, debes eliminarlo de Authentication en Supabase y volver a crearlo.
