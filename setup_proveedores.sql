-- 1. Crear tabla de Proveedores
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfc TEXT NOT NULL,
    social_reason TEXT NOT NULL,
    address TEXT,
    postal_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS en Proveedores
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Seguridad
CREATE POLICY "Enable read access for all users" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.providers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.providers FOR DELETE USING (true);

-- 4. Agregar la columna de proveedor a la tabla Invoices (Facturas)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL;
