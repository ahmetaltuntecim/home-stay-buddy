
-- 1. Fix bookings SELECT policy: restrict to own bookings only
DROP POLICY "Authenticated users can view bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Create RPC for house availability (no user_id exposed to regular users)
CREATE OR REPLACE FUNCTION public.get_house_availability(p_house_id uuid)
RETURNS TABLE(start_date date, end_date date, status text, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.start_date, b.end_date, b.status::text,
    CASE
      WHEN b.user_id = '00000000-0000-0000-0000-000000000000' THEN 'Kapalı'
      ELSE COALESCE(p.display_name, 'Misafir')
    END AS display_name
  FROM public.bookings b
  LEFT JOIN public.profiles p ON p.user_id = b.user_id
  WHERE b.house_id = p_house_id
    AND b.status IN ('confirmed', 'pending');
$$;

-- 3. Fix houses_public view: use security_invoker instead of security_definer
DROP VIEW IF EXISTS public.houses_public;
CREATE VIEW public.houses_public
WITH (security_invoker = on) AS
  SELECT id, title, description, location, image_url, price, capacity,
         rating, reviews_count, tag, available_from, available_to,
         created_at, updated_at, created_by
  FROM public.houses;

-- 4. Fix profiles INSERT policy: enforce approved = false
DROP POLICY "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id AND approved = false);
