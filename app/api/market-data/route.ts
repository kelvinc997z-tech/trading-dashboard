import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readUsers } from "@/lib/db";

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

// Alpha Vantage symbols (forex, stocks, indices) – gold via CoinMarketCap
const ALPHA_VANTAGE_SYMBOLS: Record<string, string> = {
  "USOIL": "WTI",
  "NASDAQ": "^IXIC",
  "SP500": "^GSPC",
  "AAPL": "AAPL",
  "NVDA": "NVDA",
  "AMD": "AMD",
  "GOOGL": "GOOGL",
  "TSM": "TSM",
};

// CoinMarketCap symbols (cryptocurrencies + XAUT)
const COINMARKETCAP_SYMBOLS: Record<string, string> = {
  "BTC/USD": "BTC",
  "ETH/USD": "ETH",
  "SOL/USD": "SOL",
  "XRP/USD": "XRP",
  "KAS/USDT": "KAS",
  "XAUT/USD": "XAUT"
};

// Combined symbol map
const SYMBOL_MAP: Record<string, string> = {
  "XAUT/USD": "XAUT",
  "USOIL": "WTI",
  "NASDAQ": "^IXIC",
  "SP500": "^GSPC",
  "AAPL": "AAPL",
  "NVDA": "NVDA",
  "AMD": "AMD",
  "GOOGL": "GOOGL",
  "TSM": "TSM",
  // Crypto via CoinMarketCap
  "BTC/USD": "BTC",
  "ETH/USD": "ETH",
  "SOL/USD": "SOL",
  "XRP/USD": "XRP",
  "KAS/USDT": "KAS",
};

// Free plan restriction
const FREE_PAIRS = ["XAUT/USD", "USOIL", "BTC/USD"];

// Cache file location
const dataDir = path.join(process.cwd(), 'data');
const cacheFile = path.join(dataDir, 'market_data_cache.json');

// Realistic market prices (March 2026)
const DUMMY_PRICES: Record<string, { price: number; change: number; changePercent: number }> = {
  "USOIL": { price: 82.45, change: -1.25, changePercent: -1.49 },
  // Crypto
  "BTC/USD": { price: 68500.00, change: 1250.00, changePercent: 1.86 },
  "ETH/USD": { price: 3850.00, change: 85.00, changePercent: 2.26 },
  "SOL/USD": { price: 175.20, change: 8.45, changePercent: 5.07 },
  "XRP/USD": { price: 0.6250, change: 0.0150, changePercent: 2.46 },
  "KAS/USDT": { price: 0.1200, change: 0.0050, changePercent: 4.35 },
  "XAUT/USD": { price: 2350.75, change: 12.50, changePercent: 0.53 },
  // Stocks & Indices
  "NASDAQ": { price: 20500.50, change: 125.30, changePercent: 0.61 },
  "SP500": { price: 5230.15, change: 18.70, changePercent: 0.36 },
  "AAPL": { price: 195.40, change: 2.85, changePercent: 1.48 },
  "NVDA": { price: 135.20, change: 4.20, changePercent: 3.21 },
  "AMD": { price: 165.80, change: -2.30, changePercent: -1.37 },
  "GOOGL": { price: 175.60, change: 3.45, changePercent: 2.00 },
  "TSM": { price: 185.90, change: 1.90, changePercent: 1.03 },
};

async function getCache(): Promise<{ timestamp: number; data: Record<string, any> } | null> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const raw = await fs.readFile(cacheFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setCache(data: Record<string, any>) {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (err) {
    console.error("Failed to write cache:", err);
  }
}

async function fetchMarketDataFromAPI(): Promise<Record<string, { price: number; change: number; changePercent: number }>> {
  const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;
  const cmcKey = process.env.COINMARKETCAP_API_KEY;
  const results: Record<string, { price: number; change: number; changePercent: number }> = {};

  // If no API keys at all, return all dummy data immediately
  if (!alphaKey && !cmcKey) {
    console.warn("No API keys configured (Alpha Vantage or CoinMarketCap), using dummy data");
    return DUMMY_PRICES;
  }

  const fetchPromises = Object.entries(SYMBOL_MAP).map(async ([originalSymbol, targetSymbol]) => {
    const isCrypto = !!COINMARKETCAP_SYMBOLS[originalSymbol];
    
    if (isCrypto && cmcKey) {
      // Fetch from CoinMarketCap
      try {
        const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(targetSymbol)}`;
        const res = await fetch(url, {
          headers: { 'X-CMC_PRO_API_KEY': cmcKey },
          next: { revalidate: 10 }, // refresh every 10s
        });
        
        if (!res.ok) {
          console.error(`Failed to fetch CMC ${targetSymbol}: ${res.status} ${res.statusText}`);
          return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
        }
        
        const data = await res.json();
        const coinData = data.data?.[targetSymbol];
        if (!coinData) {
          console.warn(`No data for ${targetSymbol} from CMC`);
          return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
        }
        
        const quote = coinData.quote?.USD;
        if (!quote) {
          console.warn(`No USD quote for ${targetSymbol} from CMC`);
          return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
        }
        
        const price = quote.price ?? 0;
        const percentChange = quote.percent_change_24h ?? 0;
        const change = price * (percentChange / 100);
        
        return {
          symbol: originalSymbol,
          price,
          change,
          changePercent: percentChange,
        };
      } catch (err) {
        console.error(`CMC fetch error for ${originalSymbol}:`, err);
        return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
      }
    } else {
      // Alpha Vantage path (for stocks, indices, forex)
      if (!alphaKey) {
        return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
      }
      
      try {
        const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(targetSymbol)}&apikey=${alphaKey}`;
        const res = await fetch(url, { 
          next: { revalidate: 10 },
        });
        
        if (!res.ok) {
          console.error(`Failed to fetch Alpha Vantage ${targetSymbol}: ${res.status} ${res.statusText}`);
          return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
        }
        
        const data = await res.json();
        
        if (data["Note"] || data.Information) {
          console.warn(`API limit/info for ${targetSymbol}:`, data["Note"] || data.Information);
          return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
        }
        
        const quote = data["Global Quote"];
        if (!quote) {
          console.warn(`No quote data for ${targetSymbol}, using dummy`);
          return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
        }
        
        const price = parseFloat(quote["05. price"]);
        const change = parseFloat(quote["09. change"] || "0");
        const changePercentStr = quote["10. change percent"]?.replace("%", "") || "0";
        const changePercent = parseFloat(changePercentStr);
        
        return {
          symbol: originalSymbol,
          price: isNaN(price) ? DUMMY_PRICES[originalSymbol].price : price,
          change: isNaN(change) ? DUMMY_PRICES[originalSymbol].change : change,
          changePercent: isNaN(changePercent) ? DUMMY_PRICES[originalSymbol].changePercent : changePercent,
        };
      } catch (err) {
        console.error(`Alpha Vantage exception for ${targetSymbol}:`, err);
        return { symbol: originalSymbol, ...DUMMY_PRICES[originalSymbol] };
      }
    }
  });

  const resultsArr = await Promise.all(fetchPromises);
  resultsArr.forEach(item => {
    if (item) {
      results[item.symbol] = {
        price: item.price,
        change: item.change,
        changePercent: item.changePercent,
      };
    }
  });

  return results;
}

export async function GET(request: NextRequest) {
  // 1. Authenticate with NextAuth
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!session.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // 2. Get user's subscription tier
  const users = await readUsers();
  const user = users.find(u => u.id === session.user!.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isPro = user.subscription_tier === "pro" && user.subscription_status === "active";
  const FREE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  // 3. Determine which pairs to return (free users only get 3 pairs)
  const allowedPairs = isPro ? Object.keys(SYMBOL_MAP) : FREE_PAIRS;

  // 4. Cache logic for free users
  let cached: { timestamp: number; data: Record<string, any> } | null = null;
  if (!isPro) {
    cached = await getCache();
    const now = Date.now();
    if (cached && (now - cached.timestamp) < FREE_CACHE_TTL) {
      // Return cached data filtered to free pairs
      const filtered: Record<string, { price: number; change: number; changePercent: number }> = {};
      for (const pair of allowedPairs) {
        if (cached.data[pair]) filtered[pair] = cached.data[pair];
      }
      // If cache missing some pairs, fill with dummy
      for (const pair of allowedPairs) {
        if (!filtered[pair] && DUMMY_PRICES[pair]) {
          filtered[pair] = DUMMY_PRICES[pair];
        }
      }
      return NextResponse.json(filtered);
    }
  }

  // 5. Fetch fresh data (if pro or cache expired)
  const freshData = await fetchMarketDataFromAPI();
  
  // Update cache for free users
  if (!isPro) {
    await setCache(freshData);
  }

  // 6. Filter to allowed pairs
  const result: Record<string, { price: number; change: number; changePercent: number }> = {};
  for (const pair of allowedPairs) {
    if (freshData[pair]) {
      result[pair] = freshData[pair];
    } else if (DUMMY_PRICES[pair]) {
      result[pair] = DUMMY_PRICES[pair];
    }
  }

  return NextResponse.json(result);
}
