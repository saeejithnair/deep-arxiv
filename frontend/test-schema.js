// Test script to check database schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tchduemgcpdbkrftbrvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGR1ZW1nY3BkYmtyZnRicnZpIiwisInJvbGUiOiJhbm9uIiwiaWF0IjoxNzU0ODU2MTQzLCJleHAiOjIwNzA0MzIxNDN9.Kj8uKNtoSwoWvXgIJ7fxfcFsq8HYzgTCGTNZSa0Q1Io';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  // Try to insert a minimal paper to see what columns exist
  console.log('1. Testing minimal paper insertion...');
  try {
    const minimalPaper = {
      arxiv_id: 'test-minimal-1502.03167',
      title: 'Test Paper',
      authors: ['Test Author']
    };

    const { data, error } = await supabase
      .from('papers')
      .insert(minimalPaper)
      .select();

    if (error) {
      console.log('❌ Minimal insertion failed:', error.message);
      
      // Try to get the table info
      console.log('\n2. Checking table structure...');
      const { data: tableData, error: tableError } = await supabase
        .from('papers')
        .select('*')
        .limit(0);
      
      if (tableError) {
        console.log('❌ Table structure error:', tableError.message);
      } else {
        console.log('✅ Table exists but has schema issues');
      }
    } else {
      console.log('✅ Minimal paper inserted successfully');
      console.log('📄 Inserted paper:', data[0]);
      
      // Clean up
      await supabase.from('papers').delete().eq('arxiv_id', 'test-minimal-1502.03167');
      console.log('🧹 Test paper cleaned up');
    }
  } catch (err) {
    console.log('❌ Schema check error:', err.message);
  }

  // Test with only the original schema fields
  console.log('\n3. Testing with original schema fields...');
  try {
    const originalSchemaPaper = {
      arxiv_id: 'test-original-1502.03167',
      title: 'Test Paper with Original Schema',
      authors: ['Test Author'],
      abstract: 'Test abstract',
      wiki_content: { test: 'content' }
    };

    const { data, error } = await supabase
      .from('papers')
      .insert(originalSchemaPaper)
      .select();

    if (error) {
      console.log('❌ Original schema insertion failed:', error.message);
    } else {
      console.log('✅ Original schema paper inserted successfully');
      console.log('📄 Inserted paper fields:', Object.keys(data[0]));
      
      // Clean up
      await supabase.from('papers').delete().eq('arxiv_id', 'test-original-1502.03167');
      console.log('🧹 Test paper cleaned up');
    }
  } catch (err) {
    console.log('❌ Original schema test error:', err.message);
  }
}

checkSchema().catch(console.error);
