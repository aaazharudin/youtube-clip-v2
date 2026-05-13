"""
Auto Upload Service for YouTube and TikTok
Handles authentication, upload, and status tracking
"""
import os
import json
import pickle
import logging
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime

# YouTube API imports
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    YOUTUBE_AVAILABLE = True
except ImportError:
    YOUTUBE_AVAILABLE = False

# TikTok imports
try:
    from tiktok_uploader.upload import upload_video as tiktok_upload_video
    from tiktok_uploader.auth import AuthBackend
    TIKTOK_AVAILABLE = False  # Will implement later
except ImportError:
    TIKTOK_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class YouTubeUploader:
    """Handle YouTube upload with OAuth2"""
    
    SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
    TOKEN_FILE = 'data/youtube_token.pickle'
    CREDENTIALS_FILE = 'data/youtube_credentials.json'
    
    def __init__(self):
        self.credentials = None
        self.youtube = None
        
    def authenticate(self) -> bool:
        """Authenticate with YouTube API using OAuth2"""
        if not YOUTUBE_AVAILABLE:
            logger.error("YouTube API libraries not installed")
            return False
            
        # Load saved credentials
        if os.path.exists(self.TOKEN_FILE):
            with open(self.TOKEN_FILE, 'rb') as token:
                self.credentials = pickle.load(token)
        
        # Refresh or get new credentials
        if not self.credentials or not self.credentials.valid:
            if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                try:
                    self.credentials.refresh(Request())
                except Exception as e:
                    logger.error(f"Token refresh failed: {e}")
                    return False
            else:
                if not os.path.exists(self.CREDENTIALS_FILE):
                    logger.error(f"Credentials file not found: {self.CREDENTIALS_FILE}")
                    return False
                    
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.CREDENTIALS_FILE, self.SCOPES)
                self.credentials = flow.run_local_server(port=8080)
                
            # Save credentials
            os.makedirs(os.path.dirname(self.TOKEN_FILE), exist_ok=True)
            with open(self.TOKEN_FILE, 'wb') as token:
                pickle.dump(self.credentials, token)
        
        # Build YouTube service
        self.youtube = build('youtube', 'v3', credentials=self.credentials)
        return True
    
    def upload(
        self,
        video_path: str,
        title: str,
        description: str = "",
        tags: List[str] = None,
        category_id: str = "22",  # People & Blogs
        privacy_status: str = "public"
    ) -> Dict:
        """
        Upload video to YouTube Shorts
        
        Args:
            video_path: Path to video file
            title: Video title (max 100 chars)
            description: Video description
            tags: List of tags
            category_id: YouTube category ID
            privacy_status: public, private, or unlisted
            
        Returns:
            Dict with upload status and video URL
        """
        if not self.youtube:
            if not self.authenticate():
                return {"success": False, "error": "Authentication failed"}
        
        if not os.path.exists(video_path):
            return {"success": False, "error": f"Video file not found: {video_path}"}
        
        # Prepare title and description for Shorts
        shorts_title = title[:100]  # YouTube limit
        shorts_description = description
        if not shorts_description:
            shorts_description = "Created with Video Clipper Pro #Shorts"
        else:
            shorts_description += "\n\n#Shorts"
        
        # Prepare tags
        if tags is None:
            tags = ["Shorts", "viral", "trending"]
        
        # Request body
        body = {
            'snippet': {
                'title': shorts_title,
                'description': shorts_description,
                'tags': tags,
                'categoryId': category_id
            },
            'status': {
                'privacyStatus': privacy_status,
                'selfDeclaredMadeForKids': False
            }
        }
        
        # Media file
        media = MediaFileUpload(
            video_path,
            mimetype='video/mp4',
            resumable=True,
            chunksize=1024*1024  # 1MB chunks
        )
        
        try:
            # Execute upload
            logger.info(f"Uploading to YouTube: {shorts_title}")
            request = self.youtube.videos().insert(
                part='snippet,status',
                body=body,
                media_body=media
            )
            
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    logger.info(f"Upload progress: {progress}%")
            
            video_id = response['id']
            video_url = f"https://www.youtube.com/shorts/{video_id}"
            
            logger.info(f"Upload successful! URL: {video_url}")
            return {
                "success": True,
                "video_id": video_id,
                "url": video_url,
                "title": shorts_title
            }
            
        except Exception as e:
            logger.error(f"YouTube upload failed: {e}")
            return {"success": False, "error": str(e)}


class TikTokUploader:
    """Handle TikTok upload"""
    
    SESSION_FILE = 'data/tiktok_session.json'
    
    def __init__(self):
        self.session_data = None
        
    def authenticate(self, username: str = None, password: str = None) -> bool:
        """
        Authenticate with TikTok
        Note: TikTok upload is complex and may require manual session
        """
        if not TIKTOK_AVAILABLE:
            logger.warning("TikTok uploader not available - install tiktok-uploader package")
            return False
            
        # For now, return False - TikTok upload requires manual implementation
        # Will be implemented in Phase 3
        logger.warning("TikTok upload not yet implemented")
        return False
    
    def upload(
        self,
        video_path: str,
        caption: str,
        tags: List[str] = None,
        privacy: str = "public"
    ) -> Dict:
        """
        Upload video to TikTok
        
        Args:
            video_path: Path to video file
            caption: Video caption
            tags: List of hashtags
            privacy: public or private
            
        Returns:
            Dict with upload status and video URL
        """
        if not TIKTOK_AVAILABLE:
            return {"success": False, "error": "TikTok uploader not available"}
        
        # Prepare caption with hashtags
        full_caption = caption
        if tags:
            hashtags = " ".join([f"#{tag}" for tag in tags])
            full_caption = f"{caption}\n\n{hashtags}"
        
        try:
            # TikTok upload implementation
            # This is a placeholder - actual implementation depends on library
            logger.warning("TikTok upload not yet implemented")
            return {"success": False, "error": "TikTok upload not yet implemented"}
            
        except Exception as e:
            logger.error(f"TikTok upload failed: {e}")
            return {"success": False, "error": str(e)}


class UploadManager:
    """Manage uploads to multiple platforms"""
    
    def __init__(self):
        self.youtube = YouTubeUploader()
        self.tiktok = TikTokUploader()
    
    def upload_to_platforms(
        self,
        video_path: str,
        platforms: List[str],
        metadata: Dict
    ) -> Dict:
        """
        Upload video to specified platforms
        
        Args:
            video_path: Path to video file
            platforms: List of platforms ["youtube", "tiktok"]
            metadata: Dict with title, description, tags, etc
            
        Returns:
            Dict with upload results per platform
        """
        results = {}
        
        # Upload to YouTube
        if "youtube" in platforms:
            logger.info("Starting YouTube upload...")
            yt_result = self.youtube.upload(
                video_path=video_path,
                title=metadata.get('title', 'Untitled'),
                description=metadata.get('description', ''),
                tags=metadata.get('tags', []),
                privacy_status=metadata.get('privacy', 'public')
            )
            results['youtube'] = yt_result
        
        # Upload to TikTok
        if "tiktok" in platforms:
            logger.info("Starting TikTok upload...")
            tt_result = self.tiktok.upload(
                video_path=video_path,
                caption=metadata.get('title', 'Untitled'),
                tags=metadata.get('tags', []),
                privacy=metadata.get('privacy', 'public')
            )
            results['tiktok'] = tt_result
        
        return results


def test_youtube_upload():
    """Test YouTube upload functionality"""
    uploader = YouTubeUploader()
    
    if not uploader.authenticate():
        print("❌ Authentication failed")
        return
    
    print("✅ YouTube authentication successful")
    print("Ready to upload videos!")


if __name__ == "__main__":
    # Test authentication
    test_youtube_upload()
