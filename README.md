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
- User registration & login with email verification
- Protected dashboard with real-time trade table
- Multi-pair live price charts (XAU/USD, BTC/USD, ETH/USD, SOL/USD, XRP/USD)
- Market Outlook component (daily signals)
- Responsive design (mobile & desktop)
- Dark mode toggle (via system preference)

### 🚧 Coming Soon (Quant AI Roadmap
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

### 📋 Next Implementation Queue
1. Economic Calendar
2. Trading Journal
3. Custom Alerts
4. Multi-Timeframe Analysis
5. Correlation Matrix
6. Sentiment Analysis (crypto/forex news)
7. Performance Analytics
8. Quant AI Engine (ML predictions)

---

## 🖥️ Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page – info, stats, CTA |
| `/dashboard` | Main trading dashboard (protected) |
| `/market` | Market overview & signals |
| `/quant-ai` | Quant AI product page & roadmap |
| `/pricing` | Subscription plans (Free / Pro) |
| `/payment` | Payment integration |
| `/login` | Authentication (login/register) |

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

| Email | Password |
|-------|----------|
| `admin@test.com` | `password123` |
| `trader@test.com` | `trader123` |

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

We're building it in the open. Track progress on the `/quant-ai` page or in the [GitHub Issues](https://github.com/kelvinc997z-tech/trading-dashboard/issues).

---

## 📝 License

MIT – feel free to fork and adapt.

---

## 🙌 Credits

Built with ❤️ by Klepon Team.  
Questions? Reach out via [GitHub Issues](https://github.com/kelvinc997z-tech/trading-dashboard/issues).
