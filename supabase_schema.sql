-- Create users table
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
  "isActive" BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "inventoryNumber" TEXT UNIQUE,
  name TEXT NOT NULL,
  "serialNumber" TEXT,
  description TEXT,
  condition TEXT,
  type TEXT,
  model TEXT,
  stock INTEGER DEFAULT 1,
  "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create persons table (Personal)
CREATE TABLE public.persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table (Movimientos)
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "productId" UUID REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('IN', 'OUT')) NOT NULL,
  quantity INTEGER DEFAULT 1,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  "assignedTo" TEXT
);

-- Create resguardos table (Resguardos fijos)
CREATE TABLE public.resguardos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "assignedTo" TEXT NOT NULL,
  "assignedEmail" TEXT,
  department TEXT,
  location TEXT,
  "assignmentDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'DEVUELTO')),
  notes TEXT,
  "productIds" JSONB DEFAULT '[]'::jsonb
);

-- Create temporary_equipments table (Préstamos Temporales)
CREATE TABLE public.temporary_equipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "productId" UUID REFERENCES public.products(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('CHECKOUT', 'CHECKIN')),
  quantity INTEGER DEFAULT 1,
  "personName" TEXT NOT NULL,
  "personEmail" TEXT,
  "expectedReturnDate" TIMESTAMP WITH TIME ZONE,
  "actualReturnDate" TIMESTAMP WITH TIME ZONE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),
  notes TEXT
);

-- Create invoices table (Facturas PDF)
CREATE TABLE public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  "uploadDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "fileName" TEXT NOT NULL,
  "fileBase64" TEXT NOT NULL,
  notes TEXT
);

-- Insert initial admin user
INSERT INTO public.users (username, password, name, role) 
VALUES ('admin', '123', 'Administrador UNIPAZ', 'ADMIN');
