import ky from 'ky';

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;
const US_STOCKS_API_ENDPOINT = 'http://localhost:3000/api/massive-fetch';

// Define symbols to fetch
const US_STOCK_SYMBOLS = ['AAPL', 'AMD', 'NVDA', 'MSFT', 'GOOGL'];

async function fetchUSStocks() {
  if (!MASSIVE_API_KEY) {
    console.error('MASSIVE_API_KEY is not set. Skipping US stock data fetch.');
    return { error: 'MASSIVE_API_KEY not set' };
  }
  try {
    console.log('Fetching US stock data via massive-fetch endpoint (POST)...');
    const response = await ky.post(US_STOCKS_API_ENDPOINT, {
      json: { symbols: US_STOCK_SYMBOLS },
      timeout: 30000,
    });

    if (!response.ok) {
      const errorData = await response.json() as any; // Type assertion for unknown
      throw new Error(`Failed to fetch US stocks: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json() as any; // Type assertion for unknown
    console.log('US stock data fetched and saved successfully.');
    console.log(`Summary: ${data.summary.successful} successful, ${data.summary.failed} failed`);
    return data;
  } catch (error: any) {
    console.error('Error fetching US stock data:', error.message);
    return { error: error.message };
  }
}

// Placeholder for crypto and forex
async function fetchCrypto() {
  console.log('[TODO] Crypto fetch - integrate with existing Finnhub or other API');
  return [];
}

async function fetchForex() {
  console.log('[TODO] Forex fetch - integrate with existing Finnhub or other API');
  return [];
}

async function main() {
  console.log('Starting market data fetch cron job...');

  const [usStocks, crypto, forex] = await Promise.all([
    fetchUSStocks(),
    fetchCrypto(),
    fetchForex(),
  ]);

  console.log('--- FETCH SUMMARY ---');
  console.log('US Stocks:', usStocks);
  console.log('Crypto:', crypto);
  console.log('Forex:', forex);
  console.log('--------------------');

  console.log('Market data fetch complete.');
}

main().catch(error => {
  console.error('Cron job failed to execute:', error.message);
  process.exit(1);
});
