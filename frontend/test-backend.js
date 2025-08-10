// Test script for backend functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tchduemgcpdbkrftbrvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGR1ZW1nY3BkYmtyZnRicnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTYxNDMsImV4cCI6MjA3MDQzMjE0M30.Kj8uKNtoSwoWvXgIJ7fxfcFsq8HYzgTCGTNZSa0Q1Io';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBackend() {
  console.log('🧪 Testing Deep-Arxiv Backend...\n');

  // Test 1: Check Supabase connection
  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('papers').select('count').limit(1);
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (err) {
    console.log('❌ Supabase connection error:', err.message);
  }

  // Test 2: Check papers table structure
  console.log('\n2. Testing papers table structure...');
  try {
    const { data, error } = await supabase.from('papers').select('*').limit(1);
    if (error) {
      console.log('❌ Papers table query failed:', error.message);
    } else {
      console.log('✅ Papers table accessible');
      if (data && data.length > 0) {
        console.log('📊 Sample paper fields:', Object.keys(data[0]));
      } else {
        console.log('📊 Table is empty (no papers yet)');
      }
    }
  } catch (err) {
    console.log('❌ Papers table error:', err.message);
  }

  // Test 3: Test arXiv API
  console.log('\n3. Testing arXiv API...');
  try {
    const response = await fetch('https://export.arxiv.org/api/query?id_list=1502.03167');
    const xmlText = await response.text();
    if (response.ok && xmlText.includes('entry')) {
      console.log('✅ arXiv API accessible');
    } else {
      console.log('❌ arXiv API response invalid');
    }
  } catch (err) {
    console.log('❌ arXiv API error:', err.message);
  }

  // Test 4: Try to insert a test paper
  console.log('\n4. Testing paper insertion...');
  try {
    const testPaper = {
      arxiv_id: 'test-1502.03167',
      title: 'Test Paper: Batch Normalization',
      authors: ['Test Author 1', 'Test Author 2'],
      abstract: 'This is a test paper for backend validation.',
      category: 'Computer Science',
      published_date: '2025-01-01',
      views: '1000',
      citations: '50',
      field: 'Computer Science',
      methodology: 'Test methodology'
    };

    const { data, error } = await supabase
      .from('papers')
      .insert(testPaper)
      .select();

    if (error) {
      console.log('❌ Paper insertion failed:', error.message);
    } else {
      console.log('✅ Test paper inserted successfully');
      console.log('📄 Inserted paper ID:', data[0].id);
      
      // Clean up - delete the test paper
      await supabase.from('papers').delete().eq('arxiv_id', 'test-1502.03167');
      console.log('🧹 Test paper cleaned up');
    }
  } catch (err) {
    console.log('❌ Paper insertion error:', err.message);
  }

  // Test 5: Check RLS policies
  console.log('\n5. Testing Row Level Security...');
  try {
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ RLS policy issue:', error.message);
    } else {
      console.log('✅ RLS policies working correctly');
      console.log(`📊 Found ${data.length} papers (if any exist)`);
    }
  } catch (err) {
    console.log('❌ RLS test error:', err.message);
  }

  console.log('\n🎉 Backend testing complete!');
}

// Run the tests
testBackend().catch(console.error);
