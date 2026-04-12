/**
 * Coinglass API Client
 * Docs: https://coinglass.github.io/API-Reference/
 */

const COINGLASS_API_KEY = process.env.COINGLASS_API_KEY!;

export interface CoinglassOHLC {
  symbol: string;
  timeframe: string;
  data: [number, number, number, number, number, number][]; // [time, open, high, low, close, volume]
}

export interface CoinglassPair {
  symbol: string;
  exchange: string;
  pair: string;
  base: string;
  quote: string;
  price?: number;
  change?: number;
  volume?: number;
}

/**
 * Fetch OHLC data from Coinglass
 * @param symbol - Trading pair (e.g., 'BTC', 'ETH')
 * @param timeframe - '1m', '5m', '15m', '30m', '1h', '4h', '1d', etc.
 * @param limit - Number of candles (max 5000 for some endpoints)
 */
export async function fetchCoinglassOHLC(
  symbol: string,
  timeframe: string = '1h',
  limit: number = 500
): Promise<CoinglassOHLC | null> {
  if (!COINGLASS_API_KEY) {
    console.error('COINGLASS_API_KEY not set');
    return null;
  }

  // Map our timeframes to Coinglass intervals
  const intervalMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '8h': '8h',
    '12h': '12h',
    '1d': '1d',
  };

  const interval = intervalMap[timeframe];
  if (!interval) {
    console.error(`Unsupported timeframe: ${timeframe}`);
    return null;
  }

  // Coinglass futures API endpoint for OHLC
  const url = `https://open-api.coinglass.com/api/v1/futures/kline?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        'coinglass:secret': COINGLASS_API_KEY,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Coinglass API error:', response.status, err);
      return null;
    }

    const data = await response.json();

    // Coinglass returns data in format: { code: 200, data: [[...], ...], msg: "success" }
    if (data.code !== 200 || !data.data) {
      console.error('Coinglass invalid response:', data);
      return null;
    }

    // Transform to our format
    const ohlcData: [number, number, number, number, number, number][] = data.data.map((candle: any[]) => {
      // Expected format: [timestamp, open, high, low, close, volume]
      // timestamp is in milliseconds
      return [
        candle[0], // time
        Number(candle[1]), // open
        Number(candle[2]), // high
        Number(candle[3]), // low
        Number(candle[4]), // close
        Number(candle[5]), // volume
      ];
    });

    return {
      symbol,
      timeframe,
      data: ohlcData,
    };

  } catch (error) {
    console.error('Fetch Coinglass OHLC error:', error);
    return null;
  }
}

/**
 * Fetch spot OHLC from Coinglass (alternative endpoint)
 */
export async function fetchCoinglassSpotOHLC(
  symbol: string,
  timeframe: string = '1h',
  limit: number = 500
): Promise<CoinglassOHLC | null> {
  if (!COINGLASS_API_KEY) {
    console.error('COINGLASS_API_KEY not set');
    return null;
  }

  const intervalMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };

  const interval = intervalMap[timeframe];
  if (!interval) return null;

  // Spot endpoint (different symbol format: BTC/USDT)
  const url = `https://open-api.coinglass.com/api/v1/spot/kline?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        'coinglass:secret': COINGLASS_API_KEY,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Coinglass Spot API error:', response.status, err);
      return null;
    }

    const data = await response.json();

    if (data.code !== 200 || !data.data) {
      console.error('Coinglass invalid response:', data);
      return null;
    }

    const ohlcData: [number, number, number, number, number, number][] = data.data.map((candle: any[]) => {
      return [
        candle[0],
        Number(candle[1]),
        Number(candle[2]),
        Number(candle[3]),
        Number(candle[4]),
        Number(candle[5]),
      ];
    });

    return {
      symbol,
      timeframe,
      data: ohlcData,
    };

  } catch (error) {
    console.error('Fetch Coinglass Spot OHLC error:', error);
    return null;
  }
}

/**
 * Get supported symbols from Coinglass
 */
export async function fetchCoinglassSymbols(): Promise<CoinglassPair[]> {
  if (!COINGLASS_API_KEY) {
    console.error('COINGLASS_API_KEY not set');
    return [];
  }

  const url = 'https://open-api.coinglass.com/api/v1/futures/symbols';

  try {
    const response = await fetch(url, {
      headers: {
        'coinglass:secret': COINGLASS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Coinglass symbols fetch error:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.code !== 200 || !data.data) {
      return [];
    }

    return data.data.map((item: any) => ({
      symbol: item.symbol,
      exchange: item.exchange,
      pair: item.pair,
      base: item.base,
      quote: item.quote,
      price: item.price,
      change: item.change,
      volume: item.volume,
    }));

  } catch (error) {
    console.error('Fetch Coinglass symbols error:', error);
    return [];
  }
}

/**
 * Health check for Coinglass API
 */
export async function checkCoinglassHealth(): Promise<boolean> {
  try {
    const result = await fetchCoinglassSymbols();
    return result.length > 0;
  } catch {
    return false;
  }
}
