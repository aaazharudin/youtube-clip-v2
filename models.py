"""
Database models for job persistence.
"""
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import json
from datetime import datetime

Base = declarative_base()

# Database path
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///data/jobs.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Job(Base):
    """
    Job model for storing clip processing jobs.
    """
    __tablename__ = "jobs"

    id = Column(String(12), primary_key=True, index=True)
    status = Column(String(20), nullable=False, default="queued")  # queued, running, done, error
    created_at = Column(Integer, nullable=False)  # Unix timestamp (ms)
    started_at = Column(Integer, nullable=True)
    finished_at = Column(Integer, nullable=True)

    # Job configuration
    payload = Column(Text, nullable=True)  # JSON string

    # Progress tracking
    total = Column(Integer, default=0)
    done = Column(Integer, default=0)
    success = Column(Integer, default=0)
    current = Column(Integer, default=0)
    status_text = Column(String(200), nullable=True)

    # Stage tracking
    stage = Column(String(50), nullable=True)
    stage_at = Column(Integer, nullable=True)  # Unix timestamp (ms)
    stage_clip = Column(Integer, default=0)

    # Subtitle info
    subtitle_enabled = Column(Boolean, default=False)

    # Results
    outputs = Column(Text, nullable=True)  # JSON array of output files

    # Error info
    error = Column(Text, nullable=True)

    # Logs (stored as JSON array for simplicity)
    logs = Column(Text, nullable=True)  # JSON array of log lines

    # Gallery fields
    clip_titles = Column(Text, nullable=True)  # JSON array: [{"index": 1, "title": "..."}]
    source_metadata = Column(Text, nullable=True)  # JSON: {url, title, thumbnail, channel, duration}

    # Upload fields
    upload_enabled = Column(Boolean, default=False)  # Whether auto upload is enabled
    upload_platforms = Column(Text, nullable=True)  # JSON array: ["youtube", "tiktok"]
    upload_status = Column(Text, nullable=True)  # JSON: {"youtube": "success", "tiktok": "pending"}
    uploaded_urls = Column(Text, nullable=True)  # JSON: {"youtube": "url", "tiktok": "url"}
    upload_error = Column(Text, nullable=True)  # Upload error messages

    def to_dict(self):
        """Convert model to dictionary for API responses."""
        outputs_list = []
        if self.outputs:
            try:
                outputs_list = json.loads(self.outputs) if self.outputs else []
            except:
                outputs_list = []

        logs_list = []
        if self.logs:
            try:
                logs_list = json.loads(self.logs) if self.logs else []
            except:
                logs_list = []

        payload_dict = {}
        if self.payload:
            try:
                payload_dict = json.loads(self.payload) if self.payload else {}
            except:
                payload_dict = {}

        clip_titles_list = []
        if self.clip_titles:
            try:
                clip_titles_list = json.loads(self.clip_titles) if self.clip_titles else []
            except:
                clip_titles_list = []

        source_metadata_dict = {}
        if self.source_metadata:
            try:
                source_metadata_dict = json.loads(self.source_metadata) if self.source_metadata else {}
            except:
                source_metadata_dict = {}

        upload_platforms_list = []
        if self.upload_platforms:
            try:
                upload_platforms_list = json.loads(self.upload_platforms) if self.upload_platforms else []
            except:
                upload_platforms_list = []

        upload_status_dict = {}
        if self.upload_status:
            try:
                upload_status_dict = json.loads(self.upload_status) if self.upload_status else {}
            except:
                upload_status_dict = {}

        uploaded_urls_dict = {}
        if self.uploaded_urls:
            try:
                uploaded_urls_dict = json.loads(self.uploaded_urls) if self.uploaded_urls else {}
            except:
                uploaded_urls_dict = {}

        return {
            "id": self.id,
            "status": self.status,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "payload": payload_dict,
            "total": self.total,
            "done": self.done,
            "success": self.success,
            "current": self.current,
            "status_text": self.status_text,
            "stage": self.stage,
            "stage_at": self.stage_at,
            "stage_clip": self.stage_clip,
            "subtitle_enabled": self.subtitle_enabled,
            "outputs": outputs_list,
            "error": self.error,
            "logs": logs_list,
            "clip_titles": clip_titles_list,
            "source_metadata": source_metadata_dict,
            "upload_enabled": self.upload_enabled,
            "upload_platforms": upload_platforms_list,
            "upload_status": upload_status_dict,
            "uploaded_urls": uploaded_urls_dict,
            "upload_error": self.upload_error,
        }

    @staticmethod
    def from_dict(data):
        """Create Job instance from dictionary."""
        return Job(
            id=data.get("id"),
            status=data.get("status", "queued"),
            created_at=data.get("created_at"),
            started_at=data.get("started_at"),
            finished_at=data.get("finished_at"),
            payload=json.dumps(data.get("payload", {})) if data.get("payload") else None,
            total=data.get("total", 0),
            done=data.get("done", 0),
            success=data.get("success", 0),
            current=data.get("current", 0),
            status_text=data.get("status_text"),
            stage=data.get("stage"),
            stage_at=data.get("stage_at"),
            stage_clip=data.get("stage_clip", 0),
            subtitle_enabled=data.get("subtitle_enabled", False),
            outputs=json.dumps(data.get("outputs", [])) if data.get("outputs") else None,
            error=data.get("error"),
            logs=json.dumps(data.get("logs", [])) if data.get("logs") else None,
        )


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_job(db_session, job_id):
    """Get job by ID."""
    return db_session.query(Job).filter(Job.id == job_id).first()


def create_job(db_session, job_data):
    """Create new job."""
    job = Job.from_dict(job_data)
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    return job


def update_job(db_session, job_id, **kwargs):
    """Update job fields."""
    job = get_job(db_session, job_id)
    if not job:
        return None

    for key, value in kwargs.items():
        if hasattr(job, key):
            # Convert lists/dicts to JSON strings for Text columns
            if key in ["outputs", "logs", "payload"] and isinstance(value, (list, dict)):
                setattr(job, key, json.dumps(value))
            else:
                setattr(job, key, value)

    db_session.commit()
    db_session.refresh(job)
    return job


def add_log(db_session, job_id, line):
    """Add log line to job."""
    job = get_job(db_session, job_id)
    if not job:
        return

    try:
        logs = json.loads(job.logs) if job.logs else []
    except:
        logs = []

    logs.append(line)
    if len(logs) > 300:
        logs = logs[-300:]

    job.logs = json.dumps(logs)
    db_session.commit()
