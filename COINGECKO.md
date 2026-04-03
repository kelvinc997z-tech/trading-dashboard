# CoinGecko Integration Guide

## Problem
Binance API blocks access from restricted countries (including Indonesia) with error:
```
Binance 451: Service unavailable from a restricted location
```

## Solution
Integrate CoinGecko API as an alternative data source for cryptocurrency OHLC data.

## Configuration

### Environment Variable
Set `FETCH_PROVIDER` in your `.env` or Vercel dashboard:

- **`auto`** (default): Try Binance first, fallback to CoinGecko on error
- **`coingecko`**: Use CoinGecko exclusively (recommended for restricted regions)
- **`binance`**: Force Binance only (may fail from Indonesia)

### Example (Vercel)
```
FETCH_PROVIDER=coingecko
```

## Supported Symbols

| Symbol | CoinGecko ID | Notes |
|--------|--------------|-------|
| BTC | bitcoin | |
| ETH | ethereum | |
| SOL | solana | |
| XRP | ripple | |
| DOGE | dogecoin | |
| ADA | cardano | |
| AVAX | avalanche-2 | |
| MATIC | matic-network | |
| DOT | polkadot | |
| LTC | litecoin | |
| LINK | chainlink | |
| UNI | uniswap | |
| SHIB | shiba-inu | |
| XAUT | tether-gold | Gold-backed stablecoin |
| USDT | tether | Stablecoin |
| USDC | usd-coin | Stablecoin |
| BNB | binancecoin | |

Add more mappings in `src/lib/coingecko.ts` → `COINGECKO_ID_MAP`.

## Timeframe Support

| Timeframe | CoinGecko Granularity | Max Historical |
|-----------|----------------------|-----------------|
| 1h | hourly | 30 days (~720 candles) |
| 4h | daily (downsample) | 90 days |
| 1d | daily | 90 days |

**Note**: CoinGecko's free OHLC endpoint hourly data limited to 30 days. For longer 1h history, consider paid API or alternative provider.

## API Endpoints Updated

### 1. `/api/cron/fetch-ohlc` (Cron Job)
- Supports provider fallback based on `FETCH_PROVIDER`
- Saves OHLC data to database automatically
- Return format includes `provider` field in results

**Example response:**
```json
{
  "success": true,
  "summary": { "total": 3, "successful": 3, "failed": 0 },
  "results": [
    { "symbol": "BTC", "timeframe": "1h", "provider": "coingecko", "status": "success", "ohlcCount": 100 }
  ],
  "config": { "provider": "auto" }
}
```

### 2. `/api/admin/fetch-data` (Manual Admin Fetch)
- Add `"source": "coingecko"` to request body
- Returns CSV download with CoinGecko data
- Data saved to database immediately

**Example request:**
```bash
curl -X POST https://your-app.vercel.app/api/admin/fetch-data \
  -H "Content-Type: application/json" \
  -H "x-admin-token: your-token" \
  -d '{"symbol":"BTC","timeframe":"1h","source":"coingecko"}'
```

## Testing

### Run the test script:
```bash
npx tsx scripts/test-coingecko.ts
```

Expected output:
```
=== CoinGecko Integration Test ===

1. Testing symbol mapping:
   BTC -> bitcoin
   ETH -> ethereum
   ...

2. Testing OHLC fetch for BTC (1h, limit=100):
   ✓ Fetched 100 candles
   ✓ Converted to 100 database records
```

### Manual curl test:
```bash
# Direct API test (no auth for cron)
curl -X POST https://your-app.vercel.app/api/cron/fetch-ohlc \
  -H "x-vercel-cron-secret: your-secret"
```

## Rate Limiting

CoinGecko free tier: **10-30 calls per minute**.

Our implementation:
- **15-minute cache** on API routes (`next: { revalidate: 900 }`)
- **Rate limit delay** in cron: 200ms between Binance calls, 1500ms for CoinGecko batch
- **Batch fetch** helper with delay control (`fetchMultipleCoinGeckoOHLC`)

If you hit rate limits (429), increase delays or reduce cron frequency.

## Limitations

1. **No volume data**: CoinGecko OHLC endpoint doesn't include volume. Use `market_chart` endpoint for volume, but it's more rate-limited.
2. **Historical depth**: 1h candles limited to 30 days; 4h uses daily data (upsample if needed).
3. **Rate limits**: Respect free tier limits to avoid IP bans.

## Future Improvements

- [ ] Add volume support via `market_chart` endpoint (with smarter rate limiting)
- [ ] Implement more symbols mapping (top 100 coins)
- [ ] Add caching layer (Redis) to reduce API calls further
- [ ] Multi-timeframe support: 15m, 5m (requires different approach or paid API)
- [ ] Add health check endpoint to test all providers

## Migration Checklist

- [ ] Set `FETCH_PROVIDER=coingecko` in Vercel environment variables
- [ ] Test locally: `npx tsx scripts/test-coingecko.ts`
- [ ] Trigger cron manually: `curl -X POST /api/cron/fetch-ohlc`
- [ ] Verify data in database: Check `oHLCData` table for new records
- [ ] Monitor logs for rate limit errors (429)
- [ ] If everything works, update `.env.production` with `FETCH_PROVIDER=coingecko`

## References

- CoinGecko API Docs: https://www.coingecko.com/en/api
- OHLC endpoint: https://www.coingecko.com/en/api/documentation#ohlc-chart
- Rate limits: https://www.coingecko.com/en/api/ping
