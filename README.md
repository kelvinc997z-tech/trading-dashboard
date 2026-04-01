# 🚀 Klepon Trading Dashboard

_next.js powered trading platform with AI-driven insights_

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com)

---

## 📖 Overview

**Klepon Trading Dashboard** adalah platform trading modern yang dilengkapi dengan analisis real-time, signals, dan **Quant AI** — mesin prediksi pasar berbasis machine learning yang sedang dalam pengembangan.

Fiturnya:
- 📊 **Live Charts** untuk Gold, Bitcoin, Ethereum, Solana, Ripple
- 🤖 **Quant AI** (Roadmap: LSTM, XGBoost, Portfolio Optimization)
- 📈 **Market Outlook** & trading signals
- 🔐 **JWT Authentication** dengan email verification (Resend)
- 🎨 **Tailwind CSS** + Dark mode support
- 🚀 **Ready to deploy** on Vercel

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Prisma ORM (SQLite dev, Postgres prod) |
| Auth | JWT + HTTP-only cookies |
| Email | Resend |
| Deployment | Vercel |
| Icons | Lucide React |

---

## 📦 Features

### ✅ Already Implemented

**Core Platform:**
- User registration & login with email verification (Resend)
- Protected dashboard with real-time trade table
- Multi-pair live price charts (Crypto, Forex, Commodities, US Stocks)
  - *Crypto*: BTC, ETH, SOL, XRP, XAUT
  - *Forex*: EURUSD, USDJPY, GBPUSD
  - *Commodities*: OIL, SILVER
  - *US Stocks*: AAPL, AMD, NVDA, MSFT, GOOGL (via Massive API)
- Market Outlook component (daily trading signals)
- Trading Signals table (Pro-only, with upgrade prompt)
- Economic Calendar (Finnhub API)
- Trading Journal (full CRUD, auto-close on TP/SL)
- Responsive design (mobile & desktop)
- Dark mode toggle (via system preference)
- CoinMarketCap API integration for real-time crypto prices
- Modern landing page with professional copy & CTAs
- Pricing page with WhatsApp payment integration
- WhatsApp admin contact: `6281367351643`
- Pro features gating with role-based access

**User Experience Enhancements:**
- 📋 **Watchlist Sync** – Save favorite pairs; sync across devices with star button
- 🔐 **Two-Factor Authentication (2FA)** – TOTP-based via Google Authenticator
- 🔔 **In-App Notification Center** – Bell icon with dropdown, real-time updates
- ♿ **High Contrast Mode** – WCAG-compliant accessibility toggle
- 🎯 **First-Time User Onboarding** – Interactive tour (3 steps) for new users
- 💡 **Tooltips & Help Text** – Contextual help throughout the UI
- ⚡ **Real-time Updates** – Auto-refresh trades every 30 seconds
- ✨ **Visual Polish** – Smooth animations with Framer Motion

**Quant AI (Beta):**
- 🤖 **AI Price Predictions** – Generate forecasts for Crypto, Forex, Commodities, and US Stocks
  - *Supported symbols*: BTC, ETH, SOL, XRP, XAUT, EURUSD, USDJPY, GBPUSD, OIL, SILVER, AAPL, AMD, NVDA, MSFT, GOOGL
  - *Auto-calculates technical indicators if missing*
  - *Uses trained ML models (XGBoost/LSTM) or falls back to heuristic*
- 📊 **Prediction History** – View recent predictions with confidence intervals and directions
- 🌍 **Market Sentiment Analysis** – Real-time news aggregation + keyword-based sentiment scoring
  - *Displays overall market trend (bullish/bearish/neutral)*
  - *Per-symbol sentiment with article count and top headlines*
- 📈 **Market Outlook** – Daily trading signals for Forex & Commodities with TP/SL
- 🧠 **ML Model Infrastructure** – Training scripts (Python) for LSTM & XGBoost, feature engineering pipeline
- 💾 **Data Pipeline** – Automated OHLC fetching (Finnhub + Massive) → Indicators calculation → Prediction generation
- 📥 **Finnhub Integration** – `/api/finnhub/fetch` populates crypto/forex/commodities OHLC data
- 📥 **Massive Integration** – `/api/massive/fetch` populates US stocks OHLC data (Pro feature)
- 🔄 **Auto Indicator Calculation** – Indicators auto-computed during prediction if not present
- 🔙 **UX Navigation** – Back to Dashboard button on Quant AI and Sentiment pages

**Signup & Auth:**
- Enhanced signup form with name & phone number
- Login flow with 2FA verification
- 2FA management page at `/2fa`

### 🚧 Coming Soon (Quant AI Roadmap)
- **Phase 1: Market Prediction Engine**
  - LSTM, XGBoost, Random Forest models
  - 1h / 4h / 1d price predictions
  - Feature importance analysis
- **Phase 2: Smart Signals**
  - AI-generated signals (technical + sentiment)
  - Confidence scoring & risk-adjusted position sizing
- **Phase 3: Portfolio Optimization**
  - Efficient frontier, risk parity, Monte Carlo simulations
- **Phase 4: Backtesting Lab**
  - Strategy backtesting, Sharpe/Sortino metrics, walk-forward optimization

### 📋 Implementation History

**v2.2 – US Stocks Expansion & Landing Live Price (Latest)**
- ✅ US Stock data integration via Massive.com API (AAPL, AMD, NVDA, MSFT, GOOGL)
- ✅ `/api/massive/fetch` endpoint for fetching US stock OHLC & indicators
- ✅ Updated cron job to fetch both crypto/forex (Finnhub) and US stocks (Massive) daily
- ✅ Added `MASSIVE_API_KEY` environment variable support
- ✅ XAUT live price & signal widget on landing page (auto-refresh 30s)
- ✅ Extended Quant AI predictions support to US stocks
- ✅ Updated watchlist and symbol coverage in documentation

**v2.1 – Quant AI & Market Sentiment**
- ✅ Prediction database model + Prisma integration
- ✅ `/api/quant-ai/predict` endpoint for generating & storing predictions
- ✅ `/api/quant-ai/predictions` endpoint for fetching recent predictions
- ✅ Market Sentiment API + UI component (`/api/market-sentiment`, `MarketSentiment.tsx`)
- ✅ Prediction training scripts (Python: TensorFlow, XGBoost) in `scripts/`
- ✅ Feature data pipeline (OHLC, indicators) and model trainer infrastructure
- ✅ Auto-calculate indicators during prediction if missing (`/api/indicators/calculate`)
- ✅ Real-time news sentiment via Finnhub with keyword-based scoring
- ✅ User attribution for predictions (userId stored with each prediction)
- ✅ Finnhub API integration: `/api/finnhub/fetch` for automated OHLC & indicator data collection
- ✅ Navigation: Added "Back to Dashboard" button on Quant AI page
- ✅ Prisma schema fix: added `Prediction` model (resolved missing type error)
- ✅ TypeScript fixes: nullable indicators, Prisma naming, interfaces, route structure
- ✅ ML model inference integration (via Python subprocess) with heuristic fallback

**v2.0 – UX Revolution**
- ✅ Notification Center with real-time updates via polling
- ✅ High Contrast Mode for accessibility (WCAG)
- ✅ First-Time User Onboarding tour (Framer Motion)
- ✅ Tooltips throughout the interface
- ✅ Real-time auto-refresh for dashboard trades
- ✅ Enhanced visual polish with animations

**v1.2 – Security & Device Sync**
- ✅ Watchlist sync (cross-device persistence)
- ✅ Two-Factor Authentication (2FA) with TOTP
- ✅ 2FA setup & management page at `/2fa`
- ✅ Login flow with 2FA verification

**v1.1 – Trading Signals & Monetization**
- ✅ Trading Signals restricted to Pro users
- ✅ WhatsApp payment integration for upgrades
- ✅ Professional landing page copy
- ✅ Enhanced signup (name, phone)
- ✅ Resend email integration
- ✅ Full theme-aware landing page (light/dark mode)

**v1.0 – Core Platform**
- ✅ User authentication (JWT + email verification)
- ✅ Multi-pair live charts (XAUT, BTC, ETH, SOL, XRP)
- ✅ Market Outlook & Trading Signals
- ✅ Economic Calendar (Finnhub)
- ✅ Trading Journal with TP/SL auto-close
- ✅ Responsive design + Dark mode
- ✅ CoinMarketCap API integration

**v1.0 – Core Platform**
- ✓ Multi-pair live charts
- ✓ Market Outlook & signals
- ✓ Economic Calendar
- ✓ Trading Journal with TP/SL auto-close
- ✓ User authentication (JWT + email verification)
- ✓ Responsive design with dark mode

---

## 🖥️ Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page – info, stats, CTA |
| `/dashboard` | Main trading dashboard (protected) |
| `/market` | Market overview & signals (Pro gated) |
| `/quant-ai` | Quant AI product page & roadmap |
| `/pricing` | Subscription plans (Free / Pro) |
| `/payment` | Payment integration (WhatsApp) |
| `/login` | Authentication (login/register with 2FA) |
| `/2fa` | Two-Factor Authentication management |
| `/economic-calendar` | Economic events calendar (Finnhub) |
| `/trading-journal` | Personal trade journal & analytics |

## 🔌 API Endpoints (Quant AI)

### ML & Predictions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quant-ai/predict` | POST | Generate AI prediction (auto-calculates indicators if missing). Body: `{ symbol, timeframe }` |
| `/api/quant-ai/predictions` | GET | Fetch recent predictions. Query: `?symbol=BTC&limit=10` |
| `/api/quant-ai/train` | POST | Trigger model training (Pro users). Body: `{ symbol, timeframe }` |
| `/api/quant-ai/backtest` | POST | Run backtest. Body: `{ symbol, timeframe, initialCapital? }` |

### Data Collection
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/finnhub/fetch` | POST | Fetch OHLC from Finnhub (crypto/forex/commodities) & auto-calc indicators. Body: `{ symbol, timeframe, count? }` |
| `/api/finnhub/status` | GET | Check Finnhub data status. Query: `?symbol=BTC&timeframe=1h` |
| `/api/massive/fetch` | POST | Fetch US stock OHLC from Massive.com (AAPL, AMD, NVDA, MSFT, GOOGL). Body: `{ symbol, timeframe, count? }` |
| `/api/massive/status` | GET | Check US stock data status. Query: `?symbol=AAPL&timeframe=1h` |
| `/api/indicators/calculate` | POST | Manually calculate indicators from OHLC. Body: `{ symbol, timeframe, limit? }` |
| `/api/indicators/calculate` | GET | Check indicator coverage. Query: `?symbol=BTC&timeframe=1h` |

### Sentiment & News
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market-sentiment` | GET | Aggregate sentiment. Query: `?symbol=BTC` |
| `/api/sentiment` | GET | Per-symbol sentiment with news. Query: `?symbol=BTC&period=1d` |

---

## 🔧 Local Development

### 1. Clone & Install

```bash
git clone https://github.com/kelvinc997z-tech/trading-dashboard.git
cd trading-dashboard
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in required variables:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Strong random string for signing JWTs |
| `RESEND_API_KEY` | API key from Resend dashboard |
| `RESEND_VERIFY_URL` | Frontend verify URL (e.g. `http://localhost:3000/api/auth/verify`) |
| `DATABASE_URL` | `file:./dev.db` for SQLite dev; Postgres URL for production |
| `COINMARKETCAP_API_KEY` | CoinMarketCap Pro API key for real-time crypto prices (required for live data) |
| `FINNHUB_API_KEY` | Finnhub API key for fetching OHLC data and indicators (optional but recommended for Quant AI) |
| `MASSIVE_API_KEY` | Massive.com API key for US stocks data (AAPL, AMD, NVDA, MSFT, GOOGL) – Pro feature |

### 3. Initialize Database

```bash
npm run db:push   # Create tables
npm run db:seed   # (Optional) Seed test users
```

### 4. (Optional) Train ML Models

If you want real ML predictions instead of heuristics:

```bash
cd scripts
pip install -r requirements.txt
python train_models.py --symbol BTC --timeframe 1h --limit 5000
# Repeat for other symbols: ETH, SOL, etc.
```

This creates model files in `models/` directory. Copy them to your project root.

### 5. Run Dev Server

```bash
npm run dev
```

Open http://localhost:3000

---

## ☁️ Deploy to Vercel

1. Push to this repo (Vercel auto-deploy on push to `main`)
2. Or manual deploy:
   ```bash
   vercel --prod
   ```
3. Set environment variables in Vercel Dashboard (Settings → Environment Variables)

Ensure you add:
- `JWT_SECRET`
- `RESEND_API_KEY`
- `RESEND_VERIFY_URL` (your production verify endpoint)
- `DATABASE_URL` (Postgres connection string)

---

## 👥 Test Accounts (bypass verification)

| Email | Password | Role |
|-------|----------|------|
| `admin@test.com` | `password123` | Free |
| `trader@test.com` | `password123` | Free |
| `pro@test.com` | `password123` | Pro |
| `pro2@test.com` | `password123` | Pro |
| `vip@test.com` | `password123` | Pro |
| `gold@test.com` | `password123` | Pro |

All test accounts skip email verification.

---

## 📁 Project Structure

```
trading-dashboard/
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Seed script for test users
├── src/
│   ├── app/
│   │   ├── api/        # Backend routes (auth, trades, market-data, etc.)
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── market/
│   │   ├── pricing/
│   │   ├── payment/
│   │   ├── quant-ai/   # Quant AI roadmap page
│   │   └── page.tsx    # Landing page
│   ├── components/     # Reusable UI (Navbar, Charts, MarketOutlook)
│   └── lib/            # Utilities (auth, db, mail)
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

---

## 🧠 About Quant AI

Quant AI is our upcoming machine learning engine designed to:

- Predict price movements across multiple timeframes
- Generate high-confidence trading signals
- Optimize portfolio allocations using modern portfolio theory
- Provide backtesting lab for strategy validation

### 🏗️ Architecture

1. **Data Layer**: OHLC + technical indicators stored in Prisma
2. **Training**: Python scripts (`scripts/train_models.py`) train LSTM & XGBoost models
3. **Inference**: Node.js calls Python subprocess (`scripts/inference.py`) for predictions
4. **Fallback**: Heuristic-based predictions if models unavailable

### 🎓 Training Models (Local Development)

#### Prerequisites
```bash
cd scripts
pip install -r requirements.txt
```

#### Train a Model
```bash
python train_models.py --symbol BTC --timeframe 1h --limit 5000
```

This generates model files:
- `models/BTC-1h/xgb_model.json` (XGBoost)
- `models/BTC-1h/lstm_model.h5` (TensorFlow)

#### Deploy Models
Copy the `models/` directory to your Vercel project (add to git or upload via Vercel dashboard). The inference script will automatically use them.

If no model exists, the system falls back to heuristic predictions.

### 📊 Prediction Flow

1. **Fetch data**: `POST /api/finnhub/fetch` (populates OHLC)
2. **Calculate indicators**: Automatic on first prediction (or manual via `/api/indicators/calculate`)
3. **Generate prediction**: `POST /api/quant-ai/predict`
   - Loads ML model if available
   - Runs inference on feature vector
   - Saves prediction to DB
4. **View history**: `GET /api/quant-ai/predictions` or `/dashboard/predictions`

We're building it in the open. Track progress on the `/quant-ai` page or in the [GitHub Issues](https://github.com/kelvinc997z-tech/trading-dashboard/issues).

### 🔧 Troubleshooting Quant AI

**Problem**: Prediction returns "Insufficient historical data"
- **Solution**: Fetch OHLC data first via `POST /api/finnhub/fetch` with sufficient `count` (e.g., 500 or 1000)

**Problem**: Indicators not being calculated
- **Solution**: The predict endpoint auto-calculates indicators. If it fails, manually trigger `POST /api/indicators/calculate`

**Problem**: Prediction always falls back to heuristic
- **Solution**: Ensure model files exist in `./models/SYMBOL-TIMEFRAME/` (e.g., `models/BTC-1h/xgb_model.json`). Check server logs for inference errors.

**Problem**: Python inference fails on Vercel
- **Solution**: Vercel serverless environment may not support `child_process`. Consider:
  - Using ONNX runtime in Node.js (no Python dependency)
  - Deploying inference as separate API route using Python runtime
  - Using Vercel Cron/Serverless Functions with Python support (if available)

**Problem**: Finnhub fetch returns no data
- **Solution**: Verify `FINNHUB_API_KEY` is set and valid. Check rate limits (free tier: 60 calls/min). Ensure symbol format is correct (e.g., "BTC", "ETH", not "BTC/USD").

---

## ⏱️ Automated Data Fetching (Cron Jobs)

Vercel Hobby plan only allows **daily** cron jobs. To fetch data more frequently (e.g., hourly), use an **external free cron service**:

### **Option A: External Cron (Recommended - Free)**

1. **Set CRON_SECRET** in Vercel environment variables:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add `CRON_SECRET` with a random string (e.g., `openssl rand -hex 32`)
   - Redeploy

2. **Use a free cron provider**:
   - [cron-job.org](https://cron-job.org) (free, 5 jobs)
   - [EasyCron](https://www.easycron.com) (free tier)
   - [Cronhub](https://cronhub.io) (free tier)
   - [GitHub Actions](https://github.com/features/actions) (free with limits)

3. **Configure the cron job**:
   - URL: `https://your-app.vercel.app/api/cron/fetch-ohlc`
   - Method: POST
   - Schedule: `0 * * * *` (every hour) or `*/30 * * * *` (every 30 min)
   - Headers: `x-vercel-cron-secret: YOUR_SECRET_HERE`
   - Timeout: 60 seconds

4. **Test the endpoint**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/fetch-ohlc \
     -H "x-vercel-cron-secret: YOUR_SECRET_HERE"
   ```

### **Option B: Vercel Pro (Paid)**
- Upgrade to Vercel Pro ($20/month)
- Set `vercel.json` crons with any schedule (e.g., `0 * * * *` for hourly)
- No external service needed

### **Monitor Cron Runs**
Check latest fetch status:
```bash
GET /api/cron/fetch-ohlc
```
Returns last 10 runs with success/failure counts.

---

## 📝 License

MIT – feel free to fork and adapt.

---

## 📝 License

MIT – feel free to fork and adapt.

---

## 🙌 Credits

Built with ❤️ by Klepon Team.  
Questions? Reach out via [GitHub Issues](https://github.com/kelvinc997z-tech/trading-dashboard/issues).

# rebuild
 
