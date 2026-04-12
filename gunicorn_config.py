"""
Gunicorn configuration for production.
"""
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = int(os.getenv("GUNICORN_WORKERS", "2"))
worker_class = "sync"
worker_connections = 1000
timeout = 300
keepalive = 5

# Process naming
proc_name = "yt-heatmap-clipper"

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOGLEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed in future)
# keyfile = "/path/to/key.pem"
# certfile = "/path/to/cert.pem"

# Server hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    print("Starting Gunicorn server...")

def when_ready(server):
    """Called just after the server is started."""
    print("Gunicorn server is ready. Spawning workers...")

def on_exit(server):
    """Called just before the master is killed."""
    print("Gunicorn server shutting down...")
