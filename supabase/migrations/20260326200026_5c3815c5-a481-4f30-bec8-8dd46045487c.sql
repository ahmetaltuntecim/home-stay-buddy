CREATE POLICY "Admins and mods can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mod'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'mod'));