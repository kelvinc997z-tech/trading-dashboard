# Trading Dashboard

Real-time trading signals dashboard with live market data, candlestick charts, and signal tracking.

## Features

- **Real-time Market Data**: Simulated live prices for XAUUSD (Gold) and US Oil (WTI)
- **TradingView-style Candlestick Chart** using Lightweight Charts
- **Signal Table**: Displays BUY/SELL signals with Entry, TP, SL
- **Dark/Light Mode**: Toggle via header button
- **Responsive Design**: Works on desktop and mobile
- **Statistics**: Total signals, win rate, active signals count

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lightweight Charts** (TradingView)
- **Lucide React Icons**

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Development server
npm run dev
# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this repository to GitHub
2. Import project in Vercel
3. Vercel auto-detects Next.js and deploys
4. (Optional) Add custom domain

No environment variables required.

## Project Structure

```
/components
  - Header.tsx          # App header with theme toggle
  - ThemeProvider.tsx   # next-themes wrapper
  - ChartPanel.tsx      # Candlestick chart component
  - SignalTable.tsx     # Signals data table
/app
  - layout.tsx          # Root layout with ThemeProvider
  - page.tsx            # Main dashboard page
  - globals.css         # Global styles
/lib
  - mockData.ts         # Simulated market data generator
```

## Customization

- **Real API integration**: Replace `lib/mockData.ts` with real market data fetch (e.g., from TradingView, Alpaca, etc.)
- **Add more symbols**: Extend `basePrices` in `mockData.ts`
- **Change refresh rate**: Adjust `setInterval` duration in `app/page.tsx`
- **Styling**: Modifikasi Tailwind classes or extend `tailwind.config.ts`

## Notes

- Data is simulated for demo purposes. Prices update every 3 seconds.
- Signals are randomly generated. For production, connect to your signal engine or database.
- The candlestick chart generates random OHLC data based on current price.

## License

MIT