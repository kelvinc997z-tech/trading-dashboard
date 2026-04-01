#!/usr/bin/env tsx
/**
 * Reset Database Script
 * 
 * DROPS all tables and recreates from scratch:
 * - Runs all migrations
 * - Seeds initial data
 * 
 * WARNING: This will delete ALL data!
 * 
 * Usage: npx tsx scripts/reset-db.ts
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('⚠️  WARNING: This will DROP ALL DATA and reset database!');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    console.log('🗑️  Dropping database schema...');
    // Run migrate reset which drops and recreates
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    
    console.log('✅ Database schema reset complete\n');
    
    // Run seed
    console.log('🌱 Running seed script...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('\n🎉 Database reset and seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('   - All tables dropped and recreated');
    console.log('   - Migrations applied');
    console.log('   - Seed data inserted');
    console.log('\n🔑 Admin login:');
    console.log('   Email: admin@trading-dashboard.com');
    console.log('   Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
