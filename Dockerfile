# YouTube Heatmap Clipper - Docker Image
# Base image: Python 3.11 slim (recommended in README)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# - ffmpeg: required for video processing
# - curl: for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir faster-whisper gunicorn

# Copy application files
COPY run.py .
COPY webapp.py .
COPY models.py .
COPY gallery_manager.py .
COPY ai_title_generator.py .
COPY gunicorn_config.py .
COPY templates/ templates/
COPY static/ static/
COPY fonts/ fonts/

# Create directories for output, cache, and database
RUN mkdir -p clips /tmp /data && \
    chmod 755 clips /tmp /data

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV OUTPUT_DIR=/app/clips

# Expose Flask port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# Run the web application
CMD ["python", "webapp.py"]
