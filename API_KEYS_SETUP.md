# 🚀 Setup API Keys for Vercel Deployment

## API Keys yang Dibutuhkan

| Variable | Purpose | Get From |
|----------|---------|----------|
| `COINMARKETCAP_API_KEY` | Crypto prices & signals | [CoinMarketCap Pro](https://pro.coinmarketcap.com/) |
| `MASSIVE_API_KEY` | US Stock data (AAPL, NVDA, etc.) | [Massive API](https://massive-api.com/) |
| `FINNHUB_API_KEY` (optional) | News & sentiment | [Finnhub](https://finnhub.io/) |
| `COINGLASS_API_KEY` (optional) | Alternative OHLC data | [Coinglass](https://coinglass.com/) |

## Cara 1: Via Vercel Dashboard (Rekomendasi)

1. Buka: https://vercel.com/kelvinc997z-tech/trading-dashboard/settings/environment-variables
2. Klik "Add New" untuk setiap variable:
   - Name: `COINMARKETCAP_API_KEY` → Value: [isi key Anda]
   - Name: `MASSIVE_API_KEY` → Value: [isi key Anda]
   - (Optional) `FINNHUB_API_KEY` → Value: [isi key]
3. Pilih environment: **Production**
4. Klik "Add" / "Save"
5. **Redeploy** project dari dashboard atau push commit dummy

## Cara 2: Via Shell Script

```bash
cd trading-dashboard
./setup-vercel-env.sh
```

Script akan meminta API keys dan menambahkan otomatis via Vercel CLI.

## Cara 3: Manual Vercel CLI

```bash
# Login first if not yet
vercel login

# Add each variable
vercel env add COINMARKETCAP_API_KEY production
# Paste your key when prompted

vercel env add MASSIVE_API_KEY production
# Paste your key when prompted
```

## Setelah API Keys Ditambahkan

1. **Redeploy** agar environment variables termuat:
   ```
   vercel --prod
   ```
   Atau push commit baru ke GitHub (auto-deploy)

2. **Test** endpoint Initialize:
   - `https://your-app.vercel.app/api/market-data?symbol=BTC&timeframe=1h`
   - `https://your-app.vercel.app/api/market-signals`

3. Cek logs di Vercel untuk pastikan tidak ada error "API key not set"

## 🔍 Troubleshooting

**Error: "MASSIVE_API_KEY is not set"**
- Key belum ditambahkan ke Vercel
- Setelah tambah, **redeploy**该项目

**Error: CMC 429/403**
- API key mungkin tidak valid atau limit exceeded
- Cek di CoinMarketCap dashboard: https://pro.coinmarketcap.com/account

**Error: Finnhub 401**
- API key expired atau tidak ada
- Get free key at https://finnhub.io/register

**Build error: "request.url" warning**
- Ini normal, bukan error. Route `/api/market-outlook` dynamic.

---

## 📊 Expected Behavior After Setup

✅ `/api/market-data` akan fetch dari CoinMarketCap (crypto) dan Massive (stocks)  
✅ `/api/market-signals` akan generate signals real dengan price data  
✅ Dashboard akan show harga real-time untuk semua pair  
✅ Signals akan memiliki confidence levels dan SL/TP otomatis

---

**Jika ada issues, cek Vercel Function Logs untuk error detail.**
