const { Client } = require('pg');

// Test both direct (5432) and pooler (6543)
const configs = [
  {
    name: 'Direct (5432)',
    host: 'db.kdihrbfqlemuzshqhgzx.supabase.co',
    port: 5432,
  },
  {
    name: 'Pooler (6543)',
    host: 'db.kdihrbfqlemuzshqhgzx.supabase.co',
    port: 6543,
    extra: '?pgbouncer=true',
  },
];

async function testConnection(config) {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: 'postgres',
    password: 'museholicZ997!', // Updated password
    ssl: { rejectUnauthorized: false },
    connectTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log(`✅ [${config.name}] Connected to Supabase PostgreSQL!`);
    const res = await client.query('SELECT version()');
    console.log(`   📊 Version: ${res.rows[0].version.substring(0, 50)}...`);
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ [${config.name}] Failed: ${err.message}`);
    await client.end().catch(() => {});
    return false;
  }
}

async function main() {
  console.log('🔍 Testing Supabase connection (with updated password)...\n');
  for (const config of configs) {
    console.log(`Testing ${config.name}...`);
    const success = await testConnection(config);
    if (success) {
      console.log(`\n✅ Use this configuration for DATABASE_URL:`);
      console.log(`postgresql://postgres:museholicZ997!@${config.host}:${config.port}/postgres${config.extra || ''}?sslmode=require`);
      process.exit(0);
    }
  }
  console.log('\n❌ All connection attempts failed.');
  console.log('\n🔧 Troubleshooting:');
  console.log('  1. Check Supabase Dashboard → Settings → Network → IP Allowlist');
  console.log('  2. Disable IP allowlist temporarily for testing');
  console.log('  3. Ensure database is "Active" in Supabase');
  console.log('  4. Try connecting from your local machine with psql first');
}

main();
