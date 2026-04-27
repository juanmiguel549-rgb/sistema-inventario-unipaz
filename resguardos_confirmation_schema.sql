ALTER TABLE public.resguardos
ADD COLUMN confirmation_status text DEFAULT 'PENDING' CHECK (confirmation_status IN ('PENDING', 'CONFIRMED'));
