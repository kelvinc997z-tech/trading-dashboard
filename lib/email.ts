import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(to: string, template: EmailTemplate): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email send');
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Trading Dashboard <noreply@trading-dashboard.com>',
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    console.log(`Email sent to ${to}: ${template.subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw - email failures shouldn't break user flow
  }
}

// Template generators
export const templates = {
  welcome: (name: string, trialDays: number = 7): EmailTemplate => ({
    subject: 'Welcome to Trading Dashboard!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Welcome ${name}! 🎉</h1>
        <p>Thank you for signing up for Trading Dashboard. You now have access to:</p>
        <ul>
          <li>✅ Live trading signals for 3 pairs (Free plan)</li>
          <li>✅ 15-minute delayed market data</li>
          <li>✅ Basic technical indicators</li>
        </ul>
        <p><strong>Special Offer:</strong> Start your <strong>${trialDays}-day free Pro trial</strong> now! Get:</p>
        <ul>
          <li>🚀 Real-time data (no delays)</li>
          <li>🚀 All 7 trading pairs</li>
          <li>🚀 Advanced indicators</li>
          <li>🚀 CSV export</li>
          <li>🚀 Priority support</li>
        </ul>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/pricing" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Upgrade to Pro Now
          </a>
        </p>
        <p>Your trial will expire on: <strong>{{TRIAL_END_DATE}}</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 14px;">
          Questions? Reply to this email or contact support.<br>
          Trading Dashboard Team
        </p>
      </div>
    `,
    text: `Welcome ${name}! Your ${trialDays}-day Pro trial is active. Upgrade now for full access.`,
  }),

  trialReminder: (name: string, daysLeft: number, trialEndDate: string): EmailTemplate => ({
    subject: `Your Pro trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">⏰ Trial Ending Soon</h1>
        <p>Hi ${name},</p>
        <p>Your Pro trial ends on <strong>${trialEndDate}</strong> (in ${daysLeft} day${daysLeft > 1 ? 's' : ''}).</p>
        <p>Don't lose access to:</p>
        <ul>
          <li>📊 Real-time market data</li>
          <li>💹 All 7 trading pairs</li>
          <li>📈 Advanced technical indicators</li>
          <li>📥 CSV export</li>
          <li>🎯 Priority support</li>
        </ul>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/pricing" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Continue with Pro
          </a>
        </p>
        <p>After trial ends, you'll be downgraded to the Free plan.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 14px;">
          Trading Dashboard Team
        </p>
      </div>
    `,
    text: `Your Pro trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Upgrade to keep full access.`,
  }),

  subscriptionActivated: (name: string, plan: string, nextBillDate: string, amount: string): EmailTemplate => ({
    subject: '✅ Subscription Activated!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Subscription Activated 🎉</h1>
        <p>Hi ${name},</p>
        <p>Your <strong>${plan}</strong> subscription is now <strong>active</strong>!</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #16a34a; margin: 0 0 10px 0;">Subscription Details</h3>
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Amount:</strong> ${amount}/month</p>
          <p><strong>Next billing date:</strong> ${nextBillDate}</p>
        </div>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/account" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Manage Subscription
          </a>
        </p>
        <p>You now have full access to all Pro features. Enjoy! 🚀</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 14px;">
          Trading Dashboard Team
        </p>
      </div>
    `,
    text: `Subscription activated. Plan: ${plan}. Next billing: ${nextBillDate}.`,
  }),

  subscriptionCancelled: (name: string, endDate: string): EmailTemplate => ({
    subject: 'Subscription Cancellation Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6b7280;">Subscription Cancelled</h1>
        <p>Hi ${name},</p>
        <p>Your subscription has been cancelled. You'll maintain Pro access until <strong>${endDate}</strong>.</p>
        <p>After that, your account will be downgraded to the Free plan.</p>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/pricing" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Resubscribe
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 14px;">
          Trading Dashboard Team
        </p>
      </div>
    `,
    text: `Subscription cancelled. Pro access until ${endDate}.`,
  }),

  paymentFailed: (name: string, amount: string): EmailTemplate => ({
    subject: '⚠️ Payment Failed - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Payment Failed</h1>
        <p>Hi ${name},</p>
        <p>We couldn't process your payment of <strong>${amount}</strong>. Your Pro access will be limited until payment is resolved.</p>
        <p>Please update your payment method to avoid service interruption.</p>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/account" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Update Payment Method
          </a>
        </p>
        <p>Or contact support@trading-dashboard.com for assistance.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 14px;">
          Trading Dashboard Team
        </p>
      </div>
    `,
    text: `Payment of ${amount} failed. Please update your payment method.`,
  }),
};
