# Video Clipper Pro - Docker Guide 🐳

Panduan menjalankan Video Clipper Pro menggunakan Docker.

## Prerequisites

- Docker installed ([Download](https://www.docker.com/products/docker-desktop/))
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### 1. Build & Run

```bash
docker-compose up --build
```

Atau jalankan di background:

```bash
docker-compose up -d --build
```

### 2. Access Web UI

Buka browser: **http://localhost:5000**

### 3. Stop Service

```bash
docker-compose down
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `docker-compose up -d --build` | Build & run in background |
| `docker-compose logs -f` | View logs (real-time) |
| `docker-compose ps` | Check container status |
| `docker-compose restart` | Restart container |
| `docker-compose down` | Stop & remove container |
| `docker-compose exec app bash` | Enter container shell |

## Output Files

Clips akan disimpan di folder `./clips/` di host machine (ter-mount otomatis).

```
clips/
├── {job_id}/
│   ├── clip_1.mp4
│   └── clip_2.mp4
```

## Model Cache (Optional)

Untuk mempercepat subtitle generation (Whisper model tidak perlu download ulang), uncomment volume `whisper-cache` di `docker-compose.yml`:

```yaml
volumes:
  - ./clips:/app/clips
  - whisper-cache:/root/.cache/huggingface  # Uncomment this
```

Dan bagian bawah:

```yaml
volumes:
  whisper-cache:  # Uncomment this
```

## Troubleshooting

### Port 5000 already in use

Ubah port mapping di `docker-compose.yml`:

```yaml
ports:
  - "5001:5000"  # Akses via http://localhost:5001
```

### Container keeps restarting

Cek logs:

```bash
docker-compose logs -f
```

### Insufficient memory

Kurangi memory limit di `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Default: 4G
```

### Permission issues with clips folder

```bash
chmod 755 ./clips
```

## Build Arguments

Jika ingin custom Python version atau FFmpeg version, edit `Dockerfile`:

```dockerfile
FROM python:3.11-slim  # Ganti versi Python
```

## Production Usage

Untuk production, pertimbangkan:

1. Gunakan image registry (Docker Hub, GHCR)
2. Set environment variables untuk secrets
3. Gunakan reverse proxy (nginx/traefik)
4. Enable volume untuk model cache

Contoh dengan environment variables:

```yaml
services:
  app:
    environment:
      - FLASK_ENV=production
      - WHISPER_MODEL=small
```
