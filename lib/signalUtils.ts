export interface Signal {
  id: string;
  pair: string;
  type: "BUY" | "SELL";
  entry: number;
  tp: number;
  sl: number;
  time: string;
  status: "active" | "closed" | "pending";
  result?: "win" | "lose";
}

export function calculateWinRate(signals: Signal[]): { total: number; winRate: number } {
  const total = signals.length;
  const closed = signals.filter(s => s.status === "closed");
  const won = closed.filter(s => s.result === "win").length;
  const winRate = closed.length > 0 ? Math.round((won / closed.length) * 100) : 0;
  return { total, winRate };
}
