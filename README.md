# 🚀 Trading Dashboard V2

> **Real-time Trading Dashboard with Dynamic Risk Management**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)](https://vercel.com)

**Kali ini tak續国!** Dashboard trading yang dilengkapi dengan **dynamic SL/TP berbasis volatilitas (ATR)**, sidebar mini map, dan UI/UX yang lebih responsif.

---

## 📸 Preview

| Dashboard Overview | Sidebar Mini Map | Advanced Charts |
|-------------------|------------------|-----------------|
| ![Dashboard](https://via.placeholder.com/400x250/1a1a1a/22c55e?text=Dashboard+V2) | ![Sidebar](https://via.placeholder.com/400x250/1a1a1a/3b82f6?text=Mini+Map) | ![Charts](https://via.placeholder.com/400x250/1a1a1a/a855f7?text=Charts) |

---

## ✨ What's New in V2

### 🎯 Core V2 Features

#### 1. **Dynamic Risk Management (ATR-based)**
- **Smart SL/TP**: Stop-loss dan take-profit tidak lagi statis 2%, tapi mengikuti volatilitas pasar
- **ATR Calculation**: Menggunakan Average True Range dari data OHLC
- **Volatility Scaling**: Bollinger Band width menyesuaikan risk multiplier
- **Confidence-weighted**: Nilai keyakinan sinyal mempengaruhi jarak SL
- **Minimum safeguards**: SL minimal 0.5%, TP minimal 1%

**Contoh real:**
```
BTC: Entry $68,701 | TP $72,564 (5.6%) | SL $66,930 (2.6%)
ETH: Entry $2,139  | TP $2,257  (5.5%) | SL $2,088  (2.4%)
```

#### 2. **Sidebar Mini Map**
- **Fixed overview panel** di sidebar kiri (desktop)
- **10 trading pairs** dalam satu glance:
  - 5 Crypto: XAUT, BTC, ETH, SOL, XRP
  - 5 US Stocks: AAPL, AMD, NVDA, MSFT, GOOGL
- **Sparkline charts** sederhana (SVG) untuk price trend
- **Signal indicator**: Buy/Sell badge berdasarkan SMA crossover
- **Click to navigate**: Smooth scroll ke chart lengkap + highlight
- **Mobile responsive**: Toggle button (bottom-left) untuk show/hide
- **Auto-refresh**: Update setiap 30 detik

#### 3. **Enhanced API: `/api/market-signals`**
Response sekarang include volatility metrics:

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
      },
      "reason": "SMA(12) vs SMA(24): 72076.43 > 71168.49"
    }
  ],
  "disclaimer": "Signals are generated automatically based on technical indicators. Not financial advice."
}
```

#### 4. **Responsive Dashboard Layout**
- **DashboardShell** component untuk layout adaptif
- **Fixed sidebar** di desktop (width: 288px)
- **Mobile sidebar** dengan toggle button
- **Smooth scroll** dengan highlight effect saat navigasi dari sidebar
- **Loading states** dan error handling yang lebih baik

---

## 📦 Full Feature List (V1 → V2 Evolution)

### ✅ V1 Core Features (Base)
- [x] Multi-asset support (Crypto + US Stocks)
- [x] Real-time price updates (5-minute polling)
- [x] Interactive candlestick charts (lightweight-charts)
- [x] Trade management (CRUD operations)
- [x] Auto-close positions based on SL/TP
- [x] P&L calculation (realized & unrealized)
- [x] Dark mode support (Tailwind CSS)
- [x] Responsive grid layout
- [x] User authentication (JWT)
- [x] Multiple timeframe selection (1m to 1d)

### 🚀 V2 Enhancements (New)
- [x] **ATR-based dynamic SL/TP**
- [x] **Bollinger Band volatility adjustment**
- [x] **Sidebar Mini Map with sparklines**
- [x] **Responsive dashboard shell with mobile toggle**
- [x] **Smooth scroll-to-chart navigation**
- [x] **Enhanced market signals API with volatility data**
- [x] **Improved build process** (TypeScript clean compile)
- [x] **Updated documentation** (README V2)
- [x] **ProductionReady deployment** (Vercel auto-deploy)

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS |
| **Charts** | Lightweight Charts (TradingView) |
| **Data Sources** | Massive.com (US Stocks), CoinMarketCap (Crypto) |
| **Deployment** | Vercel |
| **Auth** | NextAuth.js (JWT) |
| **Database** | PostgreSQL (Supabase) |
| **Storage** | Supabase Storage (`supabase-bronze-coin`) |

---

## ☁️ Supabase Storage Integration

### Overview

Trading Dashboard integrates **Supabase Storage** for file management (screenshots, chart exports, avatars).

- **Bucket**: `supabase-bronze-coin`
- **Project**: `xxiflnuhuhxbdoxtcpgc`
- **URL**: `https://xxiflnuhuhxbdoxtcpgc.supabase.co`

### Features

- ✅ Upload screenshots untuk trades
- ✅ Public read access (direct URLs)
- ✅ Server-side upload via API routes (secure)
- ✅ Client-side upload widget (optional)
- ✅ Auto-delete screenshots when trade deleted
- ✅ File validation (type, size)
- ✅ Organized file structure: `{type}/{refId}/{timestamp}-{filename}`

### Quick Setup

1. **Set environment variables**:

```env
SUPABASE_URL=https://xxiflnuhuhxbdoxtcpgc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://xxiflnuhuhxbdoxtcpgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. **Configure RLS policies** (see `STORAGE_SETUP.md`)
3. **Deploy** and test upload

### Components & APIs

| Component / Route | Deskripsi |
|-------------------|-----------|
| `src/lib/supabase.ts` | Core Supabase clients |
| `src/components/UploadScreenshot.tsx` | Upload widget |
| `src/components/TradeForm.tsx` | Form dengan screenshot support |
| `POST /api/upload` | Upload file |
| `GET /api/upload` | List files (`?prefix=`) |
| `DELETE /api/upload?path=` | Delete file |

### Documentation

See **[STORAGE_SETUP.md](./STORAGE_SETUP.md)** for complete setup guide, security policies, and troubleshooting.


---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/kelvinc997z-tech/trading-dashboard.git
cd trading-dashboard
npm install
```

### 2. Environment Setup
Create `.env.local`:

```env
MASSIVE_API_KEY=your_massive_api_key_here
COINMARKETCAP_API_KEY=your_cmc_pro_key_here  # optional but recommended
JWT_SECRET=your_random_jwt_secret_here
DATABASE_URL=postgresql://user:pass@host:port/db
```

**API Keys needed:**
- ✅ **MASSIVE_API_KEY** - Get from [massive-api.com](https://massive-api.com)
- ⚠️ **COINMARKETCAP_API_KEY** - Optional, crypto falls back to dummy data if absent

### 3. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

### 4. Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kelvinc997z-tech/trading-dashboard)

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market-data` | GET | OHLC data for any symbol (`?symbol=BTC&timeframe=5m`) |
| `/api/market-signals` | GET | **V2 NEW:** Dynamic SL/TP signals with volatility metrics |
| `/api/trades` | GET/POST | CRUD for user trades |
| `/api/auth/...` | Various | Authentication endpoints (login, register, session) |
| `/api/massive` | GET | Direct US stock data fetch (internal) |

### Market Signals API Example
```bash
curl http://localhost:3000/api/market-signals
```

Response:
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
  ],
  "disclaimer": "Not financial advice."
}
```

---

## 🏗 Project Structure

```
trading-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── market-data/        # OHLC provider (unified)
│   │   │   ├── market-signals/     # V2: Dynamic signals with ATR
│   │   │   ├── trades/            # Trade CRUD
│   │   │   ├── auth/              # Authentication
│   │   │   └── ...
│   │   ├── dashboard/
│   │   │   ├── layout.tsx         # V2: Dashboard shell + sidebar
│   │   │   ├── page.tsx           # Main dashboard with 10 pair grids
│   │   │   ├── alerts/            # Price alerts system
│   │   │   ├── performance/       # P&L analytics
│   │   │   └── ...
│   │   └── ...
│   ├── components/
│   │   ├── DashboardShell.tsx     # V2: Responsive layout wrapper
│   │   ├── SidebarMiniMap.tsx     # V2: Mini overview map (sparklines)
│   │   ├── RealTimeChart.tsx      # Basic candlestick chart
│   │   ├── AdvancedChart.tsx      # Pro chart with indicators
│   │   ├── MarketOutlook.tsx      # Market sentiment
│   │   ├── Navbar.tsx             # Top navigation
│   │   └── ...
│   └── lib/
│       ├── massive.ts             # US stock API integration
│       ├── auth.ts                # Auth utilities
│       └── indicators.ts          # Technical calculations
├── public/                        # Static assets
├── .env.example                   # Environment template
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md                      # This file
```

---

## 📦 Full Feature List (Complete Edition)

### 🎯 **Dashboard V2** (Core Trading Interface)
- [x] **10 Trading Pairs**: 5 Crypto (XAUT, BTC, ETH, SOL, XRP) + 5 US Stocks (AAPL, AMD, NVDA, MSFT, GOOGL)
- [x] **Real-time Charts**: Interactive candlestick charts with 6 timeframes (1m to 1d)
- [x] **Dynamic SL/TP**: ATR-based stop-loss & take-profit that adapts to volatility
- [x] **Sidebar Mini Map**: Fixed overview with sparklines for all 10 pairs
- [x] **Responsive Layout**: Mobile toggle sidebar, smooth scroll navigation
- [x] **Trade Management**: Create, edit, delete, auto-close positions
- [x] **P&L Tracking**: Realized & unrealized profit/loss with % calculations
- [x] **Dark Mode**: Full theme support via Tailwind CSS
- [x] **Live Status**: Ping animation, last update timestamp
- [x] **Pro Features**: Advanced charts with RSI, MACD, Bollinger Bands

### 🔮 **Quant AI** (AI-Powered Predictions)
- [x] **Ensemble Models**: LSTM neural networks + XGBoost + Random Forest
- [x] **Confidence Scoring**: Probability percentage for each prediction
- [x] **Auto SL/TP**: AI-generated entry, target, and stop levels
- [x] **Prediction History**: Stores last 20 predictions with timestamps
- [x] **Quick Generate**: One-click prediction for any crypto symbol
- [x] **Model Selector**: Switch between LSTM, XGBoost, Random Forest
- [x] **Multi-timeframe**: 1h, 4h, 1d predictions
- [x] **Live Updates**: Auto-refresh every hour
- [x] **How it Works**: Educational section explaining ML pipeline
- [x] **Pro/Free Tier**: Prediction limits based on subscription

### 📊 **Quant Trading** (Backtesting & Strategy Lab)
- [x] **Backtesting Engine**: Test strategies on historical OHLC data
- [x] **Strategy Library**: MA crossover, RSI oversold/overbought, MACD signals
- [x] **Custom Parameters**: Adjustable periods, thresholds, position sizing
- [x] **Performance Metrics**: Win rate, Sharpe ratio, max drawdown, profit factor
- [x] **Visualization**: Equity curve, drawdown chart, monthly returns heatmap
- [x] **Trade List**: Full trade-by-trade breakdown with P&L
- [x] **Export to CSV**: Download complete backtest results
- [x] **Strategy Optimization**: Grid search, walk-forward analysis
- [x] **Comparison Mode**: Side-by-side strategy comparison
- [x] **Paper Trading**: Real-time simulated execution
- [x] **Risk Constraints**: Position sizing, portfolio-level risk limits

### 📰 **Market Overview** (News & Signals Hub)
- [x] **Daily Outlook**: Pre-market analysis with buy/sell recommendations
- [x] **Trading Signals**: 15+ crypto pairs with confidence scores (PRO)
- [x] **News Feed**: Aggregated crypto, macro, commodities, forex news
- [x] **Category Filters**: Filter by crypto, macro, commodities, forex
- [x] **Timeframe Filters**: Last 24h, 7d, 30d
- [x] **Language Support**: English & Bahasa Indonesia
- [x] **Bookmarking**: Save important news articles
- [x] **Breaking Ticker**: Scrolling marquee for urgent market news
- [x] **Search**: Full-text search across news headlines
- [x] **Infinite Scroll**: Paginated news loading

### 🔐 **Authentication & Security**
- [x] **JWT-based Auth**: Secure token-based sessions
- [x] **2FA Support**: Optional two-factor authentication
- [x] **Role-based Access**: Free vs Pro feature gating
- [x] **Session Management**: Auto-refresh tokens, secure logout
- [x] **Password Reset**: Email-based password recovery
- [x] **Registration**: Email verification required
- [x] **Rate Limiting**: API endpoint protection
- [x] **CORS Config**: Secure cross-origin settings

### 🛠 **Developer Experience**
- [x] **TypeScript Strict**: Full type safety across codebase
- [x] **ESLint + Prettier**: Consistent code style
- [x] **Next.js 14**: Latest App Router with Server Components
- [x] **Tailwind CSS**: Utility-first styling, dark mode ready
- [x] **Lightweight Charts**: TradingView's charting library
- [x] **Environment Config**: `.env.local` for secrets
- [x] **API Routes**: Unified data fetching layer
- [x] **Error Boundaries**: Graceful error handling
- [x] **Loading States**: Skeleton screens & spinners
- [x] **Vercel Ready**: Optimized for Vercel deployment

---

## 🔄 Changelog

---

## 🔧 Configuration

### Timeframe Options
- `1m` - 1 minute
- `5m` - 5 minutes
- `15m` - 15 minutes
- `1h` - 1 hour (default)
- `4h` - 4 hours
- `1d` - 1 day

### Customization Points

**Adjust ATR multipliers** (in `src/app/api/market-signals/route.ts`):
```typescript
const baseSLMultiplier = 1.5;   // SL = ATR × 1.5
const baseTPMultiplier = 3.0;   // TP = ATR × 3.0
```

**Change refresh intervals**:
- Market data: 30 seconds (in Dashboard components)
- Sidebar: 30 seconds (in `SidebarMiniMap.tsx`)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Code Style:**
- TypeScript strict mode
- ESLint + Prettier configuration
- Follow Next.js App Router conventions

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/kelvinc997z-tech/trading-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kelvinc997z-tech/trading-dashboard/discussions)
- **Email**: support@kelvinc997z.tech

---

## 🌟 Credits

- Built with [Next.js](https://nextjs.org/) & [Tailwind CSS](https://tailwindcss.com/)
- Charts powered by [Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
- Market data: [Massive API](https://massive-api.com) + [CoinMarketCap](https://coinmarketcap.com)

---

**Made with ❤️ by Kelvin | [@kelvinc997z](https://github.com/kelvinc997z-tech)**

---

> **⚠️ Disclaimer:** This software is for educational purposes only. Not financial advice. Always do your own research before making investment decisions.
