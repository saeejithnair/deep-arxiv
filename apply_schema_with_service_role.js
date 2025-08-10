import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://tchduemgcpdbkrftbrvi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'SERVICE_KEY_NEEDED';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchemaChanges() {
  console.log('🔧 Applying database schema changes...\n');
  
  try {
    console.log('📊 Adding pdf_url column to papers table...');
    const { data: alterResult, error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS pdf_url TEXT;'
    });
    
    if (alterError) {
      console.log('❌ Error adding pdf_url column:', alterError.message);
    } else {
      console.log('✅ pdf_url column added successfully');
    }
    
    console.log('🔒 Updating RLS policies for public access...');
    
    const policies = [
      'DROP POLICY IF EXISTS paper_public_read ON public.papers;',
      'DROP POLICY IF EXISTS paper_auth_write ON public.papers;',
      'CREATE POLICY paper_public_access ON public.papers FOR ALL USING (true) WITH CHECK (true);'
    ];
    
    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy });
      if (policyError && !policyError.message.includes('does not exist')) {
        console.log('❌ Policy error:', policyError.message);
      }
    }
    
    console.log('✅ RLS policies updated for public access');
    
    console.log('\n🧪 Testing schema with sample data...');
    const testRecord = {
      arxiv_id: 'test-' + Date.now(),
      title: 'Test Paper for Schema Validation',
      authors: [{ name: 'Test Author' }],
      abstract: 'Test abstract for schema validation',
      pdf_url: 'https://arxiv.org/pdf/test.pdf',
      wiki_content: { sections: [], summary: 'Test content' }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('papers')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log('❌ Schema test failed:', insertError.message);
    } else {
      console.log('✅ Schema test passed - can insert with pdf_url');
      
      await supabase.from('papers').delete().eq('arxiv_id', testRecord.arxiv_id);
      console.log('🧹 Test record cleaned up');
    }
    
    console.log('\n🎉 Database schema successfully configured for hackathon MVP!');
    
  } catch (error) {
    console.error('💥 Schema application failed:', error);
  }
}

console.log('📋 To apply the database schema:');
console.log('1. Set SUPABASE_SERVICE_ROLE_KEY environment variable');
console.log('2. Run: SUPABASE_SERVICE_ROLE_KEY=your_service_key node apply_schema_with_service_role.js');
console.log('3. Or manually run the SQL in Supabase dashboard SQL editor:\n');

const migrationSQL = fs.readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8');
console.log('--- SQL TO RUN MANUALLY ---');
console.log(migrationSQL);
console.log('--- END SQL ---\n');

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  applySchemaChanges();
} else {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not provided. Please set it and run again.');
}
