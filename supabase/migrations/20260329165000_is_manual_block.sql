-- 1. Add is_manual boolean column to clearly identify manual/maintenance blocks
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false;

-- 2. Make user_id nullable if not already (safekeeping)
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- 3. Update the RPC function to prioritize the is_manual flag
CREATE OR REPLACE FUNCTION public.get_house_availability(p_house_id uuid)
RETURNS TABLE(start_date date, end_date date, status text, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.start_date, b.end_date, b.status::text,
    CASE
      WHEN b.is_manual = true THEN 'Kapalı'
      WHEN b.user_id IS NULL THEN 'Kapalı'
      WHEN b.user_id = '00000000-0000-0000-0000-000000000000' THEN 'Kapalı'
      ELSE COALESCE(p.display_name, 'Misafir')
    END AS display_name
  FROM public.bookings b
  LEFT JOIN public.profiles p ON p.user_id = b.user_id
  WHERE b.house_id = p_house_id
    AND b.status IN ('confirmed', 'pending');
$$;
