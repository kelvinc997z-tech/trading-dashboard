# Trading Dashboard Pro - Android TWA Build

Trusted Web Activity (TWA) wrapper untuk Trading Dashboard Pro PWA.

## Prerequisites

- **Node.js** (v18+)
- **Java JDK** 17+
- **Android SDK** (via Android Studio)
- **Bubblewrap CLI**: `npm install -g @bubblewrap/cli`

## Quick Build

```bash
# Make build script executable
chmod +x build.sh

# Run build script
./build.sh
```

Output APK akan berada di:
```
android-build/.twa/app/build/outputs/apk/debug/app-debug.apk
```

## Build Configuration

- **Package ID**: `com.trading.dashboard.pro`
- **App Name**: Trading Dashboard Pro
- **Version**: 1.0.0 (versionCode: 1)
- **Host**: www.klepon.cfd
- **Display**: standalone
- **Theme Color**: #10b981 (emerald)
- **Orientation**: portrait

## Files

| File | Description |
|------|-------------|
| `twa-manifest.json` | TWA configuration (used by build script) |
| `assetlinks.json` | Digital Asset Links template for Play Store verification |
| `build.sh` | Automated build script |
| `README.md` | This file |

## Release Build (Play Store)

### 1. Generate Keystore (if you don't have one)

```bash
keytool -genkey -v \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Keep this keystore safe! You'll need it for future updates.

### 2. Configure Signing in TWA

Edit `android-build/.twa/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../../../my-release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'my-key-alias'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Build Release Bundle (.aab)

```bash
cd android-build/.twa
./gradlew bundleRelease
```

Output: `app-release.aab` (for Play Store)

### 4. Generate APK(s) from AAB (optional)

```bash
# Install bundletool if not present
brew install bundletool  # macOS
# or download from https://github.com/google/bundletool

# Generate APK set
bundletool build-apks --bundle=app-release.aab --output=app.apks --ks=my-release-key.keystore --ks-key-alias=my-key-alias --ks-pass=pass:YOUR_KEYSTORE_PASSWORD --key-pass=pass:YOUR_KEY_PASSWORD

# Extract APKs
unzip app.apks
```

### 5. Digital Asset Links (for Play Console)

1. Host `assetlinks.json` at:
   ```
   https://www.klepon.cfd/.well-known/assetlinks.json
   ```

2. Content (replace fingerprint with your keystore's SHA-256):
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.trading.dashboard.pro",
         "sha256_cert_fingerprints": ["YOUR_CERT_FINGERPRINT_HERE"]
       }
     }
   ]
   ```

3. Get your SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore my-release-key.keystore -alias my-key-alias
   ```

4. In Play Console, under "Setup > App integrity", verify the assetlinks.

## Testing

安装 APK debug:
```bash
adb install android-build/.twa/app/build/outputs/apk/debug/app-debug.apk
```

App akan terbuka ke https://www.klepon.cfd

## Customization

- **Package ID**: Edit `packageId` in `twa-manifest.json` (must be unique)
- **App name**: Edit `name` in `twa-manifest.json`
- **Version**: Edit `version` and `versionCode`
- **URL**: Modify `host` and `startUrl` in build script or after init

## Troubleshooting

### Bubblewrap init fails
- Ensure manifest URL is accessible and valid
- Check Java JDK version: `java -version` (should be 17+)

### Build fails with "Failed to find target"
- Install Android APIs via Android Studio SDK Manager
- Accept Android licenses: `sdkmanager --licenses`

### APK not installing
- Enable "Install from unknown sources" on device
- Use `adb install -r` to replace existing app

## Support

For issues with Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap/issues
