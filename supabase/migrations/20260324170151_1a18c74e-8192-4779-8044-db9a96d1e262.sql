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