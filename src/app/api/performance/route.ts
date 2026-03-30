import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/performance?period=all-time
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all-time";

  // Get user's trades
  const trades = await db.trade.findMany({
    where: { userId: session.user.id, status: "closed" },
    select: {
      pnl: true,
      pnlPct: true,
      entry: true,
      exit: true,
      date: true,
      exitDate: true,
    },
    orderBy: { exitDate: "asc" },
  });

  if (trades.length === 0) {
    return NextResponse.json({ message: "No closed trades yet" });
  }

  // Basic calculations
  const totalPnL = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const wins = trades.filter(t => (Number(t.pnl) || 0) > 0);
  const losses = trades.filter(t => (Number(t.pnl) || 0) < 0);
  const winRate = trades.length ? wins.length / trades.length : 0;
  const avgWin = wins.length ? wins.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0) / losses.length : 0;
  const profitFactor = Math.abs((avgWin * wins.length) / (avgLoss * losses.length)) || 0;

  // Sharpe Ratio (simplified: mean daily returns / std dev)
  // Assuming each trade is a "day" for simplicity
  const returns = trades.map(t => Number(t.pnlPct) || 0);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sq, r) => sq + Math.pow(r - meanReturn, 2), 0) / returns.length);
  const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0;

  // Max drawdown (simplified)
  let peak = 0;
  let drawdown = 0;
  let runningPnL = 0;
  for (const t of trades) {
    runningPnL += Number(t.pnl) || 0;
    if (runningPnL > peak) peak = runningPnL;
    const currentDrawdown = peak - runningPnL;
    if (currentDrawdown > drawdown) drawdown = currentDrawdown;
  }
  const maxDrawdown = drawdown;

  // Average holding time
  const avgHolding = trades.reduce((sum, t) => {
    const entry = new Date(t.date as any).getTime();
    const exit = new Date(t.exitDate as any).getTime();
    return sum + (exit - entry);
  }, 0) / trades.length;

  const result = {
    period,
    totalTrades: trades.length,
    winRate: Number((winRate * 100).toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(3)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    totalPnL: Number(totalPnL.toFixed(2)),
    avgTradePnL: Number((totalPnL / trades.length).toFixed(2)),
    bestTrade: Number(Math.max(...trades.map(t => Number(t.pnl) || 0)).toFixed(2),
    worstTrade: Number(Math.min(...trades.map(t => Number(t.pnl) || 0)).toFixed(2)),
    avgHoldingMs: Math.round(avgHolding),
  };

  // Cache as performance metric
  const startDate = new Date(trades[0].date as any);
  const endDate = new Date(trades[trades.length - 1].exitDate as any);

  await db.performanceMetric.upsert({
    where: {
      userId_period_startDate: {
        userId: session.user.id,
        period,
        startDate,
      },
    },
    update: {
      ...result,
      startDate,
      endDate,
      updatedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      period,
      startDate,
      endDate,
      ...result,
    },
  });

  return NextResponse.json(result);
}
