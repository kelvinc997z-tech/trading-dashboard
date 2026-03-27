#!/usr/bin/env node

/**
 * Trial Monitoring & Alert Script
 * Run via cron daily to check trial expirations and send reminders
 * 
 * Usage: 
 *   node scripts/trial-monitor.js
 * 
 * Or set up cron:
 *   0 9 * * * cd /path/to/trading-dashboard && ADMIN_SECRET_KEY=yourkey node scripts/trial-monitor.js >> logs/trial-monitor.log 2>&1
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function sendTestEmail(to: string, subject: string, html: string) {
  // This would use Resend in production
  log(`📧 Would send email to ${to}: ${subject}`);
  // Implementation would be:
  // await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ from: process.env.RESEND_FROM, to, subject, html })
  // });
}

async function checkTrials() {
  log('🔍 Starting trial check...');
  
  // Read users
  const dataDir = join(process.cwd(), 'data');
  const usersFile = join(dataDir, 'users.json');
  
  if (!existsSync(usersFile)) {
    log('❌ users.json not found');
    return;
  }
  
  const users = JSON.parse(readFileSync(usersFile, 'utf-8'));
  const now = new Date();
  
  const expiringToday: any[] = [];
  const expiringIn3Days: any[] = [];
  const alreadyExpired: any[] = [];
  
  for (const user of users) {
    if (user.subscription_tier === 'trial' && user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      const diffHours = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (diffHours <= 0) {
        alreadyExpired.push(user);
      } else if (diffHours <= 24) {
        expiringToday.push(user);
      } else if (diffHours <= 24 * 3) {
        expiringIn3Days.push(user);
      }
    }
  }
  
  // Log summary
  log(`📊 Summary: ${users.length} total users`);
  log(`   - Expired today: ${alreadyExpired.length}`);
  log(`   - Expiring in 24h: ${expiringToday.length}`);
  log(`   - Expiring in 3 days: ${expiringIn3Days.length}`);
  
  // Send alerts (dry-run mode - just log)
  if (process.env.DRY_RUN !== 'false') {
    log('🔒 DRY RUN mode - no emails will be sent');
  }
  
  for (const user of expiringToday) {
    log(`⚠️  User ${user.email} trial expires TODAY!`);
    if (process.env.DRY_RUN !== 'false') {
      // sendTestEmail(user.email, '⚠️ Your Trial Expires Today!', generateEmail('today', user));
    }
  }
  
  for (const user of expiringIn3Days) {
    log(`ℹ️  User ${user.email} trial expires in 3 days`);
    if (process.env.DRY_RUN !== 'false') {
      // sendTestEmail(user.email, 'Reminder: Trial Expires Soon', generateEmail('3days', user));
    }
  }
  
  for (const user of alreadyExpired) {
    log(`❌ User ${user.email} trial has expired`);
    // In production, this would downgrade user to free
  }
  
  // Save report
  const logsDir = join(process.cwd(), 'logs');
  if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });
  
  const report = {
    timestamp: now.toISOString(),
    total_users: users.length,
    expiring_today: expiringToday.map(u => ({ email: u.email, name: u.name })),
    expiring_in_3_days: expiringIn3Days.map(u => ({ email: u.email, name: u.name })),
    expired_today: alreadyExpired.map(u => ({ email: u.email, name: u.name })),
  };
  
  const reportFile = join(logsDir, `trial-check-${now.toISOString().split('T')[0]}.json`);
  require('fs').writeFileSync(reportFile, JSON.stringify(report, null, 2));
  log(`📄 Report saved to ${reportFile}`);
  
  log('✅ Trial check complete');
}

// Generate email HTML (simplified)
function generateEmail(type: 'today' | '3days', user: any) {
  const daysLeft = type === 'today' ? 0 : 3;
  return `
    <h1>Trial Ending Soon</h1>
    <p>Hi ${user.name},</p>
    <p>Your ${daysLeft === 0 ? 'trial expires today!' : `trial expires in ${daysLeft} days!`}</p>
    <p>Upgrade to Pro to keep full access: ${NEXTAUTH_URL}/pricing</p>
  `;
}

// Run
checkTrials().catch(err => {
  console.error('❌ Trial check failed:', err);
  process.exit(1);
});
