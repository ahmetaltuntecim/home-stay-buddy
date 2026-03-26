ALTER TABLE public.houses
  ADD COLUMN IF NOT EXISTS private_description text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;