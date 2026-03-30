import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendAlertNotification } from "@/lib/notifications";
import { calculateRSI, calculateMACD, calculateBollingerBands } from "@/lib/indicators";
import { detectPatterns } from "@/lib/patterns";

export async function GET() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "pro") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prefer "1h" for indicator calculations (enough data)
  const timeframe = '1h';

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

  // Separate alerts by type
  const priceAlerts = alerts.filter(a => a.type === 'price');
  const indicatorAlerts = alerts.filter(a => a.type === 'indicator');
  const patternAlerts = alerts.filter(a => a.type === 'pattern');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Process price alerts grouped by symbol
  const priceAlertsBySymbol: Record<string, typeof alerts> = {};
  const allPriceAlerts: typeof alerts = [];
  for (const alert of priceAlerts) {
    if (alert.symbol) {
      if (!priceAlertsBySymbol[alert.symbol]) priceAlertsBySymbol[alert.symbol] = [];
      priceAlertsBySymbol[alert.symbol].push(alert);
    } else {
      allPriceAlerts.push(alert);
    }
  }

  async function processPriceAlerts(symbol: string, currentPrice: number, prevPrice: number | null, batch: typeof alerts) {
    for (const alert of batch) {
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
          continue;
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
        await db.alert.update({
          where: { id: alert.id },
          data: { lastCheckedAt: now, lastCheckedPrice: currentPrice },
        });
      }
    }
  }

  // Process price alerts
  for (const [symbol, batch] of Object.entries(priceAlertsBySymbol)) {
    try {
      const res = await fetch(`${baseUrl}/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.current) continue;

      const currentPrice = data.current.price ?? data.current.close;
      const history = data.history || [];
      const prevPrice = history.length >= 2 ? (history[history.length - 2].price ?? history[history.length - 2].close) : null;

      await processPriceAlerts(symbol, currentPrice, prevPrice, batch);
    } catch (e) {
      console.error(`Error checking price alerts for ${symbol}:`, e);
    }
  }

  // Process indicator alerts grouped by symbol
  const indicatorAlertsBySymbol: Record<string, typeof alerts> = {};
  const allIndicatorAlerts: typeof alerts = [];
  for (const alert of indicatorAlerts) {
    if (alert.symbol) {
      if (!indicatorAlertsBySymbol[alert.symbol]) indicatorAlertsBySymbol[alert.symbol] = [];
      indicatorAlertsBySymbol[alert.symbol].push(alert);
    } else {
      allIndicatorAlerts.push(alert);
    }
  }

  async function processIndicatorAlerts(symbol: string, prices: number[], currentPrice: number, batch: typeof alerts) {
    // Compute indicators
    const rsi = prices.length >= 15 ? calculateRSI(prices, 14) : [];
    const { macd, signal: macdSignal } = prices.length >= 27 ? calculateMACD(prices, 12, 26, 9) : { macd: [], signal: [] };
    const { upper: bollingerUpper, lower: bollingerLower } = prices.length >= 20 ? calculateBollingerBands(prices, 20, 2) : { upper: [], lower: [] };

    // Indicator values aligned to latest price
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
      const indicator = alert.indicator;
      const condition = alert.condition;
      const value = Number(alert.value);

      if (indicator === 'rsi' && latestRSI !== null) {
        if (condition === 'above' && latestRSI > value) conditionMet = true;
        if (condition === 'below' && latestRSI < value) conditionMet = true;
        // Cross conditions not applicable for RSI
      } else if (indicator === 'macd') {
        if (condition === 'above' && latestMACD !== null && latestMACD > value) conditionMet = true;
        if (condition === 'below' && latestMACD !== null && latestMACD < value) conditionMet = true;
        if (condition === 'cross_above' && prevMACD !== null && latestMACD !== null && latestSignal !== null) {
          if (prevMACD < prevSignal && latestMACD >= latestSignal) conditionMet = true;
        }
        if (condition === 'cross_below' && prevMACD !== null && latestMACD !== null && latestSignal !== null) {
          if (prevMACD > prevSignal && latestMACD <= latestSignal) conditionMet = true;
        }
      } else if (indicator === 'bollinger') {
        // Bollinger does not use value
        if (condition === 'above_upper' && latestUpper !== null && currentPrice > latestUpper) conditionMet = true;
        if (condition === 'below_lower' && latestLower !== null && currentPrice < latestLower) conditionMet = true;
      }

      if (conditionMet) {
        const lastTriggered = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
        if (lastTriggered && (now.getTime() - lastTriggered.getTime()) < COOLDOWN_MS) {
          continue;
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
        await db.alert.update({
          where: { id: alert.id },
          data: { lastCheckedAt: now, lastCheckedPrice: currentPrice },
        });
      }
    }
  }

  // Process indicator alerts
  for (const [symbol, batch] of Object.entries(indicatorAlertsBySymbol)) {
    try {
      const res = await fetch(`${baseUrl}/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.history || data.history.length < 26) continue; // need enough for MACD

      const prices = data.history.map((h: any) => h.price ?? h.close);
      const currentPrice = prices[prices.length - 1] || null;
      if (currentPrice === null) continue;

      await processIndicatorAlerts(symbol, prices, currentPrice, batch);
    } catch (e) {
      console.error(`Error checking indicator alerts for ${symbol}:`, e);
    }
  }

  // Process pattern alerts
  const patternAlertsBySymbol: Record<string, typeof alerts> = {};
  const allPatternAlerts: typeof alerts = [];
  for (const alert of patternAlerts) {
    if (alert.symbol) {
      if (!patternAlertsBySymbol[alert.symbol]) patternAlertsBySymbol[alert.symbol] = [];
      patternAlertsBySymbol[alert.symbol].push(alert);
    } else {
      allPatternAlerts.push(alert);
    }
  }

  async function processPatternAlerts(symbol: string, candles: Candle[], batch: typeof alerts) {
    const detectedPatterns = detectPatterns(candles);
    for (const alert of batch) {
      checked++;
      const pattern = alert.indicator; // pattern name stored in indicator field
      if (pattern && detectedPatterns.includes(pattern)) {
        const lastTriggered = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
        if (lastTriggered && (now.getTime() - lastTriggered.getTime()) < COOLDOWN_MS) {
          continue;
        }
        try {
          const currentPrice = candles[candles.length - 1]?.close || null;
          await sendAlertNotification(alert, currentPrice, symbol, alert.user.email);
          await db.alert.update({
            where: { id: alert.id },
            data: { lastTriggered: now, lastCheckedAt: now },
          });
          triggered++;
        } catch (e) {
          console.error('Pattern alert notification failed:', e);
        }
      } else {
        await db.alert.update({
          where: { id: alert.id },
          data: { lastCheckedAt: now },
        });
      }
    }
  }

  // Process pattern alerts per symbol
  for (const [symbol, batch] of Object.entries(patternAlertsBySymbol)) {
    try {
      const res = await fetch(`${baseUrl}/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.history || data.history.length < 3) continue; // need at least 3 candles

      const candles: Candle[] = data.history.map((h: any) => ({
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
      }));

      await processPatternAlerts(symbol, candles, batch);
    } catch (e) {
      console.error(`Error checking pattern alerts for ${symbol}:`, e);
    }
  }

  return NextResponse.json({ checked, triggered });
}
