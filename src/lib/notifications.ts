import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlertEmail(to: string, alert: any, currentPrice: number, symbol: string) {
  if (!resend) throw new Error('Resend not initialized');
  
  const subject = `[Alert Triggered] ${alert.type.toUpperCase()} - ${symbol}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>🚨 Alert Triggered</h2>
      <p><strong>Alert ID:</strong> ${alert.id}</p>
      <p><strong>Type:</strong> ${alert.type} ${alert.indicator ? `(${alert.indicator.toUpperCase()})` : ''}</p>
      <p><strong>Symbol:</strong> ${symbol}</p>
      <p><strong>Condition:</strong> ${alert.condition} ${alert.value ?? ''}</p>
      <p><strong>Current ${alert.type === 'price' ? 'Price' : 'Value'}:</strong> $${currentPrice.toFixed(2)}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <hr/>
      <p><a href="${process.env.NEXTAUTH_URL}/dashboard/alerts">Manage Alerts</a></p>
    </div>
  `;

  const fromEmail = process.env.RESEND_EMAIL_FROM || 'Trading Dashboard <alerts@yourdomain.com>';
  const fromName = fromEmail.split('<')[0]?.trim() || 'Trading Dashboard';
  const fromAddress = fromEmail.match(/<(.+)>/)?.[1] || fromEmail;

  await resend.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject,
    html,
  });
}

export async function sendAlertTelegram(chatId: string, botToken: string, alert: any, currentPrice: number, symbol: string) {
  const message = `🚨 Alert Triggered\nID: ${alert.id}\nType: ${alert.type}\nSymbol: ${symbol}\nCondition: ${alert.condition} ${alert.value ?? ''}\nCurrent Price: $${currentPrice.toFixed(2)}\nTime: ${new Date().toLocaleString()}\nManage: ${process.env.NEXTAUTH_URL}/dashboard/alerts`;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Telegram error: ${res.status}`);
}

export async function sendAlertNotification(alert: any, currentPrice: number, symbol: string, userEmail: string) {
  const tasks: Promise<void>[] = [];

  if (alert.notificationChannel === 'email' && userEmail) {
    tasks.push(sendAlertEmail(userEmail, alert, currentPrice, symbol));
  }
  if (alert.notificationChannel === 'telegram' && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    tasks.push(sendAlertTelegram(process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_BOT_TOKEN, alert, currentPrice, symbol));
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}
