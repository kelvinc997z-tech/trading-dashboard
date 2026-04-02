# 📚 Supabase Storage Integration Guide

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Steps](#setup-steps)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Security & Policies](#security--policies)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Trading Dashboard menggunakan **Supabase Storage** untuk menyimpan file-file seperti screenshot trades, chart images, dan assets lainnya.

### Bucket Info

- **Bucket Name**: `supabase-bronze-coin`
- **Project ID**: `xxiflnuhuhxbdoxtcpgc`
- **URL**: `https://xxiflnuhuhxbdoxtcpgc.supabase.co`

### File Structure

Files di-organize dengan struktur:

```
{type}/{referenceId}/{timestamp}-{filename}
```

Contoh:
- `screenshots/trade-123/1700000000000-profit.png`
- `charts/user-456/1700000000001-btc-analysis.jpg`
- `avatars/general/1700000000002-avatar.webp`

---

## Prerequisites

1. **Supabase Account**: [supabase.com](https://supabase.com)
2. **Project Created**: `xxiflnuhuhxbdoxtcpgc`
3. **Bucket Created**: `supabase-bronze-coin`
4. **API Keys**:
   - `anon` key (public)
   - `service_role` key (server-side only)

---

## Setup Steps

### 1. Install Dependencies

```bash
cd trading-dashboard
npm install @supabase/supabase-js
```

### 2. Environment Variables

Tambahkan ke file `.env.local` (development) atau Vercel dashboard (production):

```env
# Supabase Project URL
SUPABASE_URL=https://xxiflnuhuhxbdoxtcpgc.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://xxiflnuhuhxbdoxtcpgc.supabase.co

# Keys
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Cara Mendapatkan Keys:

1. Go to Supabase Dashboard → Project → Settings → API
2. Copy:
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Never expose `service_role` key to client-side!

> **⚠️ Security Note**: `service_role` key bypasses all Row Level Security (RLS). Only use in server-side code (API routes).

### 3. Deploy ke Vercel

Set environment variables di Vercel Dashboard:

1. Project → Settings → Environment Variables
2. Add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy

---

## Configuration

### File Structure dalam Code

Library files:

| File | Deskripsi |
|------|-----------|
| `src/lib/supabase.ts` | Core Supabase clients (supabase & supabaseAdmin) |
| `src/lib/storage-admin.ts` | Advanced storage operations (delete, move, signed URLs) |

### Components

| Component | Deskripsi |
|-----------|-----------|
| `src/components/UploadScreenshot.tsx` | Reusable upload widget |
| `src/components/TradeForm.tsx` | Trade form dengan upload screenshot |

### API Routes

| Route | Method | Deskripsi |
|-------|--------|-----------|
| `/api/upload` | POST | Upload file ke storage |
| `/api/upload` | GET | List files (with ?prefix=) |
| `/api/upload` | DELETE | Delete file (?path=) |
| `/api/trades/[id]` | PUT | Update trade (termasuk screenshotUrl) |
| `/api/trades/[id]` | DELETE | Delete trade + associated screenshot |

---

## Usage

### Basic Upload di Komponen React

```tsx
'use client';

import UploadWidget from '@/components/UploadScreenshot';

export default function MyComponent() {
  const [screenshotUrl, setScreenshotUrl] = useState('');

  return (
    <UploadWidget
      type="screenshot"
      referenceId="trade-123"
      onUpload={(url, path) => {
        setScreenshotUrl(url);
        console.log('File uploaded to:', path);
      }}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Direct API Call

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.png" \
  -F "type=screenshots" \
  -F "referenceId=trade-123"
```

Response:

```json
{
  "success": true,
  "url": "https://xxiflnuhuhxbdoxtcpgc.supabase.co/storage/v1/object/public/supabase-bronze-coin/screenshots/trade-123/1700000000000-image.png",
  "path": "screenshots/trade-123/1700000000000-image.png",
  "name": "image.png",
  "size": 123456,
  "type": "image/png"
}
```

### Delete File

```bash
curl -X DELETE "http://localhost:3000/api/upload?path=screenshots/trade-123/1700000000000-image.png"
```

---

## Security & Policies

### Storage Policies (RLS)

Supabase Storage menggunakan Row Level Security. Anda perlu setup policies di Supabase Dashboard.

#### Minimal Policy: Public Read

Jika file screenshot perlu public access (lihat langsung via URL):

```sql
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'supabase-bronze-coin' );
```

#### Full Policies (Authenticated Users Only)

Jika ingin restrict upload hanya untuk user yang authenticated:

```sql
-- Upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'supabase-bronze-coin' AND
  auth.role() = 'authenticated'
);

-- Update (own files only)
CREATE POLICY "Authenticated Update Own Files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'supabase-bronze-coin' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete (own files only)
CREATE POLICY "Authenticated Delete Own Files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'supabase-bronze-coin' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

> **Note**: Policy di atas asumsi path structure `{userId}/{...}`. Jika tidak pakai userId dalam path, sesuaikan.

#### Run Policies

1. Supabase Dashboard → Storage → supabase-bronze-coin → Policies
2. Click "New Policy" → "Policies as Code" → paste SQL
3. Atau gunakan SQL Editor di Supabase Dashboard

---

## Testing

### 1. Test Connection Script

```bash
npx tsx test-supabase-storage.ts
```

Script ini akan:
- List files di bucket
- Upload test file
- Get public URL
- Delete test file
- Show bucket info

### 2. Manual Test dengan curl

```bash
# Upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.png" \
  -F "type=screenshot" \
  -F "referenceId=test-123"

# List
curl "http://localhost:3000/api/upload?prefix=screenshots"

# Delete
curl -X DELETE "http://localhost:3000/api/upload?path=screenshots/test-123/abc.png"
```

### 3. Upload via UI

- Start dev server: `npm run dev`
- Visit `/dashboard` (or wherever TradeForm is)
- Test upload widget
- Check supabase dashboard → Storage → Files

---

## Troubleshooting

### Error: "Bucket not found"

**Cause**: Bucket name mismatch atau tidak ada.

**Fix**:
1. Verify bucket name di Supabase Dashboard → Storage
2. Pastikan `STORAGE_BUCKET` di `supabase.ts` sesuai
3. Di Vercel, pastikan `SUPABASE_URL` benar

### Error: "Missing required param: access_token" atau "Unauthorized"

**Cause**: Upload dari client tanpa anon key atau RLS policy ket地上的。

**Fix**:
1. Pastikan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah set di Vercel
2. Atau upload via server-side API (gunakan `supabaseAdmin`)
3. Check RLS policy untuk bucket

### Error: "File too large" (5MB limit)

**Cause**: File exceeds maxSize di upload handler.

**Fix**:
1. Increase limit di `src/app/api/upload/route.ts` (line ~30)
2. Atau compress file sebelum upload

### Upload berhasil tapi file tidak muncul

**Cause**: Cache atau unauthorised public read.

**Fix**:
1. Cek bucket policy SELECT
2. Jika private, gunakan signed URL
3. Clear cache

### Vercel Deployment: "Missing environment variable"

**Fix**:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required vars
3. Redeploy

---

## File Structure Project

```
trading-dashboard/
├── src/
│   ├── lib/
│   │   ├── supabase.ts           # Supabase clients
│   │   └── storage-admin.ts      # Advanced operations
│   ├── app/
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts      # Upload/List/Delete API
│   │       └── trades/
│   │           └── [id]/
│   │               └── route.ts  # Trade CRUD + cleanup
│   └── components/
│       ├── UploadScreenshot.tsx  # Upload widget
│       └── TradeForm.tsx         # Form dengan screenshot
├── scripts/
│   └── supabase-storage-policies.sql  # RLS policies template
├── test-supabase-storage.ts      # Test script
├── .env.local                    # Development env
├── .env.example                  # Template env
└── STORAGE_SETUP.md             # Dokumen ini
```

---

## Advanced Usage

### Generate Signed URLs (Private Files)

```typescript
import { storageAdmin } from '@/lib/storage-admin';

const signedUrl = await storageAdmin.getSignedUrl('private/files/doc.pdf', 3600);
// Returns URL valid for 1 hour
```

### Bulk Delete by Prefix

```typescript
// Delete all screenshots untuk trade ID tertentu
await storageAdmin.deleteByPrefix('screenshots/trade-123/');
```

### Get Bucket Info

```typescript
const info = await storageAdmin.getBucketInfo();
console.log(`Files: ${info.fileCount}, Size: ${info.totalSizeMB} MB`);
```

---

## Next Steps

- [ ] Set RLS policies di Supabase Dashboard
- [ ] Test upload dengan `test-supabase-storage.ts`
- [ ] Integrasi TradeForm dengan dashboard UI
- [ ] Deploy ke Vercel dengan environment variables
- [ ] Monitor storage usage di Supabase Dashboard

---

**📧 Support**: Jika ada masalah, cek logs di Vercel Functions console atau Supabase Storage logs.
