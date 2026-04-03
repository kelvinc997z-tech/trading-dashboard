# Quant AI - Quick Start Training Guide

## Status

✅ **Training Pipeline Ready** - Works with synthetic data for demo and real CSV for production.

## Files Created

| Script | Purpose |
|--------|---------|
| `scripts/train_simple.py` | Train XGBoost model (works with small/any data) |
| `scripts/inference_from_model.py` | Test model predictions locally |
| `scripts/export_ohlc_from_coingecko.py` | Fetch OHLC from CoinGecko API (limited) |
| `scripts/export_ohlc_from_db.py` | Export from PostgreSQL (needs DB access) |

**Model Output**: `models/{SYMBOL}-{TIMEFRAME}/`
- `xgboost_model.joblib` - Trained model
- `feature_names.json` - Feature order
- `feature_importance.csv` - Importance ranking

---

## Option 1: Quick Demo (Synthetic Data)

Cukup 30 detik, tanpa butuh data nyata:

```bash
cd ~/.openclaw/workspace/trading-dashboard

# Activate venv
source .venv/bin/activate  # Linux/Mac
# atau .venv\Scripts\activate  # Windows

# Train with synthetic data (1000 samples)
python scripts/train_simple.py --symbol BTC --timeframe 1h --synthetic --samples 1000

# Test inference
python scripts/inference_from_model.py BTC 1h
```

Output:
```
🎯 PREDICTION FOR BTC 1h
Direction: NEUTRAL
Confidence: 78.97%
Entry Price: $71,362.65
...
```

**Note**: Model ini trained on synthetic data → hanya untuk test pipeline, tidak akurat untuk trading.

---

## Option 2: Training with Real Data (Production)

### Step 1: Export Data from Database

Database Supabase Anda harus reachable dari mesin training.

```bash
# Install psycopg2 if not yet
pip install psycopg2-binary

# Export data (minimal 2000 rows untuk training)
python scripts/export_ohlc_from_db.py BTC 1h --limit 5000

# Output: data/BTC_1h_train.csv
```

**Jika database tidak reachable** (seperti di Vercel environment), lakukan:

- **A**: Export dari local machine (pastikan `DATABASE_URL` diset di `.env`)
- **B**: Gunakan API route untuk fetch dan simpan ke DB dulu:
  ```bash
  curl -X POST https://your-app.vercel.app/api/cron/fetch-ohlc \
    -H "x-vercel-cron-secret: your-secret"
  ```
  Lalu export via script di local.

### Step 2: Train dengan CSV

```bash
python scripts/train_simple.py --csv data/BTC_1h_train.csv --symbol BTC --timeframe 1h
```

Output:
```
✓ Model saved to models/BTC-1h/xgboost_model.joblib
Training accuracy: 72.34%
Validation accuracy: 68.21%
```

### Step 3: Test Inference

```bash
python scripts/inference_from_model.py BTC 1h
```

Atau dengan custom features:
```bash
python scripts/inference_from_model.py BTC 1h \
  --features "[70000, 1000, 50, 0, 0, 0, 69000, 68000, 67000, 71000, ...]"
```

---

## Model Architecture

- **Algorithm**: XGBoost (multi-class: hold/buy/sell)
- **Features** (82 total):
  - Price & volume (2)
  - Indicators (20): RSI, MACD, SMAs, Bollinger, ATR, ADX, Stochastic, Williams R, CCI, MFI, OBV
  - Lagged closes (60): last 60 periods
- **Target**: `0 = hold`, `1 = buy`, `2 = sell` (threshold 0.2% move)

---

## Integration with API

Setelah model训练的:

1. **Model files** otomatis digunakan oleh `src/lib/quant-ai/models.ts` inference function `runPythonInference()` (jika `models/{symbol}-{timeframe}/` exists)

2. **API endpoint** `/api/quant-ai/predict` akan:
   - Cek model file JSON
   - Run `scripts/inference.py` (Python) untuk prediction
   - Fallback ke heuristic jika model not found

3. **To use in production**:
   - Commit folder `models/BTC-1h/` ke git
   - Deploy ke Vercel
   - Pastikan Python dependencies terinstall di Vercel (via `requirements.txt` di root, atau bundled venv)

---

## Notes

- **TensorFlow/LSTM**: Disabled karena Python 3.14 compatibility. XGBoost works fine.
- **Data requirement**: Minimal ~2000 samples untuk training yang baik.
- **Feature alignment**: Pastikan feature order sama antara training dan inference. `feature_names.json` di model dir ensures that.
- **Class imbalance**: Jika perlu, tambah `scale_pos_weight` di XGBoost params.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `psycopg2` import error | `pip install psycopg2-binary` |
| Not enough data | Fetch lebih banyak via `/api/admin/fetch-data` atau cron |
| Model not loading | Check `models/BTC-1h/` exists dan ada `xgboost_model.joblib` |
| Low accuracy (<50%) | Need more data, better feature engineering, or collect more symbols |
| Python 3.14 errors with TF | Skip TensorFlow, use XGBoost only (disarankan) |

---

## Next Steps

1. Train BTC 1h dengan real data (5000+ rows)
2. Evaluate metrics, backtest performance
3. Train untuk ETH, SOL, XAU (XAUT) juga
4. Automate training pipeline (cron weekly retrain)
5. (Optional) Add LSTM dengan TensorFlow (ganti Python 3.12)

---

**Last updated**: 2026-04-03
