
-- Replace overly permissive anon INSERT with a restricted one
DROP POLICY "Anyone can register as member" ON public.members;

CREATE POLICY "Public registration with restricted fields" ON public.members
  FOR INSERT TO anon
  WITH CHECK (
    payment_status = 'pending'
    AND status = 'active'
    AND name IS NOT NULL
    AND email IS NOT NULL
    AND phone IS NOT NULL
  );
