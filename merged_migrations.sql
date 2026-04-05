
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'mod', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TABLE public.houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  capacity int NOT NULL DEFAULT 2,
  price numeric(10,2) NOT NULL,
  image_url text,
  location text,
  rating numeric(2,1) DEFAULT 0,
  reviews_count int DEFAULT 0,
  tag text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Houses are viewable by everyone" ON public.houses FOR SELECT USING (true);
CREATE POLICY "Admins and mods can insert houses" ON public.houses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mod'));
CREATE POLICY "Admins and mods can update houses" ON public.houses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mod'));
CREATE POLICY "Admins can delete houses" ON public.houses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON public.houses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Add activity dates to houses
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS available_from date;
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS available_to date;

-- Create booking status enum
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_manual boolean DEFAULT false,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Everyone can see confirmed bookings (for availability check)
CREATE POLICY "Anyone can view confirmed bookings" ON public.bookings FOR SELECT USING (status = 'confirmed' OR auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins/mods can manage all bookings
CREATE POLICY "Admins can manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mod'));

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.houses
  ADD COLUMN IF NOT EXISTS private_description text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
CREATE POLICY "Admins and mods can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mod'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mod'));

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
CREATE POLICY "Approved users can view houses" ON public.houses FOR SELECT TO authenticated USING (public.get_own_approved());
