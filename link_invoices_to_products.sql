-- Este script agrega la columna de product_id a la tabla invoices para vincular facturas directamente a equipos.

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
