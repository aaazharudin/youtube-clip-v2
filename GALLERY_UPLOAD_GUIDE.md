# Panduan Upload Manual dari Gallery

## Fitur Baru: Upload Clip dari Gallery 📤

Sekarang kamu bisa upload clip yang sudah ada di Gallery ke YouTube Shorts secara manual!

## Cara Menggunakan

### 1. Buka Halaman Gallery
- Akses aplikasi di `http://localhost:8080`
- Klik menu **Gallery** di navigasi atas
- Semua clip yang sudah dibuat akan muncul di sini

### 2. Pilih Clip untuk Upload
- Setiap clip card memiliki tombol **📤** (Upload to YouTube Shorts)
- Tombol ini terletak di sebelah kiri tombol Delete, Edit, dan Download

### 3. Upload ke YouTube
1. Klik tombol **📤** pada clip yang ingin di-upload
2. Konfirmasi dialog akan muncul:
   ```
   Upload "Judul Clip" ke YouTube Shorts?
   
   Pastikan OAuth sudah setup.
   ```
3. Klik **OK** untuk melanjutkan
4. Loading indicator akan muncul: `🚀 Uploading to YouTube...`
5. Upload memakan waktu 1-2 menit tergantung ukuran file

### 4. Hasil Upload
Setelah upload selesai, ada 2 kemungkinan:

**✅ Sukses:**
- Pop-up akan muncul: `✅ Uploaded! https://youtube.com/shorts/xxxxx`
- Kamu bisa klik **OK** untuk membuka video langsung di YouTube
- Video sudah live dan bisa dibagikan!

**❌ Gagal:**
- Error message akan muncul dengan detail error
- Contoh: `❌ Upload failed: OAuth not configured`
- Periksa setup OAuth atau log error untuk detail

## Requirements

### 1. OAuth Setup (WAJIB!)
Sebelum bisa upload, kamu harus setup Google OAuth:

1. Buat credentials di [Google Cloud Console](https://console.cloud.google.com)
2. Download file `credentials.json`
3. Simpan di folder `data/youtube_credentials.json`
4. Jalankan authentication pertama kali:
   ```bash
   docker exec -it yt-heatmap-clipper python upload_service.py
   ```
5. Browser akan terbuka untuk authorize aplikasi
6. Token akan tersimpan di `data/youtube_token.pickle`

> **Detail lengkap ada di [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md)**

### 2. Clip Requirements
Clip yang bisa di-upload harus:
- ✅ Format: MP4 (vertical/9:16 ratio recommended)
- ✅ Durasi: < 60 detik (untuk YouTube Shorts)
- ✅ Ukuran: < 256 MB
- ✅ Video quality: sudah di-encode dengan baik

## Perbedaan Auto Upload vs Manual Upload

| Fitur | Auto Upload | Manual Upload |
|-------|-------------|---------------|
| **Waktu Upload** | Otomatis setelah clip dibuat | Manual kapan saja dari Gallery |
| **Kontrol** | Semua clip ter-upload | Pilih clip mana yang mau di-upload |
| **Lokasi Setting** | Di halaman Home saat buat job | Di halaman Gallery per clip |
| **Use Case** | Untuk workflow otomatis | Untuk seleksi manual |

## Tips & Tricks

### 1. Upload Ulang Clip yang Gagal
Jika upload gagal saat auto-upload, kamu bisa re-upload dari Gallery:
1. Buka Gallery
2. Cari clip yang gagal upload
3. Klik tombol 📤 untuk upload ulang

### 2. Upload Clip Lama
Kamu punya clip bagus dari minggu lalu? Upload sekarang!
1. Clip tetap tersimpan di Gallery
2. Tidak ada batas waktu untuk upload
3. Klik 📤 kapan saja

### 3. Testing Sebelum Auto Upload
Mau test dulu sebelum enable auto upload?
1. Buat clip tanpa enable auto upload
2. Preview hasilnya di Gallery
3. Jika puas, upload manual dari Gallery
4. Setelah yakin, baru enable auto upload untuk job berikutnya

## Troubleshooting

### Error: "OAuth not configured"
**Solusi:**
1. Setup OAuth credentials dulu (lihat [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md))
2. Pastikan file `data/youtube_credentials.json` ada
3. Jalankan authentication: `docker exec -it yt-heatmap-clipper python upload_service.py`

### Error: "Clip not found"
**Solusi:**
- Clip mungkin sudah dihapus dari Gallery
- Refresh halaman dan coba lagi

### Error: "Upload timeout"
**Solusi:**
- Upload memakan waktu > 2 menit (file terlalu besar)
- Cek log di Docker: `docker logs yt-heatmap-clipper`
- Upload mungkin masih berjalan di background

### Upload Stuck di "Uploading..."
**Solusi:**
1. Tunggu 2-3 menit
2. Jika masih stuck, refresh halaman
3. Cek Docker logs untuk error:
   ```bash
   docker logs yt-heatmap-clipper | tail -50
   ```

## YouTube Quota Limits

Perhatikan quota limit YouTube API:
- **Default quota:** 10,000 units/hari
- **Upload cost:** 1,600 units/video
- **Max uploads/hari:** ~6 video

Jika sudah exceed quota:
- Upload akan error dengan message "quotaExceeded"
- Quota reset setiap hari jam 00:00 Pacific Time
- Bisa request quota increase di Google Cloud Console

## Keamanan

### Data yang Di-upload
- Video file
- Title dari clip
- Description (otomatis include source video info)
- Tags dari clip

### Privacy Setting
Default privacy: **Private**
- Video tidak muncul di public search
- Hanya kamu yang bisa lihat
- Bisa diubah ke Public manual di YouTube Studio

> **Tip:** Untuk monetization, set ke Public setelah review content

## Next Steps

Setelah upload berhasil:
1. Buka video di YouTube (klik link yang muncul)
2. Edit metadata di YouTube Studio jika perlu
3. Ubah privacy setting ke Public
4. Add hashtags dan optimize title
5. Share link ke social media!

## Support

Jika ada masalah:
1. Cek [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md) untuk OAuth setup
2. Cek [AUTO_UPLOAD_GUIDE.md](AUTO_UPLOAD_GUIDE.md) untuk auto upload
3. Lihat Docker logs untuk error details
4. Buat issue di GitHub repository

---

**Happy Uploading! 🚀**
