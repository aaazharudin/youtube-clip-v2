import os
import json
import subprocess
import sys
import threading
import time
import uuid
from types import SimpleNamespace

from flask import Flask, jsonify, render_template, request, send_from_directory
import run as core
from models import init_db, SessionLocal, get_job, create_job, update_job, add_log as db_add_log, update_job as db_update_job
from run import ClipConfig, set_config
from gallery_manager import get_gallery_manager

app = Flask(__name__, static_folder="static", template_folder="templates")

# Initialize database on startup
init_db()

preview_lock = threading.Lock()
preview_cache = {}


def now_ms():
    return int(time.time() * 1000)


def safe_int(value, default=None):
    try:
        return int(value)
    except Exception:
        return default


def parse_time_to_seconds(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    s = str(value).strip()
    if not s:
        return None
    if s.isdigit():
        return int(s)
    parts = s.split(":")
    if len(parts) == 2:
        m, sec = parts
        return int(m) * 60 + int(float(sec))
    if len(parts) == 3:
        h, m, sec = parts
        return int(h) * 3600 + int(m) * 60 + int(float(sec))
    return None


def set_job(job_id, **patch):
    """Update job in database."""
    db = SessionLocal()
    try:
        update_job(db, job_id, **patch)
    finally:
        db.close()


def add_log(job_id, line):
    """Add log line to job in database."""
    db = SessionLocal()
    try:
        db_add_log(db, job_id, line)
    finally:
        db.close()


def list_outputs(job_dir):
    if not os.path.isdir(job_dir):
        return []
    items = []
    for name in os.listdir(job_dir):
        path = os.path.join(job_dir, name)
        if os.path.isfile(path) and name.lower().endswith(".mp4"):
            items.append({"name": name, "size": os.path.getsize(path)})
    items.sort(key=lambda x: x["name"])
    return items


def run_job(job_id, payload):
    started = now_ms()
    gallery = get_gallery_manager()
    source_metadata = None

    try:
        set_job(job_id, status="running", started_at=started)

        url = (payload.get("url") or "").strip()
        if not url:
            raise ValueError("URL kosong")

        crop = payload.get("crop") or "default"
        ratio = payload.get("ratio") or "9:16"
        subtitle = bool(payload.get("subtitle"))
        whisper_model = payload.get("whisper_model") or "small"
        subtitle_font = payload.get("subtitle_font") or "Arial"
        subtitle_location = payload.get("subtitle_location") or "bottom"
        subtitle_fontsdir = payload.get("subtitle_fontsdir") or None
        if not subtitle_fontsdir and os.path.isdir("fonts"):
            subtitle_fontsdir = "fonts"
        padding = safe_int(payload.get("padding"), 10)
        max_clips = safe_int(payload.get("max_clips"), 10)
        mode = payload.get("mode") or "heatmap"
        title_mode = payload.get("title_mode", "auto")  # auto or manual
        custom_titles = payload.get("custom_titles", {})  # {index: title}
        set_job(job_id, subtitle_enabled=subtitle)

        # Get source metadata for AI title context
        try:
            preview = get_preview(url)
            source_metadata = {
                "url": url,
                "title": preview.get("title"),
                "thumbnail": preview.get("thumbnail"),
                "channel": preview.get("uploader"),
                "duration": preview.get("duration")
            }
            # Save source metadata to job
            db = SessionLocal()
            try:
                update_job(db, job_id, source_metadata=json.dumps(source_metadata))
            finally:
                db.close()
        except Exception as e:
            add_log(job_id, f"Warning: Could not fetch source metadata: {e}")
            source_metadata = None

        # Create thread-local config (fixes race condition)
        job_dir = os.path.join("clips", job_id)
        os.makedirs(job_dir, exist_ok=True)

        config = ClipConfig(
            output_dir=job_dir,
            padding=max(0, padding if padding is not None else 10),
            whisper_model=whisper_model,
            subtitle_font=subtitle_font,
            subtitle_fonts_dir=subtitle_fontsdir,
            subtitle_location=subtitle_location,
            output_ratio=ratio,
        )
        set_config(config)

        core.cek_dependensi._args = SimpleNamespace(no_update_ytdlp=True)
        ok = core.cek_dependensi(install_whisper=subtitle, fatal=False)
        if not ok:
            raise RuntimeError("FFmpeg tidak ketemu")

        video_id = core.extract_video_id(url)
        if not video_id:
            raise ValueError("URL YouTube invalid")

        total_duration = core.get_duration(video_id)

        targets = []
        picked = payload.get("segments")
        if isinstance(picked, list) and len(picked) > 0:
            add_log(job_id, f"Pakai {len(picked)} segment yang dipilih...")
            for seg in picked:
                try:
                    start = float(seg.get("start"))
                    dur = float(seg.get("duration"))
                    score = float(seg.get("score", 1.0))
                except Exception:
                    continue
                if dur <= 0:
                    continue
                targets.append({"start": start, "duration": dur, "score": score})
            if not targets:
                raise ValueError("Segment pilihan invalid")
        elif mode == "custom":
            start_s = parse_time_to_seconds(payload.get("start"))
            end_s = parse_time_to_seconds(payload.get("end"))
            if start_s is None or end_s is None:
                raise ValueError("Start/End belum diisi")
            if end_s <= start_s:
                raise ValueError("End harus lebih besar dari Start")
            targets = [{"start": float(start_s), "duration": float(end_s - start_s), "score": 1.0}]
        else:
            add_log(job_id, "Scan heatmap...")
            segments = core.ambil_most_replayed(video_id)
            if not segments:
                raise RuntimeError("Tidak ada heatmap/Most Replayed data")
            targets = segments[: max(1, max_clips or 10)]

        set_job(job_id, total=len(targets), done=0, status_text="processing")

        def event_hook(kind, data):
            if kind != "stage" or not isinstance(data, dict):
                return
            stage = data.get("stage") or ""
            clip_index = safe_int(data.get("clip_index"), 0) or 0
            set_job(job_id, stage=stage, stage_at=now_ms(), stage_clip=clip_index)

        success = 0
        clip_titles = []

        for idx, item in enumerate(targets, start=1):
            set_job(job_id, current=idx, status_text=f"clip {idx}/{len(targets)}")

            # Get custom title if manual mode
            custom_title = None
            if title_mode == "manual" and custom_titles:
                custom_title = custom_titles.get(str(idx))

            result = core.proses_satu_clip(
                video_id, item, idx, total_duration, crop, subtitle,
                event_hook=event_hook,
                title_mode=title_mode,
                custom_title=custom_title,
                source_metadata=source_metadata
            )

            if result and result.get("success"):
                success += 1
                clip_title = result.get("title", f"Clip #{idx}")
                clip_titles.append({"index": idx, "title": clip_title})

                # Save clip to gallery
                try:
                    video_path = result.get("output_path")
                    if video_path and os.path.exists(video_path):
                        file_size = os.path.getsize(video_path)
                        gallery.save_clip_to_gallery(
                            job_id=job_id,
                            clip_index=idx,
                            video_path=video_path,
                            title=clip_title,
                            source_url=url,
                            source_title=source_metadata.get("title") if source_metadata else None,
                            source_thumbnail=source_metadata.get("thumbnail") if source_metadata else None,
                            duration=int(item.get("duration", 0)),
                            file_size=file_size
                        )
                        add_log(job_id, f"Clip {idx} saved to gallery: {clip_title}")
                except Exception as e:
                    add_log(job_id, f"Warning: Could not save clip {idx} to gallery: {e}")

            set_job(job_id, done=idx, success=success, outputs=list_outputs(job_dir))

        # Save clip titles to job
        if clip_titles:
            db = SessionLocal()
            try:
                update_job(db, job_id, clip_titles=json.dumps(clip_titles))
            finally:
                db.close()

        set_job(job_id, status="done", finished_at=now_ms(), outputs=list_outputs(job_dir))
    except Exception as e:
        set_job(job_id, status="error", error=str(e), finished_at=now_ms())


@app.get("/")
def index():
    return render_template("index.html")

@app.get("/assets/fonts/<path:filename>")
def serve_font(filename):
    return send_from_directory("fonts", filename, as_attachment=False)


def get_preview(url):
    key = url.strip()
    if not key:
        raise ValueError("URL kosong")

    with preview_lock:
        cached = preview_cache.get(key)
        if cached:
            return cached

    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--skip-download",
        "-J",
        key,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError((res.stderr or res.stdout or "Gagal ambil metadata").strip())

    raw = json.loads(res.stdout)
    item = raw["entries"][0] if isinstance(raw, dict) and "entries" in raw and raw.get("entries") else raw

    preview = {
        "title": item.get("title"),
        "thumbnail": item.get("thumbnail"),
        "uploader": item.get("uploader"),
        "duration": item.get("duration"),
        "webpage_url": item.get("webpage_url") or key,
        "id": item.get("id"),
    }

    with preview_lock:
        preview_cache[key] = preview
        if len(preview_cache) > 200:
            preview_cache.clear()

    return preview


@app.post("/api/preview")
def api_preview():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    try:
        preview = get_preview(url)
        return jsonify({"ok": True, "preview": preview})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.post("/api/scan")
def api_scan():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    video_id = core.extract_video_id(url)
    if not video_id:
        return jsonify({"ok": False, "error": "URL YouTube invalid"}), 400

    core.cek_dependensi._args = SimpleNamespace(no_update_ytdlp=True)
    ok = core.cek_dependensi(install_whisper=False, fatal=False)
    if not ok:
        return jsonify({"ok": False, "error": "FFmpeg tidak ketemu"}), 400

    segments = core.ambil_most_replayed(video_id)
    total = core.get_duration(video_id)
    return jsonify({"ok": True, "video_id": video_id, "duration": total, "segments": segments})


@app.post("/api/clip")
def api_clip():
    payload = request.get_json(silent=True) or {}
    job_id = uuid.uuid4().hex[:12]

    # Create job in database
    db = SessionLocal()
    try:
        job_data = {
            "id": job_id,
            "status": "queued",
            "created_at": now_ms(),
            "started_at": None,
            "finished_at": None,
            "error": None,
            "total": 0,
            "done": 0,
            "success": 0,
            "current": 0,
            "status_text": "",
            "stage": "",
            "stage_at": None,
            "stage_clip": 0,
            "subtitle_enabled": bool(payload.get("subtitle")),
            "outputs": [],
            "logs": [],
            "payload": payload,
        }
        create_job(db, job_data)
    finally:
        db.close()

    t = threading.Thread(target=run_job, args=(job_id, payload), daemon=True)
    t.start()
    return jsonify({"ok": True, "job_id": job_id})


@app.get("/api/job/<job_id>")
def api_job(job_id):
    db = SessionLocal()
    try:
        job = get_job(db, job_id)
        if not job:
            return jsonify({"ok": False, "error": "Job not found"}), 404
        return jsonify({"ok": True, "job": job.to_dict()})
    finally:
        db.close()


@app.get("/clips/<job_id>/<path:filename>")
def serve_clip(job_id, filename):
    job_dir = os.path.join("clips", job_id)
    return send_from_directory(job_dir, filename, as_attachment=True)


# ============ GALLERY API ============

@app.get("/api/gallery")
def api_gallery():
    """Get all clips from gallery"""
    gallery = get_gallery_manager()
    clips = gallery.get_all_clips()
    return jsonify({"ok": True, "clips": clips})


@app.get("/api/gallery/<clip_id>")
def api_gallery_clip(clip_id):
    """Get specific clip details"""
    gallery = get_gallery_manager()
    clip = gallery.get_clip(clip_id)
    if not clip:
        return jsonify({"ok": False, "error": "Clip not found"}), 404
    return jsonify({"ok": True, "clip": clip})


@app.put("/api/gallery/<clip_id>/title")
def api_gallery_update_title(clip_id):
    """Update clip title"""
    data = request.get_json(silent=True) or {}
    new_title = data.get("title", "").strip()

    if not new_title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    gallery = get_gallery_manager()
    success = gallery.update_clip_title(clip_id, new_title)

    if success:
        return jsonify({"ok": True, "title": new_title})
    else:
        return jsonify({"ok": False, "error": "Clip not found"}), 404


@app.delete("/api/gallery/<clip_id>")
def api_gallery_delete(clip_id):
    """Delete clip from gallery"""
    gallery = get_gallery_manager()
    success = gallery.delete_clip(clip_id)

    if success:
        return jsonify({"ok": True, "message": "Clip deleted"})
    else:
        return jsonify({"ok": False, "error": "Clip not found"}), 404


@app.get("/clips/gallery/<clip_id>/<path:filename>")
def serve_gallery_clip(clip_id, filename):
    """Serve video file from gallery"""
    gallery = get_gallery_manager()
    clip = gallery.get_clip(clip_id)
    if not clip:
        return jsonify({"ok": False, "error": "Clip not found"}), 404

    clip_dir = gallery.clips_path / clip_id

    # Check if request is for inline playback (video element) or download
    user_agent = request.headers.get('User-Agent', '')
    # Video elements and browsers request inline playback
    as_attachment = 'download' in request.args or 'vlc' in user_agent.lower()

    return send_from_directory(str(clip_dir), filename, as_attachment=as_attachment)


# ============ GALLERY PAGE ============

@app.get("/gallery")
def gallery_page():
    """Gallery page"""
    return render_template("gallery.html")


if __name__ == "__main__":
    # Use debug mode only for development (controlled by env var)
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
