
# YouTube OAuth Setup Guide

## Langkah 1: Buat Project di Google Cloud Console

1. Kunjungi [Google Cloud Console](https://console.cloud.google.com/)
2. Klik "Select a project" → "New Project"
3. Nama project: "Video Clipper Pro" (atau nama lain)
4. Klik "Create"

## Langkah 2: Enable YouTube Data API v3

1. Di dashboard project, cari "YouTube Data API v3"
2. Klik "Enable"

## Langkah 3: Buat OAuth 2.0 Credentials

1. Buka "APIs & Services" → "Credentials"
2. Klik "Create Credentials" → "OAuth client ID"
3. Pilih "Configure Consent Screen" jika diminta:
   - User Type: External
   - App name: "Video Clipper Pro"
   - User support email: email Anda
   - Developer contact: email Anda
   - Scopes: Tambahkan "YouTube Data API v3" scope untuk upload
   - Test users: Tambahkan email YouTube Anda
4. Kembali ke "Create Credentials" → "OAuth client ID"
5. Application type: "Desktop app"
6. Name: "Video Clipper Desktop"
7. Klik "Create"

## Langkah 4: Download Credentials

1. Setelah dibuat, klik tombol download (ikon panah ke bawah)
2. Save file sebagai `youtube_credentials.json`
3. Pindahkan file ke folder `data/` di project ini:
   ```
   mkdir -p data
   mv ~/Downloads/client_secret_*.json data/youtube_credentials.json
   ```

## Langkah 5: First-time Authentication

1. Jalankan test authentication:
   ```bash
   python upload_service.py
   ```

2. Browser akan terbuka otomatis
3. Login dengan akun YouTube Anda
4. Klik "Allow" untuk memberikan izin upload
5. Token akan disimpan di `data/youtube_token.pickle`

## Struktur File

```
youtube-heatmap-clipper/
├── data/
│   ├── youtube_credentials.json  (OAuth client secrets)
│   └── youtube_token.pickle       (Auto-generated access token)
└── upload_service.py
```

## Testing

```bash
# Test authentication
python upload_service.py

# Expected output:
# ✅ YouTube authentication successful
# Ready to upload videos!
```

## Troubleshooting

### "Credentials file not found"
- Pastikan file `data/youtube_credentials.json` ada
- Check path dan nama file

### "Access blocked: This app's request is invalid"
- Pastikan OAuth consent screen sudah dikonfigurasi
- Tambahkan email Anda sebagai test user

### "Token refresh failed"
- Hapus `data/youtube_token.pickle`
- Jalankan ulang authentication

## Quota & Limits

YouTube Data API memiliki quota harian:
- Default: 10,000 units/day
- Upload video: 1,600 units per upload
- ~6 uploads/day dengan default quota

Untuk quota lebih tinggi, submit request di Google Cloud Console.

## Privacy & Security

- File `youtube_credentials.json` dan `youtube_token.pickle` berisi data sensitif
- **JANGAN** commit ke Git
- **JANGAN** share dengan orang lain
- Sudah ada di `.gitignore`

## Next Steps

Setelah setup berhasil, fitur auto-upload akan otomatis:
1. Upload video ke YouTube Shorts setelah clip dibuat
2. Set title dari AI generator
3. Tambahkan #Shorts hashtag
4. Return link ke uploaded video
