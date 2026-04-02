# ✅ Storage Integration Implementation Checklist

## completed ✅

### Core Files Created
- [x] `src/lib/supabase.ts` - Supabase clients & storage helpers
- [x] `src/lib/storage-admin.ts` - Advanced admin operations
- [x] `src/app/api/upload/route.ts` - Upload API (POST/GET/DELETE)
- [x] `src/components/UploadScreenshot.tsx` - Reusable upload widget
- [x] `src/components/TradeForm.tsx` - Trade form dengan screenshot support
- [x] `src/app/api/trades/[id]/route.ts` - Updated untuk screenshot cleanup
- [x] `test-supabase-storage.ts` - Connection test script

### Configuration & Docs
- [x] Update `.env.example` dengan Supabase vars
- [x] Update `.env.production` dengan Supabase vars
- [x] Update `.env.local` dengan Supabase vars (development)
- [x] Create `scripts/supabase-storage-policies.sql` - RLS policies template
- [x] Create `STORAGE_SETUP.md` - Full documentation
- [x] Update `README.md` - Tech stack & storage section

### Git Commit
- [x] Commit all changes dengan message yang descriptive

## ❗ Action Required (Manual Steps)

### Vercel Environment Variables
Set di Vercel Dashboard → Project → Settings → Environment Variables:

```
SUPABASE_URL=https://xxiflnuhuhxbdoxtcpgc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service_role key dari Supabase]
NEXT_PUBLIC_SUPABASE_URL=https://xxiflnuhuhxbdoxtcpgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key dari Supabase]
```

### Supabase Storage Policies
1. Go to Supabase Dashboard → Storage → `supabase-bronze-coin` → Policies
2. Run SQL dari `scripts/supabase-storage-policies.sql` di SQL Editor
3. Atau create policies manual untuk:
   - **SELECT**: Public read access (jika ingin public URLs)
   - **INSERT/UPDATE/DELETE**: Sesuaikan dengan kebutuhan

### Test Locally
```bash
# 1. Set .env.local dengan keys yang valid
# 2. Run dev server
npm run dev

# 3. Test upload API
npx tsx test-supabase-storage.ts

# 4. Test UI di http://localhost:3000
# - Navigasi ke trade form
# - Upload screenshot
# - Verify file muncul di Supabase dashboard
```

### Deploy ke Vercel
1. Push ke GitHub
2. Vercel auto-deploy
3. Verify environment variables ter-set
4. Test upload di production

---

## 🔍 Verification Steps

After setup, verify:

1. **Local dev**:
   - [ ] Upload via API berhasil
   - [ ] File muncul di Supabase dashboard
   - [ ] Public URL accessible
   - [ ] Delete berhasil

2. **Production**:
   - [ ] Environment variables ter-set di Vercel
   - [ ] Upload via production app berhasil
   - [ ] Storage usage tercatat di Supabase dashboard
   - [ ] No CORS or auth errors

3. **Trade integration**:
   - [ ] Screenshot upload di TradeForm
   - [ ] Screenshot displayed di trade view
   - [ ] Screenshot deleted saat trade dihapus

---

## 🎯 Key Decisions & Notes

### Bucket Structure
- `supabase-bronze-coin` - single bucket untuk semua file types
- Folder structure: `{type}/{referenceId}/{timestamp}-{filename}`
- Types: `screenshots`, `charts`, `avatars`, `general`

### Security Model
- **Server-side upload** via API routes (gunakan `supabaseAdmin` dengan service role)
- RLS policies untuk bucket akses control
- `service_role` key never exposed to client
- File size limit: 5MB (hardcoded di upload handler)
- Allowed MIME: PNG, JPEG, WEBP, GIF

### Cleanup Strategy
- Screenshots otomatis terhapus saat trade di-delete (via `DELETE /api/trades/[id]`)
- Bulk delete utility available di `storageAdmin.deleteByPrefix()`

---

## 📊 Files Modified Summary

| File | Changes |
|------|---------|
| `src/lib/supabase.ts` | NEW - Core clients + storage helpers |
| `src/lib/storage-admin.ts` | NEW - Advanced operations |
| `src/app/api/upload/route.ts` | NEW - Upload/List/Delete API |
| `src/components/UploadScreenshot.tsx` | NEW - Upload widget |
| `src/components/TradeForm.tsx` | NEW - Form dengan upload |
| `src/app/api/trades/[id]/route.ts` | EXISTING - Updated DELETE untuk cleanup screenshot |
| `.env.example` | MODIFIED - Added Supabase vars |
| `.env.production` | MODIFIED - Added Supabase vars |
| `.env.local` | MODIFIED - Added Supabase vars (dev) |
| `README.md` | MODIFIED - Added Storage section |
| `scripts/supabase-storage-policies.sql` | NEW - RLS policies template |
| `test-supabase-storage.ts` | NEW - Test script |
| `STORAGE_SETUP.md` | NEW - Full documentation |

---

## 🆘 Support

Jika ada masalah:
1. Check Vercel Functions logs untuk API errors
2. Check Supabase Storage logs di Dashboard
3. Verify bucket name & env vars
4. Test dengan `test-supabase-storage.ts` untuk koneksi diagnosis
5. Review RLS policies di Supabase SQL Editor

---

**Last Updated**: 2026-04-02
**Status**: Implementation complete, awaiting manual setup
