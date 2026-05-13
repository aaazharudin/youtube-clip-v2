# 📤 Bulk Upload Guide

## ✨ Fitur Baru: Bulk Upload dengan Progress Bar

Sekarang kamu bisa **upload banyak video sekaligus** ke YouTube dengan **real-time progress tracking**!

---

## 🎯 Fitur Utama

### 1. **Checkbox Selection** ✅
- Setiap clip yang belum di-upload memiliki checkbox di pojok kiri atas
- Klik checkbox untuk memilih clip yang mau di-upload
- Visual feedback: card yang dipilih memiliki **border cyan** yang menyala

### 2. **Bulk Action Bar** 📊
- Muncul otomatis di bagian bawah layar saat ada clip yang dipilih
- Menampilkan jumlah clip yang dipilih
- Tombol-tombol:
  - **📤 Upload ke YouTube**: Upload semua clip terpilih
  - **✅ Pilih Semua**: Pilih semua clip yang belum di-upload
  - **✖️ Batal Pilih**: Hapus semua pilihan

### 3. **Upload Progress Modal** 📈
- Modal muncul otomatis saat upload dimulai
- Posisi: **Kanan tengah layar** (floating)
- Menampilkan:
  - **Summary**: Jumlah queued, uploading, done, failed
  - **Progress bar** untuk setiap video
  - **Status real-time**: Queued → Uploading → Completed/Failed
  - **Link YouTube** setelah upload berhasil
  - **Error message** jika upload gagal

### 4. **Smart Upload Queue** 🚀
- **Concurrent uploads**: 2 video diupload bersamaan (max)
- **Auto queue**: Clip lainnya menunggu giliran
- **Triple protection**: Sama seperti single upload
  - Frontend debounce
  - Backend pre-check
  - Race condition protection

---

## 📖 Cara Menggunakan

### Upload Single Video (Seperti Biasa):
1. Buka **Gallery** page
2. Klik tombol **📤** pada clip
3. Confirm upload
4. Tunggu hingga selesai (1-2 menit)

### Upload Multiple Videos (Baru!):
1. Buka **Gallery** page
2. **Pilih clip** yang mau di-upload:
   - Klik checkbox di pojok kiri atas setiap clip
   - **ATAU** klik **✅ Pilih Semua** untuk pilih semua
3. **Bulk Action Bar** muncul di bawah
4. Klik **📤 Upload ke YouTube**
5. Confirm upload
6. **Progress Modal** muncul otomatis:
   - Lihat status setiap video
   - Progress bar bergerak real-time
   - Link YouTube muncul setelah berhasil
7. Klik **✖️** untuk tutup modal (upload tetap berjalan)

---

## 🎨 Visual Indicators

### Clip Card States:
- **Normal**: Border putih tipis
- **Selected**: Border cyan menyala + shadow cyan
- **Uploading**: Progress bar di modal
- **Uploaded**: Badge hijau "✅ Uploaded to YouTube" + link

### Progress Modal Icons:
- **⏳** = Queued (menunggu)
- **📤** = Uploading (sedang upload)
- **✅** = Completed (berhasil)
- **❌** = Failed (gagal)

### Progress Bar Colors:
- **Gradient cyan-green**: Uploading dengan animasi shimmer
- Menampilkan persentase: 0% → 90% → 100%

---

## ⚙️ Technical Details

### Upload Queue Manager:
```javascript
class UploadQueue {
  maxConcurrent: 2  // Max 2 simultaneous uploads
  queue: []         // Pending uploads
  uploading: Map()  // Currently uploading
  completed: []     // Successful uploads
  failed: []        // Failed uploads
}
```

### Progress Estimation:
- **Berbasis file size**: Video besar = estimasi lebih lama
- **Formula**: ~10 detik per MB
- **Range**: 30 detik - 2 menit (tergantung ukuran)
- **Update**: Setiap 1 detik
- **Max progress**: 90% (sisanya menunggu response YouTube)

### Concurrency Control:
- Max 2 uploads bersamaan (untuk avoid rate limit)
- Clip lain masuk ke queue
- Queue diproses otomatis saat ada slot kosong

---

## 🔒 Safety Features

### Triple Protection (Tetap Aktif):
1. **Frontend Debounce**: Cegah duplicate request
2. **Backend Pre-Check**: Cek metadata sebelum upload
3. **Race Condition Guard**: Double-check di upload thread

### Error Handling:
- Upload gagal → Tampil error message di modal
- Retry: Bisa upload ulang dari gallery (tombol 📤)
- Clip lain tetap lanjut meskipun ada yang gagal

---

## 💡 Tips & Tricks

### 1. **Upload Bertahap**:
   - Jangan upload terlalu banyak sekaligus (max 5-10 per batch)
   - YouTube quota terbatas: 6 uploads/hari (free tier)
   - Cek progress di modal sebelum upload batch baru

### 2. **Pilih Clip Strategis**:
   - Upload yang sudah ready (title bagus, tags lengkap)
   - Skip yang masih perlu editing
   - Gunakan filter/search untuk temukan clip tertentu

### 3. **Monitor Progress**:
   - Modal bisa ditutup, upload tetap jalan
   - Buka kembali modal untuk cek status
   - Refresh gallery untuk lihat badge "✅ Uploaded"

### 4. **Handle Errors**:
   - Cek error message di modal
   - Common errors:
     - "Quota exceeded" → Tunggu sampai besok
     - "Authentication failed" → Re-run OAuth setup
     - "Invalid video" → Cek format/size video

---

## 📊 Example Workflow

### Scenario: Upload 5 Video Sekaligus

1. **Select** (5 detik):
   - Klik checkbox di 5 clip
   - Atau klik "Pilih Semua" lalu uncheck yang gak mau

2. **Initiate** (2 detik):
   - Klik "📤 Upload ke YouTube"
   - Confirm dialog

3. **Queue** (otomatis):
   - Video 1 & 2: Mulai upload
   - Video 3, 4, 5: Masuk queue

4. **Progress** (6-10 menit total):
   - Video 1: Upload 1-2 menit → ✅
   - Video 2: Upload 1-2 menit → ✅
   - Video 3: Mulai upload → ✅
   - Video 4: Mulai upload → ✅
   - Video 5: Upload terakhir → ✅

5. **Done**:
   - 5 video live di YouTube!
   - Badge "✅ Uploaded" muncul di gallery
   - Link YouTube tersedia

---

## 🚨 Troubleshooting

### Modal Tidak Muncul?
- Cek console browser (F12)
- Reload page dan coba lagi
- Pastikan JavaScript tidak di-block

### Upload Stuck di 90%?
- **Normal!** Progress stuck di 90% sambil tunggu response YouTube
- Tunggu 10-30 detik lagi
- Jika lebih dari 2 menit → refresh page dan cek gallery

### Semua Upload Gagal?
1. Cek OAuth setup: `YOUTUBE_SETUP.md`
2. Cek quota: Google Cloud Console
3. Cek internet connection
4. Cek Docker logs: `docker logs yt-heatmap-clipper`

### Checkbox Tidak Muncul?
- Clip sudah di-upload → Checkbox hidden
- Hanya clip yang **belum** di-upload yang punya checkbox

---

## 📝 Notes

### Limitations:
- **Max concurrent**: 2 uploads (configurable di `UploadQueue`)
- **Quota**: 6 uploads/hari (YouTube free tier)
- **File size**: Max 256 MB per video (YouTube Shorts limit)

### Performance:
- Upload speed tergantung koneksi internet
- 1 video (5 MB) ≈ 1-2 menit
- Batch upload 10 video ≈ 10-20 menit (dengan queue)

### Future Improvements:
- [ ] Pause/Resume upload
- [ ] Cancel individual upload
- [ ] Retry failed uploads dari modal
- [ ] Drag-drop reorder queue
- [ ] Save upload history
- [ ] TikTok bulk upload

---

## 🎉 Enjoy!

Sekarang kamu bisa upload banyak video sekaligus dengan mudah dan lihat progress real-time! 🚀

**Happy Uploading!** 📤✨
