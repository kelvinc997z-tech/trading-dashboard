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
  result?: "win" | "lose";
}

// Base prices (realistic 2026)
const basePrices: Record<string, number> = {
  "XAUT/USD": 2350,
  USOIL: 88,
  "BTC/USD": 68000,
  "SOL/USD": 170,
  "ETH/USD": 3500,
  "XRP/USD": 0.62,
  "KAS/USDT": 0.12,
  // Stocks & Indices
  NASDAQ: 20500,
  SP500: 5230,
  AAPL: 195,
  NVDA: 135,
  AMD: 166,
  GOOGL: 176,
  TSM: 186,
};

// Volatility per symbol
const symbolVolatility: Record<string, number> = {
  "XAUT/USD": 30,
  USOIL: 5,
  "BTC/USD": 800,
  "SOL/USD": 10,
  "ETH/USD": 150,
  "XRP/USD": 0.05,
  "KAS/USDT": 0.03,
  // Stocks & Indices
  NASDAQ: 200,
  SP500: 40,
  AAPL: 3,
  NVDA: 5,
  AMD: 4,
  GOOGL: 3,
  TSM: 4,
};

export function generateMarketData(symbol: string): MarketData {
  const base = basePrices[symbol] || 100;
  const volatility = symbolVolatility[symbol] || 5;
  const change = (Math.random() - 0.5) * volatility;
  const price = base + change;
  const changePercent = (change / base) * 100;
  return { symbol, price, change, changePercent };
}

const getTpSlOffsets = (symbol: string) => {
  switch (symbol) {
    case 'XAUT/USD': return { tp: 50, sl: 30 };
    case 'USOIL': return { tp: 3, sl: 2 };
    case 'BTC/USD': return { tp: 1000, sl: 800 };
    case 'SOL/USD': return { tp: 8, sl: 6 };
    case 'ETH/USD': return { tp: 120, sl: 80 };
    case 'XRP/USD': return { tp: 0.03, sl: 0.02 };
    case 'KAS/USDT': return { tp: 0.01, sl: 0.008 };
    // Stocks & Indices
    case 'NASDAQ': return { tp: 200, sl: 120 };
    case 'SP500': return { tp: 40, sl: 25 };
    case 'AAPL': return { tp: 3, sl: 2 };
    case 'NVDA': return { tp: 5, sl: 3 };
    case 'AMD': return { tp: 4, sl: 2.5 };
    case 'GOOGL': return { tp: 3, sl: 2 };
    case 'TSM': return { tp: 4, sl: 2.5 };
    default: return { tp: 3, sl: 2 };
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
    hour: "2-digit", minute: "2-digit", second: "2-digit",
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

export const initialSignals: Signal[] = [
  { id: "1", pair: "XAUT/USD", type: "BUY", entry: 2350.50, tp: 2400.50, sl: 2320.50, time: "09:15:23", status: "active" },
  { id: "2", pair: "USOIL", type: "SELL", entry: 88.45, tp: 85.45, sl: 90.45, time: "10:30:45", status: "active" },
  { id: "3", pair: "BTC/USD", type: "BUY", entry: 68000, tp: 69000, sl: 67200, time: "11:05:12", status: "active" },
  { id: "4", pair: "SOL/USD", type: "SELL", entry: 170, tp: 162, sl: 176, time: "13:45:00", status: "active" },
  { id: "5", pair: "ETH/USD", type: "BUY", entry: 3500, tp: 3620, sl: 3420, time: "14:20:33", status: "active" },
  { id: "6", pair: "XRP/USD", type: "SELL", entry: 0.62, tp: 0.59, sl: 0.64, time: "15:10:00", status: "pending" },
  { id: "7", pair: "KAS/USDT", type: "BUY", entry: 0.12, tp: 0.13, sl: 0.112, time: "16:30:45", status: "active" },
];

export const supportedPairs = [
  "XAUT/USD",
  "USOIL",
  "BTC/USD",
  "SOL/USD",
  "ETH/USD",
  "XRP/USD",
  "KAS/USDT",
  "NASDAQ",
  "SP500",
  "AAPL",
  "NVDA",
  "AMD",
  "GOOGL",
  "TSM",
];