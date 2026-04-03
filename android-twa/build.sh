#!/bin/bash

# Trading Dashboard Pro - TWA Build Script
# Requires: @bubblewrap/cli (npm install -g @bubblewrap/cli)

set -e

echo "================================"
echo "Trading Dashboard Pro - TWA Build"
echo "================================"

# Check if bubblewrap is installed
if ! command -v bubblewrap &> /dev/null; then
  echo "❌ Bubblewrap CLI not found!"
  echo "Install it globally: npm install -g @bubblewrap/cli"
  exit 1
fi

# Config
MANIFEST_URL="https://www.klepon.cfd/manifest.json"
TWA_MANIFEST="./twa-manifest.json"
OUTPUT_DIR="./android-build"
PACKAGE_ID=$(grep -o '"packageId": *"[^"]*"' "$TWA_MANIFEST" | cut -d'"' -f4)

if [ -z "$PACKAGE_ID" ]; then
  echo "❌ Could not read packageId from $TWA_MANIFEST"
  exit 1
fi

echo "📦 Package ID: $PACKAGE_ID"
echo "🌐 Manifest URL: $MANIFEST_URL"
echo ""

# Clean previous build
if [ -d "$OUTPUT_DIR" ]; then
  echo "🧹 Cleaning previous build..."
  rm -rf "$OUTPUT_DIR"
fi

mkdir -p "$OUTPUT_DIR"

# Initialize TWA project
echo "🚀 Initializing TWA project..."
bubblewrap init \
  --manifest="$MANIFEST_URL" \
  --packageId="$PACKAGE_ID" \
  --name="Trading Dashboard Pro" \
  --versionCode=1 \
  --versionName="1.0.0" \
  --host="www.klepon.cfd" \
  --startUrl="/" \
  --display="standalone" \
  --themeColor="#10b981" \
  --backgroundColor="#0a0a0a" \
  --orientation="portrait"

# Move generated project to output dir
mv .twa "$OUTPUT_DIR/"

echo ""
echo "✅ TWA project generated in: $OUTPUT_DIR/.twa"
echo ""
echo "📝 Next steps:"
echo "1. Generate keystore (if you don't have one):"
echo "   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000"
echo ""
echo "2. Build debug APK:"
echo "   cd $OUTPUT_DIR/.twa"
echo "   ./gradlew assembleDebug"
echo ""
echo "   APK will be at: $OUTPUT_DIR/.twa/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "3. To build signed release APK for Play Store:"
echo "   ./gradlew bundleRelease (generates .aab)"
echo "   Then use bundletool to generate APK(s) from .aab"
echo ""
echo "📖 For more info: https://github.com/GoogleChromeLabs/bubblewrap"
