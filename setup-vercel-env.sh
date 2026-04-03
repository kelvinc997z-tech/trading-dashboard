#!/bin/bash
# Setup Vercel environment variables for trading-dashboard

echo "🔑 Setting up Vercel environment variables..."

# COINMARKETCAP_API_KEY
read -p "Enter your CoinMarketCap API Key: " CMC_KEY
if [ -n "$CMC_KEY" ]; then
    echo "Setting COINMARKETCAP_API_KEY..."
    vercel env add COINMARKETCAP_API_KEY production <<< "$CMC_KEY" 2>/dev/null || echo "⚠️  Manual add needed: Vercel dashboard"
fi

# MASSIVE_API_KEY
read -p "Enter your Massive API Key: " MASSIVE_KEY
if [ -n "$MASSIVE_KEY" ]; then
    echo "Setting MASSIVE_API_KEY..."
    vercel env add MASSIVE_API_KEY production <<< "$MASSIVE_KEY" 2>/dev/null || echo "⚠️  Manual add needed: Vercel dashboard"
fi

# FINNHUB_API_KEY (optional but recommended)
read -p "Enter your Finnhub API Key (optional, press Enter to skip): " FINNHUB_KEY
if [ -n "$FINNHUB_KEY" ]; then
    echo "Setting NEXT_PUBLIC_FINNHUB_API_KEY..."
    vercel env add NEXT_PUBLIC_FINNHUB_API_KEY production <<< "$FINNHUB_KEY" 2>/dev/null || echo "⚠️  Manual add needed: Vercel dashboard"
fi

echo "✅ Done! Redeploy your project to apply changes."
echo ""
echo "📌 Manual method if CLI failed:"
echo "1. Go to https://vercel.com/kelvinc997z-tech/trading-dashboard/settings/environment-variables"
echo "2. Add these variables:"
echo "   - COINMARKETCAP_API_KEY = your_key"
echo "   - MASSIVE_API_KEY = your_key"
echo "   - NEXT_PUBLIC_FINNHUB_API_KEY = your_key (optional)"
echo "3. Click 'Save' and trigger a redeploy"
