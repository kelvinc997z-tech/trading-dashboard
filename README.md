# Trading Dashboard V2

Advanced real-time trading dashboard with dynamic risk management and enhanced UI/UX.

> **Note:** This is the V2 rewrite with volatility-based SL/TP calculations and responsive design improvements.

## ✨ V2 Features

### Dynamic Risk Management
- **ATR-based Stop-Loss & Take-Profit**: SL/TP levels automatically adjust based on Average True Range (ATR)
- **Volatility Adjustment**: Bollinger Band width incorporated for market volatility scaling
- **Confidence-weighted**: Risk distances scaled by signal confidence
- **Minimum safeguards**: 0.5% SL, 1% TP minimums to avoid too-tight stops

### Enhanced UI/UX
- **Sidebar Mini Map**: Fixed overview panel showing all 10 trading pairs with sparkline charts
- **Responsive design**: Mobile-friendly with toggleable sidebar
- **Smooth navigation**: Click any pair in sidebar → auto-scroll & highlight full chart
- **Real-time updates**: Prices and signals refresh every 30 seconds
- **Visual feedback**: Live status indicators, hover effects, and loading states

### Market Signals API
- **New endpoint**: `/api/market-signals` returns dynamic SL/TP with volatility metrics
- **Response includes**:
  ```json
  {
    "pair": "BTC",
    "signal": "Buy",
    "entry": 68701.14,
    "tp": 72564.28,
    "sl": 66929.93,
    "confidence": 0.71,
    "volatility": {
      "atr": 1046.12,
      "bollingerWidth": 0.0462
    }
  }
  ```

## Features

- Real-time (or near real-time) price updates for selected assets.
- Integration with multiple financial data providers.
- **Multi-category layout**: Crypto (5 pairs) + US Stocks (5 stocks)
- **Advanced charting**: Interactive candlestick charts with technical indicators
- **Trade management**: View, track, and auto-close positions based on SL/TP
- **Dark mode support**: Fully responsive light/dark theme

## Supported Assets

### US Stocks
- Apple Inc. (AAPL)
- Advanced Micro Devices, Inc. (AMD)
- NVIDIA Corporation (NVDA)
- Microsoft Corporation (MSFT)
- Alphabet Inc. (GOOGL)

### Cryptocurrencies
- Tether Gold (XAUT)
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- Ripple (XRP)

## Setup

1. **Clone the repository.**
2. **Install dependencies:** `npm install`
3. **Create `.env.local`** (or `.env` for development) with your API keys:
   ```
   MASSIVE_API_KEY=your_massive_api_key_here
   COINMARKETCAP_API_KEY=your_cmc_api_key_here  # optional but recommended
   JWT_SECRET=your_jwt_secret_here
   DATABASE_URL=your_postgresql_connection_string
   ```
4. **Run the development server:** `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MASSIVE_API_KEY` | ✅ Yes | API key for Massive.com (US stock data) |
| `COINMARKETCAP_API_KEY` | ⚠️ Optional | Crypto prices; if absent, falls back to dummy data |
| `JWT_SECRET` | ✅ Yes | Secret for JWT token signing |
| `DATABASE_URL` | ✅ Yes | PostgreSQL database connection string |

## Deployment (Vercel)

This project is optimized for Vercel deployment:

1. **Import repository** into Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** – Vercel will auto-detect Next.js and build settings
4. **Auto-deploy** enabled: every push to `main` triggers new deployment

**Build settings:**
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── market-data/        # OHLC data for all symbols
│   │   ├── market-signals/     # V2: Dynamic SL/TP signals
│   │   ├── trades/            # CRUD for user trades
│   │   └── ...
│   ├── dashboard/
│   │   ├── layout.tsx         # V2: Dashboard shell with sidebar
│   │   ├── page.tsx           # Main dashboard with 10 pair charts
│   │   └── ...
├── components/
│   ├── DashboardShell.tsx     # V2: Responsive layout wrapper
│   ├── SidebarMiniMap.tsx     # V2: Mini map overview component
│   ├── RealTimeChart.tsx      # Basic chart component
│   ├── AdvancedChart.tsx      # Pro chart with indicators
│   └── ...
└── lib/
    ├── massive.ts             # US stock data integration
    └── auth.ts                # Authentication utilities
```

## API Highlights

### `GET /api/market-data?symbol={symbol}&timeframe={tf}`
Returns OHLC data for the requested symbol.

**Example:** `/api/market-data?symbol=BTC&timeframe=5m`

### `GET /api/market-signals` (V2 NEW)
Returns trading signals with dynamic SL/TP based on ATR and volatility.

**Response:**
```json
{
  "date": "2026-04-01",
  "market": "Real-time Technical Analysis",
  "signals": [
    {
      "pair": "BTC",
      "signal": "Buy",
      "entry": 68701.14,
      "tp": 72564.28,
      "sl": 66929.93,
      "confidence": 0.71,
      "volatility": {
        "atr": 1046.12,
        "bollingerWidth": 0.0462
      }
    }
  ]
}
```

### `GET /api/trades`
Fetches user trades with live P&L calculation.

## Recent Changes (V2)

- ✅ Added ATR-based dynamic SL/TP calculations
- ✅ Integrated Bollinger Band width for volatility scaling
- ✅ Created SidebarMiniMap component for market overview
- ✅ Implemented responsive DashboardShell with mobile toggle
- ✅ Smooth scroll-to-chart with highlight effect
- ✅ Added sparkline visualizations using lightweight SVG
- ✅ Updated dashboard layout with fixed sidebar

## License

MIT
