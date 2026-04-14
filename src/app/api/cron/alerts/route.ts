import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendAlertNotification } from "@/lib/notifications";
import { calculateRSI, calculateMACD, calculateBollingerBands } from "@/lib/indicators";
import { detectPatterns, Candle } from "@/lib/patterns";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : request.headers.get("x-cron-secret");

  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use 1h timeframe for alerts
  const timeframe = '1h';
  const COOLDOWN_MS = 60 * 60 * 1000;
  const now = new Date();
  let checked = 0;
  let triggered = 0;

  // Get all active alerts for all pro users
  const alerts = await db.alert.findMany({
    where: { isActive: true },
    include: { user: { select: { email: true } } },
  });

  if (alerts.length === 0) {
    return NextResponse.json({ checked: 0, triggered: 0, message: 'No active alerts' });
  }

  // Group by symbol and type
  const priceAlerts = alerts.filter(a => a.type === 'price');
  const indicatorAlerts = alerts.filter(a => a.type === 'indicator');
  const patternAlerts = alerts.filter(a => a.type === 'pattern');

  const alertsBySymbol: Record<string, typeof alerts> = {};
  for (const alert of alerts) {
    if (alert.symbol) {
      if (!alertsBySymbol[alert.symbol]) alertsBySymbol[alert.symbol] = [];
      alertsBySymbol[alert.symbol].push(alert);
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  async function processPriceAlerts(symbol: string, currentPrice: number, prevPrice: number | null, batch: typeof alerts) {
    for (const alert of batch) {
      checked++;
      let conditionMet = false;
      const value = Number(alert.value);

      if (alert.condition === 'above' && currentPrice > value) conditionMet = true;
      else if (alert.condition === 'below' && currentPrice < value) conditionMet = true;
      else if (alert.condition === 'cross_above' && prevPrice !== null && prevPrice < value && currentPrice >= value) conditionMet = true;
      else if (alert.condition === 'cross_below' && prevPrice !== null && prevPrice > value && currentPrice <= value) conditionMet = true;

      if (conditionMet) {
        const lastTriggered = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
        if (!lastTriggered || (now.getTime() - lastTriggered.getTime()) >= COOLDOWN_MS) {
          try {
            await sendAlertNotification(alert, currentPrice, symbol, alert.user.email);
            await db.alert.update({ where: { id: alert.id }, data: { lastTriggered: now, lastCheckedAt: now, lastCheckedPrice: currentPrice } });
            triggered++;
          } catch (e) {
            console.error('Alert notification failed:', e);
          }
        } else {
          await db.alert.update({ where: { id: alert.id }, data: { lastCheckedAt: now, lastCheckedPrice: currentPrice } });
        }
      } else {
        await db.alert.update({ where: { id: alert.id }, data: { lastCheckedAt: now, lastCheckedPrice: currentPrice } });
      }
    }
  }

  // Process price alerts
  for (const [symbol, batch] of Object.entries(alertsBySymbol)) {
    try {
      const res = await fetch(`${baseUrl}/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.current) continue;

      const currentPrice = data.current.price ?? data.current.close;
      const history = data.history || [];
      const prevPrice = history.length >= 2 ? (history[history.length - 2].price ?? history[history.length - 2].close) : null;

      const priceBatch = batch.filter(a => a.type === 'price');
      if (priceBatch.length > 0) await processPriceAlerts(symbol, currentPrice, prevPrice, priceBatch);
    } catch (e) {
      console.error(`Error checking price alerts for ${symbol}:`, e);
    }
  }

  // Process indicator alerts
  async function processIndicatorAlerts(symbol: string, prices: number[], currentPrice: number, batch: typeof alerts) {
    const rsi = prices.length >= 15 ? calculateRSI(prices, 14) : [];
    const { macd, signal: macdSignal } = prices.length >= 27 ? calculateMACD(prices, 12, 26, 9) : { macd: [], signal: [] };
    const { upper: bollingerUpper, lower: bollingerLower } = prices.length >= 20 ? calculateBollingerBands(prices, 20, 2) : { upper: [], lower: [] };

    const latestRSI = rsi.length ? rsi[rsi.length - 1] : null;
    const latestMACD = macd.length ? macd[macd.length - 1] : null;
    const latestSignal = macdSignal.length ? macdSignal[macdSignal.length - 1] : null;
    const prevMACD = macd.length >= 2 ? macd[macd.length - 2] : null;
    const prevSignal = macdSignal.length >= 2 ? macdSignal[macdSignal.length - 2] : null;
    const latestUpper = bollingerUpper.length ? bollingerUpper[bollingerUpper.length - 1] : null;
    const latestLower = bollingerLower.length ? bollingerLower[bollingerLower.length - 1] : null;

    for (const alert of batch) {
      checked++;
      let conditionMet = false;
      const value = Number(alert.value);

      if (alert.indicator === 'rsi' && latestRSI !== null) {
        if (alert.condition === 'above' && latestRSI > value) conditionMet = true;
        if (alert.condition === 'below' && latestRSI < value) conditionMet = true;
      } else if (alert.indicator === 'macd') {
        if (alert.condition === 'above' && latestMACD !== null && latestMACD > value) conditionMet = true;
        if (alert.condition === 'below' && latestMACD !== null && latestMACD < value) conditionMet = true;
        if (alert.condition === 'cross_above' && prevMACD !== null && latestMACD !== null && prevSignal !== null && latestSignal !== null && prevMACD < prevSignal && latestMACD >= latestSignal) conditionMet = true;
        if (alert.condition === 'cross_below' && prevMACD !== null && latestMACD !== null && prevSignal !== null && latestSignal !== null && prevMACD > prevSignal && latestMACD <= latestSignal) conditionMet = true;
      } else if (alert.indicator === 'bollinger') {
        if (alert.condition === 'above_upper' && latestUpper !== null && currentPrice > latestUpper) conditionMet = true;
        if (alert.condition === 'below_lower' && latestLower !== null && currentPrice < latestLower) conditionMet = true;
      }

      if (conditionMet) {
        const lastTriggered = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
        if (!lastTriggered || (now.getTime() - lastTriggered.getTime()) >= COOLDOWN_MS) {
          try {
            await sendAlertNotification(alert, currentPrice, symbol, alert.user.email);
            await db.alert.update({ where: { id: alert.id }, data: { lastTriggered: now, lastCheckedAt: now, lastCheckedPrice: currentPrice } });
            triggered++;
          } catch (e) {
            console.error('Alert notification failed:', e);
          }
        } else {
          await db.alert.update({ where: { id: alert.id }, data: { lastCheckedAt: now, lastCheckedPrice: currentPrice } });
        }
      } else {
        await db.alert.update({ where: { id: alert.id }, data: { lastCheckedAt: now, lastCheckedPrice: currentPrice } });
      }
    }
  }

  for (const [symbol, batch] of Object.entries(alertsBySymbol)) {
    try {
      const res = await fetch(`${baseUrl}/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.history) continue;

      const prices = data.history.map((h: any) => h.price ?? h.close);
      const currentPrice = prices[prices.length - 1] || null;
      if (!currentPrice) continue;

      const indicatorBatch = batch.filter(a => a.type === 'indicator');
      if (indicatorBatch.length > 0) await processIndicatorAlerts(symbol, prices, currentPrice, indicatorBatch);
    } catch (e) {
      console.error(`Error checking indicator alerts for ${symbol}:`, e);
    }
  }

  // Process pattern alerts
  async function processPatternAlerts(symbol: string, candles: Candle[], batch: typeof alerts) {
    const detectedPatterns = detectPatterns(candles);
    for (const alert of batch) {
      checked++;
      const pattern = alert.indicator;
      if (pattern && detectedPatterns.includes(pattern)) {
        const lastTriggered = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
        if (!lastTriggered || (now.getTime() - lastTriggered.getTime()) >= COOLDOWN_MS) {
          try {
            const lastCandle = candles[candles.length - 1];
            if (!lastCandle) continue;
            const currentPrice = lastCandle.close;
            await sendAlertNotification(alert, currentPrice, symbol, alert.user.email);
            await db.alert.update({ where: { id: alert.id }, data: { lastTriggered: now, lastCheckedAt: now } });
            triggered++;
          } catch (e) {
            console.error('Pattern alert notification failed:', e);
          }
        } else {
          await db.alert.update({ where: { id: alert.id }, data: { lastCheckedAt: now } });
        }
      } else {
        await db.alert.update({ where: { id: alert.id }, data: { lastCheckedAt: now } });
      }
    }
  }

  for (const [symbol, batch] of Object.entries(alertsBySymbol)) {
    try {
      const res = await fetch(`${baseUrl}/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.history || data.history.length < 3) continue;

      const candles: Candle[] = data.history.map((h: any) => ({
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
      }));

      const patternBatch = batch.filter(a => a.type === 'pattern');
      if (patternBatch.length > 0) await processPatternAlerts(symbol, candles, patternBatch);
    } catch (e) {
      console.error(`Error checking pattern alerts for ${symbol}:`, e);
    }
  }

  return NextResponse.json({ checked, triggered, timestamp: now.toISOString() });
}
