-- 1. Make user_id nullable in bookings table to allow system/manual blocks without a dummy user
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- 2. Update the RPC function to handle NULL user_id for blocked dates
CREATE OR REPLACE FUNCTION public.get_house_availability(p_house_id uuid)
RETURNS TABLE(start_date date, end_date date, status text, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.start_date, b.end_date, b.status::text,
    CASE
      WHEN b.user_id IS NULL THEN 'Kapalı'
      WHEN b.user_id = '00000000-0000-0000-0000-000000000000' THEN 'Kapalı'
      ELSE COALESCE(p.display_name, 'Misafir')
    END AS display_name
  FROM public.bookings b
  LEFT JOIN public.profiles p ON p.user_id = b.user_id
  WHERE b.house_id = p_house_id
    AND b.status IN ('confirmed', 'pending');
$$;
