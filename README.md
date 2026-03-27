# Trading Dashboard

Professional trading signals and analysis platform with real-time market data, technical indicators, and subscription-based access.

## 🚀 Features

### Core Functionality
- **Real-time Market Data** for 14+ trading pairs (crypto, forex, commodities, stocks, indices)
- **Automated Trading Signals** with entry, take-profit, and stop-loss levels
- **Technical Indicators** - RSI, MACD, SMAs, and custom algorithms
- **Live Charts** powered by TradingView
- **Signal Management** - track, filter, and close signals
- **Performance Analytics** - win rate, risk/reward metrics

### Pairs Supported
**Crypto & Commodities:**
- XAUUSD (Gold)
- USOIL (WTI Crude Oil)
- BTC/USD (Bitcoin)
- ETH/USD (Ethereum)
- SOL/USD (Solana)
- XRP/USD (Ripple)
- KAS/USDT (Kaspa)

**Stocks & Indices:**
- NASDAQ (^IXIC)
- S&P 500 (^GSPC)
- AAPL (Apple)
- NVDA (NVIDIA)
- AMD
- GOOGL (Alphabet/Google)
- TSM (Taiwan Semiconductor)

### Subscription Plans
- **Free Plan:**
  - 3 trading pairs (XAUUSD, USOIL, BTC/USD)
  - 15-minute delayed data
  - Basic technical indicators
  - Email support
  - 7-day signal history

- **Pro Plan** ($29/month or $290/year):
  - All 14 trading pairs
  - Real-time market data
  - Advanced technical indicators
  - CSV export
  - Priority support
  - 90-day signal history
  - Custom alerts
  - API access
  - **7-day free trial**

### Authentication & Security
- Email/password registration with verification
- Google OAuth login
- Microsoft OAuth (optional)
- JWT-based sessions
- Secure payment processing via Stripe
- 256-bit SSL encryption

### Email Notifications (Resend)
- Email verification
- Welcome email with trial info
- Trial expiry reminders (3 days before)
- Subscription activation receipts
- Payment failure notifications
- Subscription cancellation confirmations

---

## 🏗️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18

**Backend & APIs:**
- Next.js API Routes
- NextAuth.js v4
- Stripe (payments & subscriptions)
- Alpha Vantage (market data)
- TradingView Widget (charts)

**Email:**
- Resend (transactional emails)

**Authentication:**
- NextAuth.js
- bcryptjs (password hashing)
- JWT tokens

**Hosting:**
- Vercel

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/trading-dashboard.git
   cd trading-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.local.example` to `.env.local` and fill in the values:

   ```env
   # Authentication
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_MONTHLY=price_...
   STRIPE_PRICE_YEARLY=price_...

   # Email (Resend)
   RESEND_API_KEY=re_...
   RESEND_FROM=Trading Dashboard <noreply@yourdomain.com>

   # Market Data (optional)
   ALPHA_VANTAGE_API_KEY=LNXV031DKP89QGG9

   # Admin
   ADMIN_SECRET_KEY=your-admin-secret
   ```

4. **Set up Stripe**
   - Create products and prices in Stripe Dashboard ($29/month, $290/year)
   - Set up webhook endpoint to `/api/webhooks/stripe` with events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

5. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard (Production)
4. Deploy

### Quick Deploy Script

```bash
./deploy.sh
```

This script will:
- Commit pending changes
- Push to GitHub
- Check environment variables
- Deploy to Vercel

---

## 📊 Project Structure

```
trading-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/      # NextAuth.js handlers
│   │   ├── market-data/             # Real-time price feeds
│   │   ├── technical-indicators/    # RSI, MACD, SMAs
│   │   ├── generate-signals/        # Signal generation
│   │   ├── create-checkout-session/ # Stripe checkout
│   │   ├── webhooks/stripe/         # Stripe webhooks
│   │   ├── subscription/            # Get user subscription
│   │   ├── cancel-subscription/     # Cancel via billing portal
│   │   ├── email-capture/           # Waitlist email capture
│   │   ├── verify-email/            # Email verification
│   │   └── admin/check-trials/      # Trial monitoring (admin)
│   ├── dashboard/page.tsx           # Main dashboard (protected)
│   ├── account/page.tsx             # Account settings (protected)
│   ├── pricing/page.tsx             # Pricing comparison
│   ├── login/page.tsx               # Login page
│   ├── register/page.tsx            # Registration page
│   └── page.tsx                     # Landing page (public)
├── components/
│   ├── Header.tsx                   # Navigation header
│   ├── TradingViewChart.tsx         # Chart component
│   ├── SignalTable.tsx              # Signal table
│   ├── SignalTabs.tsx               # Signal filter tabs
│   ├── LiveStats.tsx                # CountUp & LiveCounter
│   ├── ShareButtons.tsx             # Social share
│   └── CountdownTimer.tsx           # Countdown timer
├── lib/
│   ├── db.ts                        # Database operations
│   ├── email.ts                     # Email templates & sender
│   ├── mockData.ts                  # Fallback data
│   └── signalUtils.ts               # Signal utilities
├── middleware.ts                    # Auth middleware
├── scripts/
│   ├── check-env.js                 # Environment validator
│   ├── trial-monitor.js             # Trial monitoring
│   └── run-trial-check.sh           # Manual trial check
├── data/                            # Persistent storage (git-ignored)
│   ├── users.json
│   ├── market_data_cache.json
│   └── email_captures.json
├── .env.local                       # Local environment (git-ignored)
├── .env.local.example               # Example env vars
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ Data Storage

Uses file-based JSON storage in the `data/` directory:

- `users.json` - User accounts, subscriptions, trials
- `market_data_cache.json` - Cached market data for free users (15 min TTL)
- `email_captures.json` - Waitlist email captures

**Note:** This is suitable for small-scale deployments. For production with many users, consider migrating to PostgreSQL/MySQL.

---

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `./deploy.sh` | Quick deploy to Vercel |
| `./debug-build.sh` | Debug build errors |
| `./scripts/run-trial-check.sh` | Manual trial monitoring |

---

## 🧪 Testing

### Manual Testing

1. **Landing Page**
   - Visit `/`
   - Test waitlist form
   - Test social share buttons
   - Check countdown timer

2. **Registration**
   - Go to `/register`
   - Create account
   - Verify email (check Resend logs)
   - Should redirect to dashboard

3. **Login**
   - Use credentials at `/login`
   - Or Google OAuth
   - Should redirect to `/dashboard`

4. **Trial**
   - New accounts get 7-day trial
   - Check `/account` shows "Trial" badge
   - After trial expires → downgrade to Free

5. **Upgrade**
   - Go to `/pricing`
   - Select plan (monthly/yearly)
   - Use test card: `4242 4242 4242 4242`
   - Check webhook triggers → Pro status

6. **Dashboard**
   - View 14 pairs (if Pro) or 3 pairs (if Free)
   - Check signals generated
   - Test chart loading
   - Verify auto-close logic

### API Testing

```bash
# Protected endpoint (requires auth)
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://your-app.vercel.app/api/market-data

# Email capture
curl -X POST https://your-app.vercel.app/api/email-capture \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"test"}'

# Admin: get email captures
curl -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  https://your-app.vercel.app/api/email-capture

# Trial check (admin)
curl -X POST -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  https://your-app.vercel.app/api/admin/check-trials
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT (generate: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Production URL (e.g., `https://your-app.vercel.app`) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (sk_test_ or sk_live_) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `STRIPE_PRICE_MONTHLY` | Yes | Stripe price ID for monthly plan |
| `STRIPE_PRICE_YEARLY` | Yes | Stripe price ID for yearly plan |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `RESEND_FROM` | No | Sender email for Resend |
| `ADMIN_SECRET_KEY` | No | Admin API access key |
| `ALPHA_VANTAGE_API_KEY` | No | Alpha Vantage API key (optional, for real market data) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

---

## 🐛 Troubleshooting

### Build Errors

If Vercel build fails with cached errors:

1. Clear build cache (Vercel Pro) or wait for reset
2. Run locally: `./debug-build.sh`
3. Check TypeScript errors: `npx tsc --noEmit`

### Common Issues

| Issue | Solution |
|-------|----------|
| "Module not found: next-auth/providers/microsoft" | Microsoft provider temporarily disabled. Use Google OAuth only or install proper package. |
| Email not sending | Set `RESEND_API_KEY` and verify domain in Resend dashboard |
| Stripe webhook not working | Ensure endpoint URL matches exactly and events are selected |
| OAuth callback error | Check redirect URIs in Google/Microsoft console |
| Trial not expiring | Run cron manually: `./scripts/run-trial-check.sh` |

---

## 📈 Future Enhancements

- [ ] Microsoft OAuth support (when properly configured)
- [ ] Full mobile app with React Native
- [ ] Advanced backtesting engine
- [ ] Community/Discussion forum
- [ ] API key system for third-party integrations
- [ ] Multi-language support (i18n)
- [ ] Dark/Light theme toggle persistence
- [ ] Push notifications for signals
- [ ] Advanced risk management tools
- [ ] Social trading (copy trades)

---

## 📄 License

Proprietary - All rights reserved

---

## 👤 Author

Kelvin - Trading Dashboard Project

---

## 🙏 Acknowledgments

- TradingView for charting widgets
- Alpha Vantage for market data
- Stripe for payment processing
- Resend for email delivery
- Vercel for hosting
- Next.js team for the amazing framework

---

**Built with ❤️ for traders worldwide**
