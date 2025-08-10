-- Fix RLS policies to allow anonymous inserts for papers
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS paper_auth_write ON public.papers;

-- Create a new policy that allows anonymous inserts
CREATE POLICY paper_anonymous_write ON public.papers
  FOR INSERT
  WITH CHECK (true);

-- Create a policy for updates (requires auth)
CREATE POLICY paper_auth_update ON public.papers
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create a policy for deletes (requires auth)
CREATE POLICY paper_auth_delete ON public.papers
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
