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
- Multi-pair live price charts (XAUT, BTC, ETH, SOL, XRP)
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
- 🤖 **AI Price Predictions** – Generate forecasts for BTC, ETH, SOL, XRP, XAUT across 1h/4h/1d timeframes
- 📊 **Prediction History** – View recent predictions with confidence intervals and directions
- 🌍 **Market Sentiment Analysis** – Aggregate news sentiment across symbols with bullish/bearish/neutral trends
- 🧠 **ML Model Infrastructure** – Training scripts (Python) for LSTM & XGBoost, feature engineering pipeline, and model serving API
- 💾 **Prediction Caching** – Stored predictions with expiry, user attribution, and queryable history
- 📥 **Finnhub Data Integration** – Automated OHLC & indicator fetching via `/api/finnhub/fetch` (requires Pro)
- 🔙 **Navigation** – Back to Dashboard button on Quant AI page

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

**v2.1 – Quant AI & Market Sentiment (Latest)**
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
| `/api/finnhub/fetch` | POST | Fetch OHLC from Finnhub & auto-calc indicators. Body: `{ symbol, timeframe, count? }` |
| `/api/finnhub/status` | GET | Check data status. Query: `?symbol=BTC&timeframe=1h` |
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

### 3. Initialize Database

```bash
npm run db:push   # Create tables
npm run db:seed   # (Optional) Seed test users
```

### 4. Run Dev Server

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

---

## 📝 License

MIT – feel free to fork and adapt.

---

## 🙌 Credits

Built with ❤️ by Klepon Team.  
Questions? Reach out via [GitHub Issues](https://github.com/kelvinc997z-tech/trading-dashboard/issues).

# rebuild
 
