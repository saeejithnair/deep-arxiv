// Script to run RLS policy fix migration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tchduemgcpdbkrftbrvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGR1ZW1nY3BkYmtyZnRicnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTYxNDMsImV4cCI6MjA3MDQzMjE0M30.Kj8uKNtoSwoWvXgIJ7fxfcFsq8HYzgTCGTNZSa0Q1Io';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('🔧 Running RLS policy fix migration...\n');

  try {
    // Note: We can't run DDL statements with the client library
    // This would need to be run in the Supabase dashboard SQL editor
    console.log('⚠️  This migration needs to be run manually in the Supabase dashboard.');
    console.log('📋 SQL to run:');
    console.log(`
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
    `);
    
    console.log('\n🔗 Go to: https://supabase.com/dashboard/project/tchduemgcpdbkrftbrvi/sql');
    console.log('📝 Copy and paste the SQL above into the SQL editor and run it.');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

runMigration().catch(console.error);
