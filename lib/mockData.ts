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
  XAUUSD: 4570, // Gold
  USOIL: 88,    // US Oil
  BTCUSDT: 68000,
  SOLUSDT: 170,
  XRPUSDT: 0.62,
  ETHUSDT: 3500,
  KASUSDT: 0.12,
};

// Volatility per symbol (for mock price generation)
const symbolVolatility: Record<string, number> = {
  XAUUSD: 30,
  USOIL: 5,
  BTCUSDT: 800,
  SOLUSDT: 10,
  XRPUSDT: 0.05,
  ETHUSDT: 150,
  KASUSDT: 0.03,
};

export function generateMarketData(symbol: string): MarketData {
  const base = basePrices[symbol] || 100;
  const volatility = symbolVolatility[symbol] || 5;
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

// TP/SL offsets per symbol (in price units)
const getTpSlOffsets = (symbol: string) => {
  switch (symbol) {
    case 'XAUUSD':
      return { tp: 50, sl: 30 };
    case 'USOIL':
      return { tp: 3, sl: 2 };
    case 'BTCUSDT':
      return { tp: 1000, sl: 800 };
    case 'SOLUSDT':
      return { tp: 8, sl: 6 };
    case 'XRPUSDT':
      return { tp: 0.03, sl: 0.02 };
    case 'ETHUSDT':
      return { tp: 120, sl: 80 };
    case 'KASUSDT':
      return { tp: 0.01, sl: 0.008 };
    default:
      return { tp: 3, sl: 2 };
  }
};

export function generateSignal(symbol: string, currentPrice: number): Signal {
  const types: ("BUY" | "SELL")[] = ["BUY", "SELL"];
  const type = types[Math.floor(Math.random() * types.length)];
  const { tp, sl } = getTpSlOffsets(symbol);

  const entry = currentPrice;
  const tpVal = type === "BUY" ? entry + tp : entry - tp;
  const slVal = type === "BUY" ? entry - sl : entry + sl;

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
    tp: tpVal,
    sl: slVal,
    time: timeStr,
    status: "active",
  };
}

// Initial mock signals (expanded)
export const initialSignals: Signal[] = [
  {
    id: "1",
    pair: "XAUUSD",
    type: "BUY",
    entry: 4570.50,
    tp: 4620.50,
    sl: 4540.50,
    time: "09:15:23",
    status: "active",
  },
  {
    id: "2",
    pair: "USOIL",
    type: "SELL",
    entry: 88.45,
    tp: 85.45,
    sl: 90.45,
    time: "10:30:45",
    status: "active",
  },
  {
    id: "3",
    pair: "BTCUSDT",
    type: "BUY",
    entry: 68000,
    tp: 69000,
    sl: 67200,
    time: "11:05:12",
    status: "active",
  },
  {
    id: "4",
    pair: "SOLUSDT",
    type: "SELL",
    entry: 170,
    tp: 162,
    sl: 176,
    time: "13:45:00",
    status: "active",
  },
  {
    id: "5",
    pair: "ETHUSDT",
    type: "BUY",
    entry: 3500,
    tp: 3620,
    sl: 3420,
    time: "14:20:33",
    status: "active",
  },
  {
    id: "6",
    pair: "XRPUSDT",
    type: "SELL",
    entry: 0.62,
    tp: 0.59,
    sl: 0.64,
    time: "15:10:00",
    status: "pending",
  },
  {
    id: "7",
    pair: "KASUSDT",
    type: "BUY",
    entry: 0.12,
    tp: 0.13,
    sl: 0.112,
    time: "16:30:45",
    status: "active",
  },
];

// All supported pairs
export const supportedPairs = [
  "XAUUSD",
  "USOIL",
  "BTCUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ETHUSDT",
  "KASUSDT",
];