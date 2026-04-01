# Trading Dashboard

This project is a dashboard for tracking various financial markets, including cryptocurrencies, forex, and US stocks.

## Features

- Real-time (or near real-time) price updates for selected assets.
- Integration with multiple financial data providers.

## Supported Assets

### US Stocks
- Apple Inc. (AAPL)
- Advanced Micro Devices, Inc. (AMD)
- NVIDIA Corporation (NVDA)
- Microsoft Corporation (MSFT)
- Alphabet Inc. (GOOGL)

### Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- Ripple (XRP)
*(This list can be expanded)*

### Forex
- EUR/USD
- GBP/USD
- USD/JPY
*(This list can be expanded)*

## Setup

1. Clone the repository.
2. Install dependencies: \`npm install\`
3. Create a \`.env\` file based on \`.env.example\`.
4. Populate \`.env\` with your API keys:
    - \`MASSIVE_API_KEY\`
    - \`COINMARKETCAP_API_KEY\` (optional, falls back to CoinGecko)
    - \`FINNHUB_API_KEY\` (if used elsewhere)
    - \`RESEND_API_KEY\`
    - \`DATABASE_URL\`
    - \`JWT_SECRET\`
    - \`CRON_SECRET\`
5. Run the development server: \`npm run dev\`

## Cron Job

The script \`scripts/fetch-market-data.ts\` is responsible for fetching market data periodically. Ensure your environment variables are correctly set for all data sources.

## API Endpoints

- \`/api/market-data\` (Existing endpoint for crypto/forex - This might need to be updated or re-routed)
- \`/api/massive-fetch\` (New endpoint for US Stocks via Massive.com)

## Contributing

Contributions are welcome! Please follow the standard contribution guidelines.
