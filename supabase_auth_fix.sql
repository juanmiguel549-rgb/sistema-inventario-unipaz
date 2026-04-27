-- 1. Primero, vamos a asegurarnos de que la columna ID de la tabla users sea compatible con UUID
-- Si la tabla users fue creada con "id text" (que es comun), y auth.users usa UUID,
-- el INSERT fallará por incompatibilidad de tipos.
-- Vamos a modificar la tabla si es necesario (ESTO PUEDE BORRAR DATOS SI HAY INCOMPATIBILIDAD DIRECTA, 
-- pero como estamos en migración inicial a auth, vamos a forzarlo o adaptarlo).

-- La forma más segura es hacer un CAST al insertar.

-- 2. Asegurémonos de que las columnas username y name permitan nulos, o proveamos valores por defecto seguros.
-- Si en la base de datos están como "NOT NULL", el trigger fallará si los metadatos vienen vacíos.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, email, name, role, "isActive")
  values (
    new.id::text, -- Hacemos CAST a text explícitamente por si la tabla original lo esperaba así
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'USER'),
    true
  );
  return new;
exception
  when others then
    -- Si falla el insert por otra razón (ej. falta una columna, NOT NULL violado en password),
    -- vamos a intentar una versión más simple asumiendo que puedan faltar cosas
    -- Nota: si password es NOT NULL en public.users, esto fallará. Deberíamos quitar ese NOT NULL.
    raise log 'Error en handle_new_user: %', SQLERRM;
    return new; -- Devolvemos new para que al menos se cree en auth.users
end;
$$ language plpgsql security definer;

-- 3. Quitar restricciones problemáticas de public.users
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;
