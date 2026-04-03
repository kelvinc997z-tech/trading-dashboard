/**
 * On-Chain Data Integration (CryptoQuant)
 * Fetches blockchain metrics that can improve prediction accuracy
 * 
 * Free tier: 100 calls/day, 1 call/min
 * Sign up: https://portal.cryptoquant.com/
 */

const CRYPTOQUANT_BASE = "https://api.cryptoquant.com/live/v3";

// CryptoQuant symbol mapping (adjust as needed)
export const CRYPTOQUANT_SYMBOLS = {
  BTC: "btc",
  ETH: "eth",
  SOL: "sol",
  XRP: "xrp",
  // Add more
};

// Metric definitions
export const ONCHAIN_METRICS = {
  // Exchange flows
  "exchange_inflows": "Exchange Inflow Volume (USD)",
  "exchange_outflows": "Exchange Outflow Volume (USD)",
  "exchange_balance": "Exchange Balance (BTC)",
  
  // Whales
  "whale_exchange_supply_ratio": "Whale Supply Ratio on Exchanges",
  "large_holders_ratio": "Large Holders Supply Ratio",
  
  // Miners
  "miner_outflows": "Miner Outflow Volume (USD)",
  "miner_hashrate": "Hash Rate (EH/s)",
  
  // Network activity
  "transaction_count": "Transaction Count",
  "active_addresses": "Active Addresses",
  
  // Derivatives
  "funding_rates": "Funding Rates (perpetual)",
  "open_interest": "Open Interest (USD)",
};

export interface OnChainMetrics {
  timestamp: number;
  symbol: string;
  metric: string;
  value: number;
}

/**
 * Fetch on-chain metrics from CryptoQuant
 * Requires CRYPTOQUANT_API_KEY in env
 */
export async function fetchCryptoQuantMetric(
  symbol: string,
  metric: string,
  limit: number = 200
): Promise<OnChainMetrics[]> {
  const apiKey = process.env.CRYPTOQUANT_API_KEY;
  if (!apiKey) {
    throw new Error("CRYPTOQUANT_API_KEY not set");
  }

  const cryptoQuantSymbol = CRYPTOQUANT_SYMBOLS[symbol.toUpperCase()];
  if (!cryptoQuantSymbol) {
    throw new Error(`Unsupported symbol for CryptoQuant: ${symbol}`);
  }

  // Map metric to CryptoQuant endpoint
  const endpointMap: Record<string, string> = {
    "exchange_inflows": `c/exchange-flows/inflow?asset=${cryptoQuantSymbol}&exchange=all&window=DAY`,
    "exchange_outflows": `c/exchange-flows/outflow?asset=${cryptoQuantSymbol}&exchange=all&window=DAY`,
    "exchange_balance": `c/exchange-assets?asset=${cryptoQuantSymbol}&exchange=all`,
    "whale_exchange_supply_ratio": `c/distribution/percentage-of-supply?asset=${cryptoQuantSymbol}&wallet=all&min_value=10000`,
    "large_holders_ratio": `c/distribution/percentage-of-supply?asset=${cryptoQuantSymbol}&wallet=all&min_value=100`,
    "miner_outflows": `c/miner-flows/outflow?asset=${cryptoQuantSymbol}&miners=all`,
    "transaction_count": `c/network-data/transaction-count?asset=${cryptoQuantSymbol}`,
    "active_addresses": `c/network-data/addresses-count?asset=${cryptoQuantSymbol}`,
    "funding_rates": `c/derivatives/funding-rates?asset=${cryptoQuantSymbol}&exchange=all`,
    "open_interest": `c/derivatives/open-interest?asset=${cryptoQuantSymbol}&exchange=all`,
  };

  const endpoint = endpointMap[metric];
  if (!endpoint) {
    throw new Error(`Unknown metric: ${metric}`);
  }

  const url = `${CRYPTOQUANT_BASE}/${endpoint}&limit=${limit}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    next: { revalidate: 900 }, // 15 min cache
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CryptoQuant error: ${res.status} ${err}`);
  }

  const data = await res.json();
  // Response format varies - adapt as needed
  // Typically: { data: [{timestamp, value}], status: "ok" }
  
  const result: OnChainMetrics[] = (data.data || []).map((item: any) => ({
    timestamp: item.timestamp * 1000, // convert to ms
    symbol: symbol.toUpperCase(),
    metric,
    value: Number(item.value),
  }));

  return result;
}

/**
 * Batch fetch multiple metrics for a symbol
 */
export async function fetchCryptoQuantMetrics(
  symbol: string,
  metrics: string[],
  limit: number = 200
): Promise<Record<string, OnChainMetrics[]>> {
  const results: Record<string, OnChainMetrics[]> = {};
  
  for (const metric of metrics) {
    try {
      const data = await fetchCryptoQuantMetric(symbol, metric, limit);
      results[metric] = data;
      // Rate limit: 1 call/min on free tier
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.warn(`Failed to fetch ${metric} for ${symbol}:`, error.message);
      results[metric] = [];
    }
  }
  
  return results;
}

/**
 * Merge on-chain features into OHLC DataFrame
 * Returns feature matrix with additional on-chain columns
 */
export function mergeOnChainFeatures(
  ohlcDf: pd.DataFrame,
  onchainData: Record<string, OnChainMetrics[]>
): pd.DataFrame {
  // Convert onchain to time-series aligned with OHLC
  // This is a Python bridge function; will be implemented in Python training script
  // Placeholder for now
  return ohlcDf;
}
