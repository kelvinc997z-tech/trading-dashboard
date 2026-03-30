import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendAlertNotification } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "pro") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all active alerts for this user with user email
  const alerts = await db.alert.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { user: { select: { email: true } } },
  });

  if (alerts.length === 0) {
    return NextResponse.json({ checked: 0, triggered: 0 });
  }

  const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
  const now = new Date();
  let checked = 0;
  let triggered = 0;

  // Group alerts by symbol; handle "ALL" separately
  const alertsBySymbol: Record<string, typeof alerts> = {};
  const allAlerts: typeof alerts = [];
  for (const alert of alerts) {
    if (alert.symbol) {
      if (!alertsBySymbol[alert.symbol]) alertsBySymbol[alert.symbol] = [];
      alertsBySymbol[alert.symbol].push(alert);
    } else {
      allAlerts.push(alert);
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Helper to process a batch of alerts for a given symbol and its current/previous prices
  async function processAlerts(symbol: string, currentPrice: number, prevPrice: number | null, alertsBatch: typeof alerts) {
    for (const alert of alertsBatch) {
      checked++;
      let conditionMet = false;
      const value = Number(alert.value);

      if (alert.condition === 'above' && currentPrice > value) {
        conditionMet = true;
      } else if (alert.condition === 'below' && currentPrice < value) {
        conditionMet = true;
      } else if (alert.condition === 'cross_above' && prevPrice !== null) {
        if (prevPrice < value && currentPrice >= value) conditionMet = true;
      } else if (alert.condition === 'cross_below' && prevPrice !== null) {
        if (prevPrice > value && currentPrice <= value) conditionMet = true;
      }

      if (conditionMet) {
        const lastTriggered = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
        if (lastTriggered && (now.getTime() - lastTriggered.getTime()) < COOLDOWN_MS) {
          continue; // still in cooldown
        }

        try {
          await sendAlertNotification(alert, currentPrice, symbol, alert.user.email);
          await db.alert.update({
            where: { id: alert.id },
            data: { lastTriggered: now, lastCheckedAt: now, lastCheckedPrice: currentPrice },
          });
          triggered++;
        } catch (e) {
          console.error('Alert notification failed:', e);
        }
      } else {
        // Update lastChecked even if not triggered (to track price)
        await db.alert.update({
          where: { id: alert.id },
          data: { lastCheckedAt: now, lastCheckedPrice: currentPrice },
        });
      }
    }
  }

  // Process per-symbol alerts
  for (const [symbol, symbolAlerts] of Object.entries(alertsBySymbol)) {
    try {
      const res = await fetch(`${baseUrl}/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=1h`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.current) continue;

      const currentPrice = data.current.price ?? data.current.close;
      const history = data.history || [];
      const prevPrice = history.length >= 2 ? (history[history.length - 2].price ?? history[history.length - 2].close) : null;

      await processAlerts(symbol, currentPrice, prevPrice, symbolAlerts);
    } catch (e) {
      console.error(`Error checking alerts for ${symbol}:`, e);
    }
  }

  // Process "ALL" alerts: apply to every symbol we have data for? Or ignore? For simplicity, skip "ALL" for now.
  if (allAlerts.length > 0) {
    // Could iterate all CRYPTO_PAIRS, but skip for now to avoid spamming.
  }

  return NextResponse.json({ checked, triggered });
}
