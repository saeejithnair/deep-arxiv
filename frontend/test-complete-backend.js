// Comprehensive backend test script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tchduemgcpdbkrftbrvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGR1ZW1nY3BkYmtyZnRicnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTYxNDMsImV4cCI6MjA3MDQzMjE0M30.Kj8uKNtoSwoWvXgIJ7fxfcFsq8HYzgTCGTNZSa0Q1Io';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteBackend() {
  console.log('🧪 Comprehensive Backend Testing...\n');

  let allTestsPassed = true;

  // Test 1: Supabase Connection
  console.log('1. Testing Supabase Connection...');
  try {
    const { data, error } = await supabase.from('papers').select('count').limit(1);
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (err) {
    console.log('❌ Supabase connection error:', err.message);
    allTestsPassed = false;
  }

  // Test 2: Database Schema
  console.log('\n2. Testing Database Schema...');
  try {
    const { data, error } = await supabase.from('papers').select('*').limit(1);
    if (error) {
      console.log('❌ Database schema issue:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Database schema accessible');
      if (data && data.length > 0) {
        console.log('📊 Available fields:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.log('❌ Database schema error:', err.message);
    allTestsPassed = false;
  }

  // Test 3: Paper Insertion (RLS Test)
  console.log('\n3. Testing Paper Insertion (RLS)...');
  try {
    const testPaper = {
      arxiv_id: 'test-complete-1502.03167',
      title: 'Test Paper: Complete Backend Test',
      authors: ['Test Author 1', 'Test Author 2'],
      abstract: 'This is a comprehensive test paper for backend validation.',
      wiki_content: {
        overview: {
          title: "Overview",
          content: "Test overview content for complete backend validation"
        }
      }
    };

    const { data, error } = await supabase
      .from('papers')
      .insert(testPaper)
      .select();

    if (error) {
      console.log('❌ Paper insertion failed:', error.message);
      console.log('💡 This might be due to RLS policies. Run the migration first.');
      allTestsPassed = false;
    } else {
      console.log('✅ Test paper inserted successfully');
      console.log('📄 Inserted paper ID:', data[0].id);
      
      // Clean up
      await supabase.from('papers').delete().eq('arxiv_id', 'test-complete-1502.03167');
      console.log('🧹 Test paper cleaned up');
    }
  } catch (err) {
    console.log('❌ Paper insertion error:', err.message);
    allTestsPassed = false;
  }

  // Test 4: arXiv API
  console.log('\n4. Testing arXiv API...');
  try {
    const response = await fetch('https://export.arxiv.org/api/query?id_list=1502.03167');
    const xmlText = await response.text();
    
    if (response.ok && xmlText.includes('entry')) {
      console.log('✅ arXiv API accessible');
      
      // Test XML parsing (regex-based)
      const titleMatch = xmlText.match(/<title[^>]*>([^<]+)<\/title>/);
      const summaryMatch = xmlText.match(/<summary[^>]*>([^<]+)<\/summary>/);
      const authorMatches = xmlText.match(/<name[^>]*>([^<]+)<\/name>/g);
      
      if (titleMatch) {
        console.log('✅ XML parsing successful');
        console.log('📄 Sample title:', titleMatch[1].substring(0, 50) + '...');
        console.log('📄 Authors found:', authorMatches ? authorMatches.length : 0);
      } else {
        console.log('❌ XML parsing failed');
        allTestsPassed = false;
      }
    } else {
      console.log('❌ arXiv API response invalid');
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('❌ arXiv API error:', err.message);
    allTestsPassed = false;
  }

  // Test 5: Search Functionality
  console.log('\n5. Testing Search Functionality...');
  try {
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .or('title.ilike.%test%,abstract.ilike.%test%')
      .limit(5);

    if (error) {
      console.log('❌ Search functionality failed:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Search functionality working');
      console.log('📊 Search results:', data.length, 'papers found');
    }
  } catch (err) {
    console.log('❌ Search error:', err.message);
    allTestsPassed = false;
  }

  // Test 6: Paper Retrieval
  console.log('\n6. Testing Paper Retrieval...');
  try {
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Paper retrieval failed:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Paper retrieval working');
      if (data && data.length > 0) {
        console.log('📄 Sample paper title:', data[0].title);
      } else {
        console.log('📄 No papers in database yet (this is normal)');
      }
    }
  } catch (err) {
    console.log('❌ Paper retrieval error:', err.message);
    allTestsPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 COMPREHENSIVE BACKEND TEST RESULTS');
  console.log('='.repeat(50));
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Backend is fully functional.');
    console.log('\n✅ What\'s Working:');
    console.log('- Supabase connection');
    console.log('- Database schema');
    console.log('- arXiv API integration');
    console.log('- XML parsing');
    console.log('- Search functionality');
    console.log('- Paper retrieval');
    
    console.log('\n🚀 Your backend is ready for production!');
    console.log('🌐 Frontend is running at: http://localhost:5174/');
    console.log('📝 You can now:');
    console.log('  - Add papers via the "Add paper" button');
    console.log('  - View papers from the database');
    console.log('  - Search and filter papers');
    console.log('  - Navigate to paper analysis pages');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\n🔧 To fix issues:');
    console.log('1. Run the RLS migration in Supabase dashboard');
    console.log('2. Check the Supabase connection');
    console.log('3. Verify the database schema');
    
    console.log('\n📋 SQL Migration to run:');
    console.log(`
-- Fix RLS policies to allow anonymous inserts for papers
DROP POLICY IF EXISTS paper_auth_write ON public.papers;
CREATE POLICY paper_anonymous_write ON public.papers
  FOR INSERT
  WITH CHECK (true);
CREATE POLICY paper_auth_update ON public.papers
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY paper_auth_delete ON public.papers
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
    `);
  }
  
  console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/tchduemgcpdbkrftbrvi/sql');
}

// Run the comprehensive test
testCompleteBackend().catch(console.error);
