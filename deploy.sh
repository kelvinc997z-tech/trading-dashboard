#!/bin/bash

# Quick Deploy Script for Trading Dashboard
# Run this AFTER deployment limit resets (00:00 GMT)

set -e  # Exit on any error

echo "🚀 Starting Quick Deploy..."
echo ""

# 1. Check git status
echo "📊 Checking git status..."
git status
echo ""

# 2. Commit any pending changes
echo "💾 Committing changes..."
git add -A
git diff --cached --quiet && echo "No changes to commit" || git commit -m "deploy: quick deploy $(date +%Y-%m-%d)"
echo ""

# 3. Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main
echo ""

# 4. Verify environment variables locally
echo "🔍 Checking local environment variables..."
node scripts/check-env.js
echo ""

# 5. Deploy to Vercel
echo "☁️  Deploying to Vercel..."
vercel --prod --yes
echo ""

# 6. Get deployment URL
echo "✅ Deployment complete!"
echo "Check your Vercel dashboard for the production URL."
echo ""
echo "📝 Next steps:"
echo "1. Update NEXTAUTH_URL in Vercel env vars with the new URL"
echo "2. Setup Stripe webhook with the production URL"
echo "3. Test the application"
echo ""
