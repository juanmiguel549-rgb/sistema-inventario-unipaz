-- Run this SQL in your Supabase SQL Editor to create the `areas` table

CREATE TABLE public.areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  locations JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: The locations column will store a JSON array of strings (the specific sub-areas/cubicles)
