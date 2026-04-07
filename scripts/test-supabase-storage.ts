/**
 * Test script untuk verifikasi Supabase Storage connection
 * Run: npx tsx test-supabase-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load env from .env.local
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET_NAME = 'supabase-bronze-coin';

async function testConnection() {
  console.log('🔍 Testing Supabase Storage connection...\n');

  try {
    // Test 1: List bucket contents
    console.log(`📁 Listing files in bucket "${BUCKET_NAME}"...`);
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 10 });

    if (listError) {
      console.error('❌ List error:', listError.message);
    } else {
      console.log(`✅ Found ${files.length} files:`);
      files.forEach(f => {
        console.log(`   - ${f.name} (${f.metadata?.size || 0} bytes)`);
      });
    }

    // Test 2: Upload a test file
    console.log('\n📤 Testing upload...');
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testPath = `test/test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
    } else {
      console.log('✅ Uploaded test file:', uploadData.path);
    }

    // Test 3: Get public URL
    console.log('\n🔗 Getting public URL...');
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testPath);

    console.log('✅ Public URL:', urlData.publicUrl);

    // Test 4: Delete test file
    console.log('\n🗑️ Deleting test file...');
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([testPath]);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError.message);
    } else {
      console.log('✅ Deleted test file');
    }

    // Test 5: Check bucket exists
    console.log('\n📋 Checking bucket info...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('❌ Bucket list error:', bucketError.message);
    } else {
      const bucket = buckets.find(b => b.name === BUCKET_NAME);
      if (bucket) {
        console.log(`✅ Bucket "${BUCKET_NAME}" exists:`);
        console.log(`   - ID: ${bucket.id}`);
        console.log(`   - Public: ${bucket.public}`);
        // Compute file count and size from earlier file list
        const fileCount = files?.length || 0;
        const totalSize = (files || []).reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
        console.log(`   - File count: ${fileCount}`);
        console.log(`   - Size: ${totalSize} bytes`);
      } else {
        console.error(`❌ Bucket "${BUCKET_NAME}" not found!`);
      }
    }

    console.log('\n✨ All tests completed!');

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testConnection();
