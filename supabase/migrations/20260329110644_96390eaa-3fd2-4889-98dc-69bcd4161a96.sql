
-- 1. Create public view for houses excluding sensitive columns (private_description, latitude, longitude)
CREATE VIEW public.houses_public AS
  SELECT id, title, description, location, price, capacity, rating,
         reviews_count, image_url, tag, available_from, available_to,
         created_at, updated_at, created_by
  FROM public.houses;

-- Grant access to the view
GRANT SELECT ON public.houses_public TO anon, authenticated;

-- 2. Drop overly permissive SELECT policy on base table
DROP POLICY IF EXISTS "Houses are viewable by everyone" ON public.houses;

-- 3. Admin/mod can SELECT all columns from base table
CREATE POLICY "Admins and mods can view houses"
  ON public.houses FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'mod'::app_role));

-- 4. Users with confirmed bookings can view house details (for private data)
CREATE POLICY "Users with confirmed bookings can view house"
  ON public.houses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.house_id = houses.id
        AND bookings.user_id = auth.uid()
        AND bookings.status = 'confirmed'::booking_status
    )
  );

-- 5. Create RPC function for private house details
CREATE OR REPLACE FUNCTION public.get_house_private_details(p_house_id uuid)
RETURNS TABLE(private_description text, latitude numeric, longitude numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.private_description, h.latitude, h.longitude
  FROM public.houses h
  WHERE h.id = p_house_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'mod'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.house_id = p_house_id
          AND b.user_id = auth.uid()
          AND b.status = 'confirmed'::booking_status
      )
    );
$$;

-- 6. Fix profiles self-approval escalation
CREATE OR REPLACE FUNCTION public.get_own_approved()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT approved FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    false
  );
$$;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND approved = get_own_approved());

-- 7. Fix bookings public exposure - restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view confirmed bookings" ON public.bookings;
CREATE POLICY "Authenticated users can view bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (status IN ('confirmed'::booking_status, 'pending'::booking_status) OR auth.uid() = user_id);
