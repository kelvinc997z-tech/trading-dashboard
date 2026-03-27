import { NextRequest, NextResponse } from "next/server";
import { readUsers, updateUserSubscription } from "@/lib/db";
import { sendEmail, templates } from "@/lib/email";

export async function POST(request: NextRequest) {
  // Simple auth via header
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.ADMIN_SECRET_KEY;
  
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await readUsers();
    const now = new Date();
    const reminders: string[] = [];
    const expired: string[] = [];

    for (const user of users) {
      // Check trial expiring in 3 days
      if (user.subscription_tier === 'trial' && user.trial_ends_at) {
        const trialEnd = new Date(user.trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft === 3) {
          // Send 3-day reminder
          await sendEmail(user.email, templates.trialReminder(
            user.name, 
            daysLeft, 
            trialEnd.toLocaleDateString()
          ));
          reminders.push(`${user.email} (3 days left)`);
        }
        
        if (trialEnd < now) {
          // Trial expired - downgrade to free
          await updateUserSubscription(user.id, {
            subscription_tier: 'free',
            subscription_status: 'active',
            trial_ends_at: undefined,
          });
          expired.push(user.email);
        }
      }
    }

    return NextResponse.json({
      success: true,
      reminders_sent: reminders.length,
      reminders,
      expired_count: expired.length,
      expired,
    });
  } catch (error) {
    console.error("Trial check error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Also allow GET for manual trigger via browser or cron
export async function GET(request: NextRequest) {
  return POST(request);
}