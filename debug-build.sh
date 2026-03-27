#!/bin/bash

# Debug Build Script
# Helps identify and fix common build errors

echo "🔧 Starting build debug..."
echo ""

# 1. Check Node.js & npm versions
echo "📦 Node.js version:"
node --version
npm --version
echo ""

# 2. Clean cache
echo "🧹 Cleaning Next.js cache..."
rm -rf .next
echo ""

# 3. Install dependencies fresh
echo "📥 Installing dependencies..."
npm ci --prefer-offline --no-audit
echo ""

# 4. Check for TypeScript errors
echo "🔍 Checking TypeScript errors..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -50 || true
echo ""

# 5. Try local build
echo "🏗️  Running local build..."
npm run build 2>&1 | tail -100 || {
  echo "❌ Build failed locally!"
  echo ""
  echo "Common issues:"
  echo "  - Missing imports (check console output)"
  echo "  - JSX syntax errors (unclosed tags)"
  echo "  - Type errors (check .ts files)"
  echo ""
  echo "Next steps:"
  echo "  - Run: grep -n 'error' .next/errors/* 2>/dev/null | head -20"
  echo "  - Check: app/page.tsx for unclosed tags"
  echo "  - Run: npx tsc --noEmit for full type errors"
  exit 1
}

echo "✅ Local build successful!"
echo ""
echo "If local build works but Vercel fails, it's likely a cache issue."
echo "Try: vercel --prod --force (requires Vercel Pro)"
