#!/usr/bin/env node

/**
 * Pre-deploy Environment Variables Checker
 * Run this before `vercel --prod` to validate all required env vars are set
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_MONTHLY',
  'STRIPE_PRICE_YEARLY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
];

const OPTIONAL_ENV_VARS = [
  'RESEND_API_KEY',
  'RESEND_FROM',
  'ADMIN_SECRET_KEY',
  'ALPHA_VANTAGE_API_KEY',
];

const PATTERNS = {
  STRIPE_SECRET_KEY: /^sk_test_/,
  STRIPE_PUBLISHABLE_KEY: /^pk_test_/,
  STRIPE_WEBHOOK_SECRET: /^whsec_/,
  STRIPE_PRICE_MONTHLY: /^price_/,
  STRIPE_PRICE_YEARLY: /^price_/,
  NEXTAUTH_URL: /^https?:\/\//,
};

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Env file not found: ${filePath}`);
    return env;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

function validate() {
  console.log('🔍 Checking environment variables...\n');
  
  const env = {
    ...loadEnv('.env.local'),
    ...process.env,
  };

  let errors = 0;
  let warnings = 0;

  // Check required vars
  for (const varName of REQUIRED_ENV_VARS) {
    const value = env[varName];
    if (!value) {
      console.error(`❌ MISSING: ${varName}`);
      errors++;
    } else {
      const pattern = PATTERNS[varName];
      if (pattern && !pattern.test(value)) {
        console.error(`❌ INVALID: ${varName} - doesn't match expected pattern`);
        errors++;
      } else {
        console.log(`✅ ${varName}: ${value.substring(0, 15)}...`);
      }
    }
  }

  console.log('');
  // Check optional vars
  for (const varName of OPTIONAL_ENV_VARS) {
    const value = env[varName];
    if (!value) {
      console.warn(`⚠️  NOT SET: ${varName} (optional but recommended)`);
      warnings++;
    } else {
      console.log(`✅ ${varName}: ${value.substring(0, 15)}...`);
    }
  }

  console.log('\n' + '='.repeat(50));
  if (errors > 0) {
    console.error(`\n❌ FAILED: ${errors} error(s) found. Please fix before deploying.`);
    process.exit(1);
  }
  if (warnings > 0) {
    console.warn(`\n⚠️  WARNING: ${warnings} optional var(s) missing. Consider setting them.`);
  }
  console.log('\n✅ All required environment variables are set correctly!');
  console.log('📦 Ready to deploy: `vercel --prod --yes`\n');
}

validate();
