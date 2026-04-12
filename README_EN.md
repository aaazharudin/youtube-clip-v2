# Video Clipper Pro 🎬

[🇮🇩 Bahasa Indonesia](README.md) | 🇺🇸 **English**

A web application to extract the most engaging moments from YouTube videos using "Most Replayed" (heatmap) data, and automatically convert them into vertical-ready clips for Shorts, Reels, and TikTok — featuring AI-powered subtitles.

## Preview

![Video Clipper Pro UI](images/preview.png)

*Modern dark theme with intuitive workflow*

## Features

### Core Features

- **Scan YouTube Videos** - Automatically detect the most engaging moments
- **Heatmap Detection** - Uses YouTube's Most Replayed data
- **Auto Selection** - Selects highest engagement segments
- **Configurable Padding** - Add duration before/after clips
- **Multiple Output Ratios** - 9:16, 1:1, 16:9, or original
- **No API Key Required** - Works out of the box

### Advanced Features

- **3 Crop Modes**:
  - **Default**: Center crop from original video
  - **Split Left**: Top = center content, Bottom = bottom-left (facecam)
  - **Split Right**: Top = center content, Bottom = bottom-right (facecam)

- **AI Auto Subtitle** (Faster-Whisper):
  - 4-5x faster than standard Whisper
  - Supports Indonesian (+ 99 other languages)
  - Multiple model sizes: tiny, base, small, medium, large
  - Automatic transcription + burning to video
  - Customizable subtitle style

### Web UI Features

- **Modern Interface** - Clean, comfortable dark theme
- **Video Preview** - Metadata (title, channel, duration, thumbnail)
- **Segment Selection** - Select multiple segments at once
- **Custom Range** - Manual start/end specification
- **Real-time Progress** - Track each clip's status
- **Font Options** - Plus Jakarta Sans, Roboto, Montserrat, Arial, or Custom

## Usage (Docker)

### Quick Start

```bash
# Build and run
docker-compose up -d --build

# Open in browser
open http://localhost:8080
```

**Output clips will be saved in `./clips/`**

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Run in background |
| `docker-compose logs -f` | View real-time logs |
| `docker-compose down` | Stop service |
| `docker-compose restart` | Restart service |

## Usage (Manual)

### Requirements

- Python 3.8+ (Python 3.11 recommended)
- **FFmpeg (REQUIRED)**
- Internet connection

### Install

```bash
# Install dependencies
pip install -r requirements.txt
pip install faster-whisper  # for subtitles
```

### Run Web App

```bash
python webapp.py
```

Open: http://127.0.0.1:5000/

## Workflow

1. **Paste YouTube URL** → Auto preview appears
2. **Choose Mode**:
   - **Scan Heatmap**: Click "Scan Heatmap" → Select segments → "Create Selected Clip"
   - **Custom**: Enter Start/End → "Buat Clip"
3. **Configure**:
   - Output ratio (9:16 for Shorts)
   - Crop mode
   - Padding (seconds)
   - Subtitle (optional)
4. **Download** - Clips appear in progress panel

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

> **Recommendation**: Use `tiny` for speed, `small` for quality balance

## Output Specifications

- **Format**: MP4 (H.264 + AAC)
- **Resolution**: 720x1280 (9:16 vertical)
- **Video Codec**: libx264, CRF 26, ultrafast preset
- **Audio Codec**: AAC, 128 kbps
- **Subtitle**: Burned-in (if enabled)

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

- Video might not have Most Replayed data yet
- Try videos with high views/engagement
- Verify YouTube URL is valid

### Subtitle fails

- Ensure internet connection for first-time model download
- Check available RAM (500MB-2GB depending on model)
- Try smaller model: `tiny` or `base`

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
