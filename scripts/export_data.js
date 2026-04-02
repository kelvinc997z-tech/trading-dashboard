/**
 * Export OHLC + Indicator data from Prisma to CSV for training
 * Usage: node scripts/export_data.js <symbol> <timeframe> [outputDir]
 * Example: node scripts/export_data.js BTC 1h data
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env from project root
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // fallback
}

const { PrismaClient } = require('@prisma/client');

async function exportCSV(symbol, timeframe, outputDir = 'data') {
  const db = new PrismaClient();
  
  try {
    console.log(`Fetching ${symbol} ${timeframe} from database...`);
    
    const records = await db.oHLCData.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe,
      },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        Indicator: true,
      },
    });

    if (records.length === 0) {
      console.log(`❌ No data found for ${symbol} ${timeframe}`);
      return null;
    }

    // CSV header
    const headers = [
      'timestamp','open','high','low','close','volume',
      'rsi','macd','macd_signal','macd_hist',
      'sma_20','sma_50','sma_200','ema_12','ema_26',
      'bollinger_upper','bollinger_middle','bollinger_lower',
      'atr','adx','stoch_k','stoch_d','williams_r','cci','mfi','obv'
    ];

    // Build CSV rows
    const rows = records.map(r => {
      const i = r.Indicator;
      return [
        r.timestamp.toISOString(),
        r.open, r.high, r.low, r.close, r.volume || 0,
        i?.rsi ?? '', i?.macd ?? '', i?.macdSignal ?? '', i?.macdHist ?? '',
        i?.sma20 ?? '', i?.sma50 ?? '', i?.sma200 ?? '',
        i?.ema12 ?? '', i?.ema26 ?? '',
        i?.bollingerUpper ?? '', i?.bollingerMiddle ?? '', i?.bollingerLower ?? '',
        i?.atr ?? '', i?.adx ?? '',
        i?.stochK ?? '', i?.stochD ?? '',
        i?.williamsR ?? '', i?.cci ?? '', i?.mfi ?? '', i?.obv ?? ''
      ].join(',');
    });

    const csv = [headers.join(',')].concat(rows).join('\n');

    // Ensure output directory exists
    const outputPath = path.join(outputDir);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const filePath = path.join(outputPath, `${symbol.toLowerCase()}_${timeframe}.csv`);
    fs.writeFileSync(filePath, csv);
    
    console.log(`✓ Exported ${records.length} rows to ${filePath}`);
    return filePath;
    
  } finally {
    await db.$disconnect();
  }
}

// CLI
const [,, symbol, timeframe, outputDir = 'data'] = process.argv;

if (!symbol || !timeframe) {
  console.error('Usage: node scripts/export_data.js <symbol> <timeframe> [outputDir]');
  console.error('Example: node scripts/export_data.js BTC 1h data');
  process.exit(1);
}

exportCSV(symbol, timeframe, outputDir)
  .then(filePath => {
    if (filePath) {
      console.log(`\nNext step: Train model with`);
      console.log(`python scripts/train.py --symbol ${symbol.toUpperCase()} --timeframe ${timeframe} --data ${filePath}`);
    }
  })
  .catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
  });
