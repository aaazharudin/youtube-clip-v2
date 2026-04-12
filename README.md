# Video Clipper Pro 🎬

🇮🇩 **Bahasa Indonesia** | [🇺🇸 English](README_EN.md)

Web application untuk mengambil momen paling menarik dari video YouTube menggunakan data Most Replayed (heatmap), lalu secara otomatis mengubahnya menjadi klip vertikal yang siap untuk Shorts/Reels/TikTok — lengkap dengan opsi subtitle AI.

## Preview

![Video Clipper Pro UI](images/preview.png)

*Modern dark theme with intuitive workflow*

## Fitur

### Core Features

- **Scan YouTube Videos** - Otomatis mendeteksi momen paling "rame"
- **Heatmap Detection** - Menggunakan data Most Replayed dari YouTube
- **Auto Selection** - Memilih momen dengan engagement tertinggi
- **Configurable Padding** - Tambahkan durasi sebelum/sesudah klip
- **Multiple Output Ratios** - 9:16, 1:1, 16:9, atau original
- **No API Key Required** - Langsung bekerja tanpa setup YouTube API

### Advanced Features

- **3 Crop Modes**:
  - **Default**: Center crop dari video asli
  - **Split Left**: Atas = konten utama, Bawah = kiri-bawah (facecam)
  - **Split Right**: Atas = konten utama, Bawah = kanan-bawah (facecam)

- **AI Auto Subtitle** (Faster-Whisper):
  - 4-5x lebih cepat dari Whisper standar
  - Support Bahasa Indonesia (+ 99 bahasa lain)
  - Multiple model sizes: tiny, base, small, medium, large
  - Transkripsi otomatis + burning ke video
  - Style subtitle yang dapat dikustomisasi

### Web UI Features

- **Modern Interface** - Dark theme yang bersih dan nyaman
- **Video Preview** - Metadata (judul, channel, durasi, thumbnail)
- **Segment Selection** - Pilih multiple segment sekaligus
- **Custom Range** - Tentukan start/end manual
- **Real-time Progress** - Track status setiap klip
- **Font Options** - Plus Jakarta Sans, Roboto, Montserrat, Arial, atau Custom

## Cara Pakai (Docker)

### Quick Start

```bash
# Build dan jalankan
docker-compose up -d --build

# Akses di browser
open http://localhost:8080
```

**Output klip akan tersimpan di folder `./clips/`**

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Jalankan di background |
| `docker-compose logs -f` | Lihat logs real-time |
| `docker-compose down` | Stop service |
| `docker-compose restart` | Restart service |

## Cara Pakai (Manual)

### Requirements

- Python 3.8+ (Python 3.11 recommended)
- **FFmpeg (REQUIRED)**
- Internet connection

### Install

```bash
# Install dependencies
pip install -r requirements.txt
pip install faster-whisper  # untuk subtitle
```

### Run Web App

```bash
python webapp.py
```

Buka: http://127.0.0.1:5000/

## Workflow

1. **Tempel YouTube URL** → Preview otomatis muncul
2. **Pilih Mode**:
   - **Scan Heatmap**: Klik "Scan Heatmap" → Pilih segment → "Create Selected Clip"
   - **Custom**: Isi Start/End → "Buat Clip"
3. **Konfigurasi**:
   - Ratio output (9:16 untuk Shorts)
   - Crop mode
   - Padding (detik)
   - Subtitle (opsional)
4. **Download** - Klip jadi muncul di progress panel

## CLI Usage (Optional)

```bash
python run.py --url "https://www.youtube.com/watch?v=VIDEO_ID" \
  --crop default \
  --subtitle y \
  --whisper-model small \
  --subtitle-font "Plus Jakarta Sans" \
  --subtitle-fontsdir "fonts" \
  --subtitle-location bottom \
  --ratio 9:16
```

**Arguments:**

| Argument | Choices | Description |
|----------|---------|-------------|
| `--crop` | default, split_left, split_right | Crop mode |
| `--ratio` | 9:16, 1:1, 16:9, original | Output aspect ratio |
| `--subtitle` | y, n | Enable AI subtitle |
| `--whisper-model` | tiny, base, small, medium, large-v3 | Whisper model size |
| `--subtitle-font` | (font name) | Subtitle font family |
| `--subtitle-fontsdir` | (path) | Folder containing .ttf/.otf fonts |
| `--subtitle-location` | bottom, center | Subtitle position |

## Whisper Model Comparison

| Model | Size | RAM | Speed (60s) | Accuracy | Best For |
|-------|------|-----|------------|----------|----------|
| **tiny** | 75 MB | ~500 MB | ~5-7s | Good | Quick clips, low-end PC |
| **base** | 142 MB | ~700 MB | ~8-10s | Better | General purpose |
| **small** | 466 MB | ~1.5 GB | ~15-20s | Great | Quality content |
| **medium** | 1.5 GB | ~3 GB | ~40-50s | Excellent | Professional work |
| **large-v3** | 2.9 GB | ~6 GB | ~90-120s | Best | Production quality |

> **Recommendation**: Use `tiny` untuk speed, `small` untuk kualitas

## Output Specifications

- **Format**: MP4 (H.264 + AAC)
- **Resolution**: 720x1280 (9:16 vertical)
- **Video Codec**: libx264, CRF 26, ultrafast preset
- **Audio Codec**: AAC, 128 kbps
- **Subtitle**: Burned-in (jika diaktifkan)

## Troubleshooting

### FFmpeg not found

```bash
# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg

# Windows (PowerShell as Admin)
winget install Gyan.FFmpeg
```

### No segments found

- Video mungkin belum punya data Most Replayed
- Coba video dengan view/engagement tinggi
- Pastikan URL YouTube valid

### Subtitle fails

- Pastikan koneksi internet untuk download model pertama kali
- Cek RAM tersedia (500MB-2GB tergantung model)
- Coba model lebih kecil: `tiny` atau `base`

### Docker issues

```bash
# Rebuild container
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

## Tips & Best Practices

| Content Type | Crop Mode | Padding | Whisper Model |
|--------------|-----------|---------|---------------|
| **Gaming** | Split Right/Left | 10s | small/base |
| **Tutorial** | Default | 10-15s | tiny (fast) |
| **Vlog** | Default | 10s | small |
| **Fast-paced** | Default | 5s | tiny |

## License

MIT License - Feel free to use and modify for your needs.

---

**Made with ❤️ for content creators**
