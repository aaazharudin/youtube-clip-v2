# 🚀 Auto Upload Feature - Quick Start Guide

## Overview

Fitur Auto Upload memungkinkan Anda untuk **otomatis upload video clips ke YouTube Shorts** setelah proses clipping selesai. TikTok upload dalam tahap pengembangan.

## ✅ Prerequisites

1. **Google Account** dengan akses ke YouTube
2. **Google Cloud Project** dengan YouTube Data API v3 enabled
3. **OAuth 2.0 Credentials** dari Google Cloud Console

## 📦 Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Dependencies yang ditambahkan:
- `google-api-python-client` - YouTube API
- `google-auth-oauthlib` - OAuth2 authentication
- `google-auth-httplib2` - HTTP library

### 2. Setup OAuth Credentials

**Ikuti panduan lengkap di:** `YOUTUBE_SETUP.md`

Ringkasan:
1. Buat project di [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials (Desktop app)
4. Download credentials JSON
5. Save as `data/youtube_credentials.json`

### 3. First-time Authentication

```bash
# Test authentication
python upload_service.py
```

Browser akan terbuka untuk OAuth flow:
1. Login dengan akun YouTube Anda
2. Allow access ke YouTube upload
3. Token akan disimpan di `data/youtube_token.pickle`

## 🎯 How to Use

### Via Web Interface

1. **Akses web app:**
   ```bash
   python webapp.py
   ```
   
2. **Buka** http://127.0.0.1:5000/

3. **Enable Auto Upload:**
   - Scroll ke bagian "🚀 Auto Upload (Beta)"
   - Centang "Enable auto upload after clip creation"
   - Pilih platform: YouTube Shorts ✅

4. **Create clips** seperti biasa
   - Mode Heatmap atau Custom
   - Konfigurasi crop, subtitle, dll

5. **Done!** Video otomatis ter-upload setelah processing

### Check Upload Status

Upload status ditampilkan di:
- **Progress Panel**: Status upload per clip
- **Logs**: Detail URL uploaded video
- **Database**: Field `upload_status` dan `uploaded_urls`

## 📊 Upload Details

### What Gets Uploaded

- **Format**: MP4 (H.264 + AAC)
- **Platform**: YouTube Shorts
- **Privacy**: Public (default)
- **Metadata**:
  - Title: From AI generator atau manual
  - Description: Source video info + channel
  - Tags: #Shorts, #viral, #trending
  - Category: People & Blogs (22)

### Upload Limits

YouTube Data API quota:
- **Default**: 10,000 units/day
- **Upload cost**: 1,600 units/upload
- **Max uploads**: ~6 videos/day

For higher quota, request di Google Cloud Console.

## 🔧 Troubleshooting

### "Authentication failed"
- Run `python upload_service.py` untuk re-authenticate
- Check `data/youtube_credentials.json` exists
- Verify OAuth consent screen configured

### "Upload failed: quota exceeded"
- Check quota usage di Google Cloud Console
- Wait 24 hours untuk quota reset
- Request quota increase

### "Token refresh failed"
- Delete `data/youtube_token.pickle`
- Re-run authentication: `python upload_service.py`

### "Video file not found"
- Ensure clip generation succeeded
- Check logs for processing errors

## 🛡️ Security

**IMPORTANT:**
- Files `youtube_credentials.json` dan `youtube_token.pickle` berisi sensitive data
- **DO NOT** commit to Git (already in .gitignore)
- **DO NOT** share with others
- Store securely

## 🎬 Example Workflow

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Setup OAuth (one time)
# - Get credentials from Google Cloud Console
# - Save to data/youtube_credentials.json

# 3. Authenticate
python upload_service.py

# 4. Run webapp
python webapp.py

# 5. Use web interface:
# - Paste YouTube URL
# - Enable auto upload ✅
# - Create clips
# - Videos automatically uploaded! 🚀
```

## 📈 Monitoring

### View Upload Results

Upload results stored in database:
- `upload_status`: `{"youtube_clip_1": "success"}`
- `uploaded_urls`: `{"youtube_clip_1": "https://youtube.com/shorts/xxx"}`

### Logs

Check logs untuk detailed upload progress:
```
🚀 Starting auto upload for clip 1...
Uploading to YouTube: Amazing Clip Title
Upload progress: 50%
Upload progress: 100%
✅ Clip 1 uploaded to youtube: https://www.youtube.com/shorts/abc123
```

## 🔮 Coming Soon

- **TikTok Upload** - Integration dengan TikTok API
- **Scheduled Posting** - Upload pada waktu tertentu
- **Custom Privacy** - Public/Unlisted/Private options
- **Batch Upload** - Upload multiple clips sekaligus
- **Analytics** - Track views, engagement, etc

## 📝 Notes

- Upload berjalan di background thread (non-blocking)
- Processing tetap jalan meski upload gagal
- Retry mechanism untuk transient errors
- Upload status per-clip (independent)

## 🆘 Support

Issues atau questions:
1. Check `YOUTUBE_SETUP.md` untuk OAuth setup
2. Review logs untuk error messages
3. Verify credentials dan quota
4. Re-authenticate jika token expired

---

**Happy clipping & uploading! 🎉**
