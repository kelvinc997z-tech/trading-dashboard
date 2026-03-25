export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface Signal {
  id: string;
  pair: string;
  type: "BUY" | "SELL";
  entry: number;
  tp: number;
  sl: number;
  time: string;
  status: "active" | "closed" | "pending";
}

// Initial prices around March 2026 levels
const basePrices: Record<string, number> = {
  XAUUSD: 2200,
  USOIL: 88,
};

export function generateMarketData(symbol: string): MarketData {
  const base = basePrices[symbol] || 100;
  const volatility = symbol === "XAUUSD" ? 30 : 5;
  const change = (Math.random() - 0.5) * volatility;
  const price = base + change;
  const changePercent = (change / base) * 100;

  return {
    symbol,
    price,
    change,
    changePercent,
  };
}

export function generateSignal(symbol: string, currentPrice: number): Signal {
  const types: ("BUY" | "SELL")[] = ["BUY", "SELL"];
  const type = types[Math.floor(Math.random() * types.length)];
  const tpOffset = symbol === "XAUUSD" ? 50 : 3;
  const slOffset = symbol === "XAUUSD" ? 30 : 2;

  const entry = currentPrice;
  const tp = type === "BUY" ? entry + tpOffset : entry - tpOffset;
  const sl = type === "BUY" ? entry - slOffset : entry + slOffset;

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return {
    id: `${symbol}-${Date.now()}`,
    pair: symbol,
    type,
    entry,
    tp,
    sl,
    time: timeStr,
    status: "active",
  };
}

// Initial mock signals
export const initialSignals: Signal[] = [
  {
    id: "1",
    pair: "XAUUSD",
    type: "BUY",
    entry: 2215.50,
    tp: 2265.50,
    sl: 2185.50,
    time: "09:15:23",
    status: "active",
  },
  {
    id: "2",
    pair: "USOIL",
    type: "SELL",
    entry: 89.25,
    tp: 86.25,
    sl: 91.25,
    time: "10:30:45",
    status: "active",
  },
  {
    id: "3",
    pair: "XAUUSD",
    type: "SELL",
    entry: 2230.00,
    tp: 2180.00,
    sl: 2255.00,
    time: "11:05:12",
    status: "closed",
  },
  {
    id: "4",
    pair: "USOIL",
    type: "BUY",
    entry: 87.10,
    tp: 90.10,
    sl: 85.10,
    time: "13:45:00",
    status: "pending",
  },
];