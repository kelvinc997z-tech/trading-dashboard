#!/bin/bash
# Quick setup Vercel env vars non-interactive
# Usage: ./set-vercel-envs.sh <CMC_KEY> <MASSIVE_KEY> [FINNHUB_KEY]

set -e

echo "🔑 Setting Vercel environment variables..."

PROJECT="trading-dashboard"
SCOPE="kelvinc997z-tech"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from trading-dashboard directory."
    exit 1
fi

# Function to add env var
add_env_var() {
    local var_name=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping $var_name (no value provided)"
        return
    fi
    
    echo "Adding $var_name..."
    # Using vercel env add with input from stdin
    echo "$value" | vercel env add "$var_name" production --scope "$SCOPE" 2>/dev/null || \
        echo "   ⚠️  Manual add may be needed (CLI error). Try: vercel env add $var_name production"
}

# Get keys from arguments or prompt
CMC_KEY="${1:-}"
MASSIVE_KEY="${2:-}"
FINNHUB_KEY="${3:-}"

# If not provided as args, prompt
if [ -z "$CMC_KEY" ]; then
    read -p "CoinMarketCap API Key: " CMC_KEY
fi
if [ -z "$MASSIVE_KEY" ]; then
    read -p "Massive API Key: " MASSIVE_KEY
fi
if [ -z "$FINNHUB_KEY" ]; then
    read -p "Finnhub API Key (optional, press Enter to skip): " FINNHUB_KEY
fi

# Add variables
add_env_var "COINMARKETCAP_API_KEY" "$CMC_KEY"
add_env_var "MASSIVE_API_KEY" "$MASSIVE_KEY"
if [ -n "$FINNHUB_KEY" ]; then
    add_env_var "NEXT_PUBLIC_FINNHUB_API_KEY" "$FINNHUB_KEY"
fi

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📌 Next steps:"
echo "1. Verify: vercel env ls production --scope $SCOPE"
echo "2. Redeploy: git push   (or vercel --prod)"
echo "3. Test: Open your app and check /api/market-data endpoint"
echo ""
