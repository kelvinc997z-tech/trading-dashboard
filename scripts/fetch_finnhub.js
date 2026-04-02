/**
 * Fetch historical OHLC data from Finnhub API and compute indicators
 * Usage: node scripts/fetch_finnhub.js <symbol> <timeframe> [outputDir]
 * Example: node scripts/fetch_finnhub.js BTC 1h data
 */

require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Simple TA calculations (no external deps)
function calculateRSI(close, period = 14) {
  if (close.length < period + 1) return close.map(() => 50);
  
  const changes = [];
  for (let i = 1; i < close.length; i++) {
    changes.push(close[i] - close[i-1]);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  
  const avgGain = [];
  const avgLoss = [];
  
  // First values
  let sumGain = gains.slice(0, period).reduce((a,b) => a+b, 0);
  let sumLoss = losses.slice(0, period).reduce((a,b) => a+b, 0);
  avgGain[period-1] = sumGain / period;
  avgLoss[period-1] = sumLoss / period;
  
  // Rest
  for (let i = period; i < changes.length; i++) {
    sumGain = (avgGain[i-1] * (period-1) + gains[i]) / period;
    sumLoss = (avgLoss[i-1] * (period-1) + losses[i]) / period;
    avgGain[i] = sumGain;
    avgLoss[i] = sumLoss;
  }
  
  const rsi = [];
  for (let i = period-1; i < close.length; i++) {
    if (avgLoss[i-period+1] === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain[i-period+1] / avgLoss[i-period+1];
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }
  
  // Pad with NaN for first period-1 values
  return [...Array(period-1).fill(null), ...rsi];
}

function calculateSMA(data, period) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a,b) => a+b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

function calculateEMA(data, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // First value is SMA
  let currentSMA = data.slice(0, period).reduce((a,b) => a+b, 0) / period;
  ema.push(currentSMA);
  
  for (let i = period; i < data.length; i++) {
    currentSMA = (data[i] - ema[i-1]) * multiplier + ema[i-1];
    ema.push(currentSMA);
  }
  
  return [...Array(period-1).fill(null), ...ema];
}

function calculateMACD(close, fast=12, slow=26, signal=9) {
  const emaFast = calculateEMA(close, fast);
  const emaSlow = calculateEMA(close, slow);
  const macdLine = emaFast.map((v,i) => v - emaSlow[i]);
  const signalLine = calculateEMA(macdLine.filter(v => v !== null), signal);
  
  // Align lengths
  const nullCount = fast - 1 + slow - 1;
  const paddedSignal = [...Array(nullCount).fill(null), ...signalLine];
  
  const histogram = macdLine.map((v,i) => v - paddedSignal[i]);
  
  return {
    macd: macdLine,
    signal: paddedSignal,
    hist: histogram
  };
}

function calculateATR(high, low, close, period=14) {
  const tr = [];
  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      tr.push(high[i] - low[i]);
    } else {
      const tr1 = high[i] - low[i];
      const tr2 = Math.abs(high[i] - close[i-1]);
      const tr3 = Math.abs(low[i] - close[i-1]);
      tr.push(Math.max(tr1, tr2, tr3));
    }
  }
  
  const atr = calculateSMA(tr, period);
  return atr;
}

function calculateBollingerBands(close, period=20, stdDev=2) {
  const sma = calculateSMA(close, period);
  const upper = [];
  const lower = [];
  
  for (let i = period-1; i < close.length; i++) {
    const slice = close.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const std = Math.sqrt(slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period);
    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
  }
  
  return {
    upper: [...Array(period-1).fill(null), ...upper],
    middle: sma,
    lower: [...Array(period-1).fill(null), ...lower]
  };
}

function calculateADX(high, low, close, period=14) {
  // Simplified ADX calculation
  const tr = [];
  const dmPlus = [];
  const dmMinus = [];
  
  for (let i = 1; i < close.length; i++) {
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i-1]);
    const tr3 = Math.abs(low[i] - close[i-1]);
    tr.push(Math.max(tr1, tr2, tr3));
    
    const upMove = high[i] - high[i-1];
    const downMove = low[i-1] - low[i];
    
    dmPlus.push(upMove > downMove && upMove > 0 ? upMove : 0);
    dmMinus.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  // Smooth with EMA
  const trSmooth = calculateEMA(tr, period);
  const dmPlusSmooth = calculateEMA(dmPlus, period);
  const dmMinusSmooth = calculateEMA(dmMinus, period);
  
  const adx = [];
  for (let i = 0; i < trSmooth.length; i++) {
    if (trSmooth[i] === null || trSmooth[i] === 0) {
      adx.push(null);
    } else {
      const diPlus = 100 * (dmPlusSmooth[i] / trSmooth[i]);
      const diMinus = 100 * (dmMinusSmooth[i] / trSmooth[i]);
      const dx = 100 * Math.abs(diPlus - diMinus) / (diPlus + diMinus);
      adx.push(dx);
    }
  }
  
  return calculateSMA(adx.filter(v => v !== null), period);
}

function calculateStochastic(high, low, close, kPeriod=14, dPeriod=3) {
  const k = [];
  for (let i = kPeriod-1; i < close.length; i++) {
    const lookback = kPeriod;
    const h = Math.max(...high.slice(i - lookback + 1, i + 1));
    const l = Math.min(...low.slice(i - lookback + 1, i + 1));
    if (h === l) {
      k.push(50);
    } else {
      k.push(100 * (close[i] - l) / (h - l));
    }
  }
  
  const d = calculateSMA(k, dPeriod);
  
  return {
    k: [...Array(kPeriod-1).fill(null), ...k],
    d: [...Array(kPeriod-1 + dPeriod-1).fill(null), ...d]
  };
}

function calculateWilliamsR(high, low, close, period=14) {
  const wr = [];
  for (let i = period-1; i < close.length; i++) {
    const h = Math.max(...high.slice(i - period + 1, i + 1));
    const l = Math.min(...low.slice(i - period + 1, i + 1));
    if (h === l) {
      wr.push(-50);
    } else {
      wr.push(-100 * (h - close[i]) / (h - l));
    }
  }
  
  return [...Array(period-1).fill(null), ...wr];
}

function calculateCCI(high, low, close, period=20) {
  const tp = high.map((h,i) => (h + low[i] + close[i]) / 3);
  const smaTP = calculateSMA(tp, period);
  const cci = [];
  
  for (let i = period-1; i < close.length; i++) {
    const mean = smaTP[i];
    const dev = tp.slice(i - period + 1, i + 1).reduce((sum, v) => sum + Math.abs(v - mean), 0) / period;
    if (dev === 0) {
      cci.push(0);
    } else {
      cci.push((tp[i] - mean) / (0.015 * dev));
    }
  }
  
  return [...Array(period-1).fill(null), ...cci];
}

function calculateMFI(high, low, close, volume, period=14) {
  const tp = high.map((h,i) => (h + low[i] + close[i]) / 3);
  const rm = []; // raw money flow
  
  for (let i = 0; i < tp.length; i++) {
    if (i === 0) {
      rm.push(tp[i] * volume[i]);
    } else {
      const rmf = tp[i] * volume[i];
      rm.push(rmf);
    }
  }
  
  const positiveFlow = [];
  const negativeFlow = [];
  
  for (let i = 1; i < tp.length; i++) {
    if (tp[i] > tp[i-1]) {
      positiveFlow.push(rm[i]);
      negativeFlow.push(0);
    } else if (tp[i] < tp[i-1]) {
      positiveFlow.push(0);
      negativeFlow.push(rm[i]);
    } else {
      positiveFlow.push(0);
      negativeFlow.push(0);
    }
  }
  
  const mfi = [];
  for (let i = period-1; i < close.length; i++) {
    const pos = positiveFlow.slice(i - period + 1, i + 1).reduce((a,b) => a+b, 0);
    const neg = negativeFlow.slice(i - period + 1, i + 1).reduce((a,b) => a+b, 0);
    if (neg === 0) {
      mfi.push(100);
    } else {
      mfi.push(100 - (100 / (1 + pos/neg)));
    }
  }
  
  return [...Array(period-1).fill(null), ...mfi];
}

function calculateOBV(close, volume) {
  const obv = [0];
  for (let i = 1; i < close.length; i++) {
    if (close[i] > close[i-1]) {
      obv.push(obv[i-1] + volume[i]);
    } else if (close[i] < close[i-1]) {
      obv.push(obv[i-1] - volume[i]);
    } else {
      obv.push(obv[i-1]);
    }
  }
  return obv;
}

async function fetchFinnubCandles(symbol, resolution, count = 5000) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY not set');
  }
  
  // Finnhub symbol format: BTC, ETH, gold, silver, etc.
  // For crypto: BTC, ETH, XRP, etc.
  // For gold: gold (XAU/USD)
  const finnhubSymbol = symbol.toUpperCase() === 'XAUT' ? 'GOLD' : symbol.toUpperCase();
  
  // Convert timeframe to Finnhub resolution
  const resolutionMap = {
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1m': '1'
  };
  const finnhubRes = resolutionMap[resolution] || '60';
  
  // Calculate from timestamp (now - count * timeframe)
  const now = Math.floor(Date.now() / 1000);
  const secondsPerCandle = {
    '1': 60,
    '60': 3600,
    '240': 14400,
    'D': 86400
  }[finnhubRes] || 3600;
  
  const from = now - (count * secondsPerCandle);
  
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=${finnhubRes}&from=${from}&to=${now}&token=${apiKey}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Finnhub API error: ${res.status} ${err}`);
  }
  
  const data = await res.json();
  
  if (data.s !== 'ok') {
    throw new Error(`Finnhub returned no data: ${JSON.stringify(data)}`);
  }
  
  // Convert to OHLC array
  const candles = [];
  for (let i = 0; i < data.t.length; i++) {
    candles.push({
      timestamp: new Date(data.t[i] * 1000),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i]
    });
  }
  
  return candles;
}

async function fetchAndProcess(symbol, timeframe, outputDir = 'data') {
  try {
    console.log(`\n📈 Fetching ${symbol} ${timeframe} from Finnhub...`);
    const candles = await fetchFinnubCandles(symbol, timeframe, 5000);
    console.log(`   Fetched ${candles.length} candles`);
    
    if (candles.length < 100) {
      throw new Error(`Not enough data: only ${candles.length} candles`);
    }
    
    // Extract arrays for indicator calculations
    const close = candles.map(c => c.close);
    const high = candles.map(c => c.high);
    const low = candles.map(c => c.low);
    const volume = candles.map(c => c.volume);
    
    // Calculate all indicators
    console.log('   Calculating indicators...');
    const rsi = calculateRSI(close, 14);
    const { macd, signal: macdSignal, hist: macdHist } = calculateMACD(close);
    const sma20 = calculateSMA(close, 20);
    const sma50 = calculateSMA(close, 50);
    const sma200 = calculateSMA(close, 200);
    const ema12 = calculateEMA(close, 12);
    const ema26 = calculateEMA(close, 26);
    const { upper: bollingerUpper, middle: bollingerMiddle, lower: bollingerLower } = calculateBollingerBands(close);
    const atr = calculateATR(high, low, close, 14);
    const adx = calculateADX(high, low, close, 14);
    const { k: stochK, d: stochD } = calculateStochastic(high, low, close);
    const williamsR = calculateWilliamsR(high, low, close);
    const cci = calculateCCI(high, low, close);
    const mfi = calculateMFI(high, low, close, volume);
    const obv = calculateOBV(close, volume);
    
    // Build CSV rows
    const headers = [
      'timestamp','open','high','low','close','volume',
      'rsi','macd','macd_signal','macd_hist',
      'sma_20','sma_50','sma_200','ema_12','ema_26',
      'bollinger_upper','bollinger_middle','bollinger_lower',
      'atr','adx','stoch_k','stoch_d','williams_r','cci','mfi','obv'
    ];
    
    const rows = candles.map((c, idx) => {
      return [
        c.timestamp.toISOString(),
        c.open, c.high, c.low, c.close, c.volume,
        rsi[idx] ?? '',
        macd[idx] ?? '',
        macdSignal[idx] ?? '',
        macdHist[idx] ?? '',
        sma20[idx] ?? '',
        sma50[idx] ?? '',
        sma200[idx] ?? '',
        ema12[idx] ?? '',
        ema26[idx] ?? '',
        bollingerUpper[idx] ?? '',
        bollingerMiddle[idx] ?? '',
        bollingerLower[idx] ?? '',
        atr[idx] ?? '',
        adx[idx] ?? '',
        stochK[idx] ?? '',
        stochD[idx] ?? '',
        williamsR[idx] ?? '',
        cci[idx] ?? '',
        mfi[idx] ?? '',
        obv[idx] ?? ''
      ].join(',');
    });
    
    const csv = [headers.join(',')].concat(rows).join('\n');
    
    // Save
    const outputPath = path.join(outputDir);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    const filePath = path.join(outputPath, `${symbol.toLowerCase()}_${timeframe}.csv`);
    fs.writeFileSync(filePath, csv);
    
    console.log(`✓ Saved ${candles.length} rows to ${filePath}`);
    return filePath;
    
  } catch (err) {
    console.error(`❌ Failed to fetch ${symbol} ${timeframe}:`, err.message);
    return null;
  }
}

// CLI
const [,, symbol, timeframe, outputDir = 'data'] = process.argv;

if (!symbol || !timeframe) {
  console.error('Usage: node scripts/fetch_finnhub.js <symbol> <timeframe> [outputDir]');
  console.error('Example: node scripts/fetch_finnhub.js BTC 1h data');
  process.exit(1);
}

fetchAndProcess(symbol, timeframe, outputDir)
  .then(filePath => {
    if (filePath) {
      console.log('\n📊 Next step: Train model with');
      console.log(`python scripts/train.py --symbol ${symbol.toUpperCase()} --timeframe ${timeframe} --data ${filePath}`);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
