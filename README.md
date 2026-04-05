# 🚀 Trading Dashboard V2

> **AI-Powered Trading Platform with Dynamic Risk Management & Modern UI**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Live-brightgreen?logo=vercel)](https://vercel.com)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://trading-dashboard.vercel.app)
[![ML Models](https://img.shields.io/badge/ML%20Accuracy-54.47%25-yellow)](README.md#-model-performance)

**✨ Ditingkatkan dengan:** Modern glassmorphism UI, AI predictions (LSTM/XGBoost), dynamic ATR-based SL/TP, real-time mini-map sidebar, dan **deploymentVercel Production-Ready**.

---

## 🌐 Live Demo

**🔗 URL:** [https://trading-dashboard.vercel.app](https://trading-dashboard.vercel.app)

**Current Build:** [![Vercel](https://img.shields.io/github/deployments/kelvinc997z-tech/trading-dashboard/production?label=vercel&logo=vercel)](https://vercel.com/kelvinc997z-tech/trading-dashboard)

---

## 📊 Project Progress

### ✅ Completed (April 2025)

| Milestone | Status | Details |
|-----------|--------|---------|
| **Modern UI/UX Overhaul** | ✅ Deployed | Glassmorphism, emerald/teal gradients, framer-motion animations |
| **Vercel Production Build** | ✅ Live | 58 pages, 138kB bundle, all build errors fixed |
| **ML Model Training** | ✅ Done | BTC/ETH/SOL/XRP models (54.47% avg win rate) |
| **On-chain Infrastructure** | ✅ Ready | CryptoQuant integration ready (awaiting API activation) |
| **Supabase Storage** | ✅ Integrated | Screenshot upload, bucket: `supabase-bronze-coin` |
| **Dynamic SL/TP (ATR)** | ✅ Implemented | Volatility-adjusted risk management |
| **Sidebar Mini Map** | ✅ Live | 10-pair overview with sparklines & signals |
| **Responsive Design** | ✅ Mobile-ready | Mobile toggle, smooth scroll navigation |
| **TypeScript Build Fixes** | ✅ Applied | All type errors resolved for production |

### 🔄 In Progress

- ⏳ **CryptoQuant API Activation** (Professional subscription required)
- ⏳ **Finnhub Sentiment Dashboard** (news + Reddit/Twitter social sentiment)
- ⏳ **Massive API Setup** (US stock data provider)
- ⏳ **Multi-language Support** (English / Bahasa Indonesia)

### 📋 To-Do (Next Features)

- [ ] On-chain data retraining (after CryptoQuant activation) → Target: **60-65%** accuracy
- [ ] Trading journal with auto-sync from trades
- [ ] Backtesting engine with strategy optimization
- [ ] Portfolio rebalancing suggestions
- [ ] Telegram/WhatsApp alerts integration
- [ ] Export trades to CSV/Excel

---

## 🎯 Current Performance

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

#### 3. **Coinglass API Integration**
- **Upgraded data source** from CoinMarketCap to **Coinglass**
- **More comprehensive OHLC data**: multiple timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d)
- **Higher rate limits** and better free tier
- **Fallback support**: Still supports Massive (stocks) and CoinMarketCap (if configured)
- **API Key**: `COINGLASS_API_KEY` environment variable

#### 4. **CoinGecko API Integration (Fallback for Restricted Regions)**
- **Problem**: Binance blocks API access from certain countries (Indonesia included)
- **Solution**: CoinGecko as primary or fallback data source for crypto OHLC
- **Supported symbols**: BTC, ETH, SOL, XRP, DOGE, ADA, AVAX, MATIC, DOT, LTC, LINK, UNI, SHIB, XAUT, USDT, USDC, BNB
- **Timeframes**: 1h, 4h, 1d (note: 1h limited to last 30 days due to API granularity)
- **No API key required** (free tier: 10-30 calls/min, with caching)
- **Configuration**: Set `FETCH_PROVIDER=auto` (default) to try Binance first, fallback to CoinGecko on error
  - Or `FETCH_PROVIDER=coingecko` to use CoinGecko directly (recommended for Indonesia)
  - Or `FETCH_PROVIDER=binance` to force Binance (may fail from restricted regions)
- **Rate limiting**: Built-in 15-minute cache on API routes to respect CoinGecko limits
- **Cron job**: `/api/cron/fetch-ohlc` now supports automatic fallback

---

## 📈 Recent Updates (Changelog)

### **2026-04-03** — Production Deployment & Major UI/UX Overhaul

#### 🎨 Complete Visual Redesign
- **Glassmorphism UI**: Modern card design with backdrop blur and gradient borders
- **Emerald/Teal/Cyan theme**: New color palette throughout the app
- **Framer Motion animations**: Smooth transitions, hover effects, and scroll animations
- **Enhanced sidebar**: Interactive mini-map with sparklines and signal badges
- **Modern stats cards**: Icon-based metrics with trend indicators
- **Confidence meters**: Visual progress bars for prediction strength
- **Custom scrollbars**: Sleek scroll experience with hover states
- **Loading skeletons**: Skeleton screens for better perceived performance
- **Accessibility focus**: Proper focus states, reduced motion support
- **Responsive improvements**: Mobile-optimized with toggle sidebar

#### 🚀 Production Build Fixes
- Fixed `framer-motion` import errors
- Removed Python/pandas references from TypeScript
- All build warnings resolved
- 58 pages generated successfully in 36s
- 138kB JavaScript bundle (optimized)

#### 🧠 Model Training Results
- Trained XGBoost models for 4 symbols (BTC, ETH, SOL, XRP) on 10-year OHLC data
- **Average win rate: 54.47%** (range: 53.43% - 56.86%)
- 91 features per model: technical indicators + 9 on-chain metrics placeholders
- Infrastructure ready for CryptoQuant integration (API 403 pending activation)
- Models saved in `models/{symbol}-1d/` directory

#### 🔧 Infrastructure Updates
- Added `setup-vercel-envs.sh` script for quick API key setup
- Created `API_KEYS_SETUP.md` documentation
- Updated `.env.example` with all required variables
- Fixed TypeScript type errors for production
- Updated dependencies: added `framer-motion`

#### 🌐 Upcoming Features (In Development)
- **Sentiment Analysis Dashboard**: Finnhub news + Reddit/Twitter social sentiment aggregation
- **Multi-language Support**: Full internationalization (i18n) for English and Bahasa Indonesia
- **Real-time Data Sources**: Integrated CoinAPI, FreeCryptoAPI, and Alchemy for enhanced market data

---

### **2026-04-02** — Real-Time Market Outlook & Economic Calendar Upgrade

#### 🥉 Market Outlook: Real-Time Data from Coinglass
- **Upgraded** `/api/market-outlook` from static DB cache to **real-time** data
- Fetches live OHLC from **Coinglass API** for 6 pairs: XAUT/USD, EUR/USD, USD/JPY, GBP/USD, OIL/USD, XAG/USD
- **ATR-based signal generation** on-demand (no cron job needed)
- **Fallback system**: Uses cached static values if Coinglass unavailable
- XAUT Mini Card on landing page now shows **live price updates** (every 30s)
- Symbol standardized to **XAUT/USD** (GOLD XAUT Crypto)

#### 🗓️ Economic Calendar: Timezone & UX Improvements
- **Timezone conversion** to Asia/Jakarta (GMT+7)
- **Grouped by date** with clear date headers
- **Stats dashboard**: Total events, high impact count, currencies, today's events
- **Loading skeleton** and **error state** with retry button
- **Impact badges** now include icons (high=alert, medium=trending)
- **30-minute caching** on API route (reduces Finnhub API calls)
- Auto-refresh every 30 minutes

#### 🎨 Landing Page & UI Tweaks
- **XAUT Mini Card** redesigned: compact unified display (price + signal + TP/SL)
- Placed **above Quant AI** section for better visibility
- Updated version badge: **"NEW IN V.2.0"** (from "NEW IN V2")
- Improved responsive layout and visual hierarchy

#### 🏗️ Infrastructure & Bug Fixes
- **Supabase Storage integration complete** (bucket: `supabase-bronze-coin`)
  - API routes: `/api/upload` (POST/GET/DELETE)
  - Components: `UploadScreenshot`, `TradeForm` with screenshot support
  - Auto-cleanup: Screenshots deleted when trade deleted
- **Fixed TypeScript build errors** for production on Vercel
  - Supabase `FileObject` type compatibility
  - Coinglass data format transformations
  - Excluded test scripts from build
- **Environment variables**: Added `COINGLASS_API_KEY` support
- **Auth system**: Resend email integration ready (test accounts available)

---

#### 3. **Coinglass API Integration**
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
- [x] Real-time price updates (30-second polling)
- [x] Interactive candlestick charts (TradingView Lightweight Charts)
- [x] Trade management (CRUD operations with Supabase)
- [x] Auto-close positions based on SL/TP
- [x] P&L calculation (realized & unrealized)
- [x] Dark/Light mode toggle (Tailwind CSS)
- [x] Responsive grid layout
- [x] User authentication (JWT + NextAuth)
- [x] Multiple timeframe selection (1m to 1d)
- [x] Supabase Storage integration (screenshot uploads)

### 🚀 V2 Major Enhancements (Completed Apr 2025)

#### 🎨 **UI/UX Revolution**
- [x] **Glassmorphism design system** - Modern cards with backdrop blur
- [x] **Emerald/Teal/Cyan gradient palette** - Eye-pleasing color scheme
- [x] **Framer Motion animations** - Smooth fade-in, slide-up, scale effects
- [x] **Custom CSS utilities** - Confidence meters, pulse rings, animated gradients
- [x] **Enhanced typography** - Better hierarchy, spacing, and readability
- [x] **Custom scrollbars** - Sleek scroll experience
- [x] **Accessibility improvements** - Focus states, reduced motion support

#### 📊 **Dashboard Upgrade**
- [x] **Stats cards with icons & trends** - Interactive metric displays
- [x] **Enhanced sidebar Mini Map** - Glass effect, signals, live updates
- [x] **Confidence meters on signals** - Visual strength indicator
- [x] **Chart containers with gradients** - Decorative backgrounds
- [x] **Modern trades table** - Color-coded, status badges, hover effects
- [x] **Animated tabs with indicator** - Smooth tab switching
- [x] **Loading skeletons** - Better perceived performance
- [x] **Mobile-optimized** - Toggle sidebar, responsive grid

#### 🧠 **Machine Learning Models**
- [x] **XGBoost ensemble training** for 4 symbols (BTC, ETH, SOL, XRP)
- [x] **Technical indicators** (30+ features): RSI, MACD, Bollinger, ATR, Stochastic, CCI, MFI, OBV
- [x] **Hyperparameter tuning** with validation
- [x] **Threshold optimization** per symbol
- [x] **Feature importance tracking**
- [x] **Model persistence** (joblib format)
- [x] **On-chain infrastructure** ready (CryptoQuant placeholder)

**Model Performance (1d timeframe):**

| Symbol | Win Rate | Training Samples | Feature Count |
|--------|----------|------------------|---------------|
| BTC | **53.54%** | 3,250 | 91 |
| ETH | **56.86%** | 2,801 | 91 |
| SOL | **53.43%** | 2,038 | 91 |
| XRP | **54.05%** | 2,837 | 91 |
| **Average** | **54.47%** | - | - |

> **Note:** On-chain features currently zero-filled due to CryptoQuant API 403. Real data expected to add +3-8% accuracy once Professional subscription activated.

#### 🔧 **Infrastructure & DevOps**
- [x] **Vercel production deployment** - Auto-deploy from GitHub
- [x] **Environment variable management** - Ready for API keys
- [x] **Build optimization** - 36s build time, 138kB JS bundle
- [x] **TypeScript strict mode** - Zero build errors in production
- [x] **Framer Motion integration** - Production-ready animations
- [x] **Supabase Storage setup** - Bucket configured, RLS policies ready
- [x] **API route structure** - Unified data fetching layer
- [x] **Error handling** - Graceful fallbacks for missing API keys

---

## 🔑 Required API Keys

To unlock **full functionality**, add these environment variables in **Vercel Dashboard** → Settings → Environment Variables → Production:

| Variable | Purpose | Status | Get From |
|----------|---------|--------|----------|
| `COINAPI_API_KEY` | Primary crypto data (REST) | ✅ Added | [coinapi.io](https://coinapi.io) |
| `FREECRYPTOAPI_API_KEY` | Secondary crypto data (REST) | ✅ Added | [freeapi.coincap.io](https://freeapi.coincap.io) |
| `BINANCE_API_KEY` | Real-time WebSocket (optional) | Optional | [binance.com](https://binance.com) |
| `ALCHEMY_API_KEY` | Ethereum on-chain data | ✅ Added | [alchemy.com](https://alchemy.com) |
| `MASSIVE_API_KEY` | US stock data (AAPL, NVDA, etc.) | ⚠️ Needed | [massive-api.com](https://massive-api.com) |
| `NEXT_PUBLIC_FINNHUB_API_KEY` | News & sentiment | ⚠️ Optional | [finnhub.io](https://finnhub.io) |
| `CRYPTOQUANT_API_KEY` | On-chain metrics | ⏳ Pending activation | [portal.cryptoquant.com](https://portal.cryptoquant.com) |
| `SUPABASE_URL` | Database & storage | ✅ Already set (local) | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access | ✅ Already set (local) | Supabase dashboard |

**Setup script:** `./set-vercel-envs.sh` (automates environment variable addition)

---

### 📡 **Data Source Priority (Crypto)**

| Priority | Source | Type | Real-time? |
|----------|--------|------}|
| 1 | **CoinAPI** | REST | ❌ No |
| 2 | **Binance** | REST + WebSocket | ✅ Yes |
| 3 | **FreeCryptoAPI** | REST | ❌ No |
| 4 | Coinglass | REST | ❌ No |
| 5 | CoinGecko | REST (free) | ❌ No |
| 6 | Synthetic | Dummy data | ❌ No |

**Note:** Only Binance supports WebSocket real-time updates. If CoinAPI or FreeCryptoAPI is used as primary, price updates will be REST-only (polling every interval). Binance is automatically used as fallback if primary sources fail.

## 🎨 Design System

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS |
| **Charts** | Lightweight Charts (TradingView) |
| **Data Sources** | Massive.com (US Stocks), **Coinglass API** (Crypto) |
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
- [ ] **Language Support**: English & Bahasa Indonesia (i18n in progress)
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

## 🎨 Design System

### Color Palette (V2 Theme)
```
Primary:    Emerald 500 (#10b981) → Teal 500 (#14b8a6)
Accent:     Cyan 400 (#22d3ee) → Blue 500 (#3b82f6)
Success:    Emerald gradient (emerald-500 → teal-500)
Warning:    Amber-500 (#f59e0b) → Orange-500 (#f97316)
Background: Gray-50 (light) / Gray-900 (dark)
Surface:    Glassmorphism (rgba + backdrop-blur + border opacity)
```

### Typography
- **Headings**: Inter (semibold-bold)
- **Body**: Inter (regular-medium)
- **Monospace**: JetBrains Mono / Fira Code (for numbers)

### Components
- **Cards**: `glass-card` class with backdrop blur, rounded-xl, subtle border
- **Buttons**: `btn-gradient` with shine animation on hover
- **Confidence Bar**: Multi-color gradient (red → yellow → green) with shimmer
- **Sidebar Items**: Hover effects with left-border indicator
- **Tabs**: Animated underline with `layoutId` (framer-motion)

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
- [x] **Dark/Light Mode**: Full theme support via Tailwind CSS
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
- [x] **Educational Content**: "How it Works" section explaining ML pipeline
- [x] **Subscription Gating**: Pro/Free tier feature access control

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
- [ ] **Language Support**: English & Bahasa Indonesia (i18n in progress)
- [x] **Bookmarking**: Save important news articles
- [x] **Breaking Ticker**: Scrolling marquee for urgent market news
- [x] **Search**: Full-text search across news headlines
- [x] **Infinite Scroll**: Paginated news loading

### 🔐 **Authentication & Security**
- [x] **JWT-based Auth**: Secure token-based sessions
- [x] **2FA Support**: Optional two-factor authentication
- [x] **Role-based Access**: Free vs Pro feature gating
- [x] **Session Management**: Auto-refresh tokens, secure logout
- [x] **Password Reset**: Email-based password recovery (Resend)
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

## 🗓️ Economic Calendar Widget

Trading Dashboard now includes **MQL5 Tradays** embedded widget for real-time economic events:

- **Embed code**: User-provided HTML/JavaScript snippet
- **Auto-updates**: Real-time event data from MQL5
- **Timezone**: Automatically converted to Asia/Jakarta (GMT+7)
- **Component**: `src/components/EconomicCalendarWidget.tsx`
- **No API key needed**: Widget loads directly from MQL5 CDN
- **Fully customizable**: Width, height, display mode via widget parameters

**Widget features:**
- High/Medium/Low impact indicators
- Event grouping by date
- Currency filter
- Country flags
- Real-time updates

---

## 🌟 Credits

- Built with [Next.js](https://nextjs.org/) & [Tailwind CSS](https://tailwindcss.com/)
- Charts powered by [Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
- Market data: [Massive API](https://massive-api.com) + [CoinMarketCap](https://coinmarketcap.com)

---

**Made with ❤️ by Kelvin | [@kelvinc997z](https://github.com/kelvinc997z-tech)**

---

> **⚠️ Disclaimer:** This software is for educational purposes only. Not financial advice. Always do your own research before making investment decisions.
