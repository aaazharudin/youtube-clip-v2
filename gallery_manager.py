"""
Gallery Management System for Video Clipper Pro
Handles storing clips with metadata in a structured folder format
"""
import os
import re
import json
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


class GalleryManager:
    """Manages clip storage and metadata"""

    def __init__(self, base_path: str = "clips"):
        self.base_path = Path(base_path)
        self.gallery_path = self.base_path / "gallery"
        self.clips_path = self.gallery_path / "clips"
        self.index_file = self.gallery_path / "index.json"

        # Create directories
        self.gallery_path.mkdir(parents=True, exist_ok=True)
        self.clips_path.mkdir(parents=True, exist_ok=True)

    def generate_clip_id(self) -> str:
        """Generate unique ID for a clip"""
        return uuid.uuid4().hex[:12]

    def sanitize_filename(self, title: str, max_length: int = 100) -> str:
        """
        Sanitize title to create a safe filename.

        Args:
            title: The title to sanitize
            max_length: Maximum filename length

        Returns:
            Sanitized filename with .mp4 extension
        """
        # Remove invalid characters
        # Keep only alphanumeric, spaces, and common punctuation
        sanitized = re.sub(r'[<>:"/\\|?*]', '', title)
        # Replace multiple spaces with single space
        sanitized = re.sub(r'\s+', ' ', sanitized)
        # Trim whitespace
        sanitized = sanitized.strip()
        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length].rsplit(' ', 1)[0]
        # Add .mp4 extension
        return f"{sanitized}.mp4"

    def save_clip_to_gallery(
        self,
        job_id: str,
        clip_index: int,
        video_path: str,
        title: str,
        source_url: str,
        source_title: str,
        source_thumbnail: Optional[str] = None,
        duration: int = 0,
        file_size: int = 0
    ) -> Dict:
        """
        Save clip to gallery with metadata

        Returns:
            Dict with clip_id and metadata
        """
        clip_id = self.generate_clip_id()

        # Create clip directory
        clip_dir = self.clips_path / clip_id
        clip_dir.mkdir(exist_ok=True)

        # Generate filename from title
        clip_filename = self.sanitize_filename(title)
        gallery_video_path = clip_dir / clip_filename

        try:
            shutil.copy2(video_path, gallery_video_path)
        except Exception as e:
            raise RuntimeError(f"Failed to copy video: {e}")

        # Save metadata
        metadata = {
            "id": clip_id,
            "job_id": job_id,
            "clip_index": clip_index,
            "filename": clip_filename,
            "title": title,
            "source_url": source_url,
            "source_title": source_title,
            "source_thumbnail": source_thumbnail,
            "duration": duration,
            "file_size": file_size,
            "created_at": int(datetime.now().timestamp() * 1000),
            "tags": [],  # For future use: viral, funny, tutorial, etc.
        }

        metadata_file = clip_dir / "metadata.json"
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

        # Update master index
        self._update_master_index(metadata)

        return metadata

    def _update_master_index(self, metadata: Dict):
        """Update master index.json with new clip"""
        # Load existing index
        clips = []
        if self.index_file.exists():
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    index_data = json.load(f)
                    clips = index_data.get("clips", [])
            except Exception:
                clips = []

        # Add new clip
        clips.append(metadata)

        # Sort by created_at (newest first)
        clips.sort(key=lambda x: x.get("created_at", 0), reverse=True)

        # Save index
        index_data = {
            "updated_at": int(datetime.now().timestamp() * 1000),
            "total": len(clips),
            "clips": clips
        }

        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)

    def get_all_clips(self) -> List[Dict]:
        """Get all clips from gallery"""
        if not self.index_file.exists():
            return []

        try:
            with open(self.index_file, "r", encoding="utf-8") as f:
                index_data = json.load(f)
                return index_data.get("clips", [])
        except Exception:
            return []

    def get_clip(self, clip_id: str) -> Optional[Dict]:
        """Get specific clip metadata"""
        clips = self.get_all_clips()
        for clip in clips:
            if clip.get("id") == clip_id:
                return clip
        return None

    def update_clip_title(self, clip_id: str, new_title: str) -> bool:
        """Update clip title"""
        clip = self.get_clip(clip_id)
        if not clip:
            return False

        # Update in master index
        clips = self.get_all_clips()
        for c in clips:
            if c.get("id") == clip_id:
                c["title"] = new_title
                c["updated_at"] = int(datetime.now().timestamp() * 1000)
                break

        # Save updated index
        index_data = {
            "updated_at": int(datetime.now().timestamp() * 1000),
            "total": len(clips),
            "clips": clips
        }

        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)

        # Update individual metadata file
        metadata_file = self.clips_path / clip_id / "metadata.json"
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            metadata["title"] = new_title
            metadata["updated_at"] = int(datetime.now().timestamp() * 1000)

            with open(metadata_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)

        return True

    def delete_clip(self, clip_id: str) -> bool:
        """Delete clip from gallery"""
        clip = self.get_clip(clip_id)
        if not clip:
            return False

        # Delete clip directory
        clip_dir = self.clips_path / clip_id
        if clip_dir.exists():
            shutil.rmtree(clip_dir)

        # Update master index
        clips = self.get_all_clips()
        clips = [c for c in clips if c.get("id") != clip_id]

        index_data = {
            "updated_at": int(datetime.now().timestamp() * 1000),
            "total": len(clips),
            "clips": clips
        }

        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)

        return True


# Singleton instance
_gallery_manager = None

def get_gallery_manager() -> GalleryManager:
    """Get or create gallery manager instance"""
    global _gallery_manager
    if _gallery_manager is None:
        _gallery_manager = GalleryManager()
    return _gallery_manager
