"""
AI-Powered Clickbait Title Generator
Supports multiple AI providers: Groq (free), OpenAI, Anthropic, Gemini
"""
import os
import json
import requests
from typing import Optional
from pathlib import Path

class ClickbaitAI:
    """Generate viral clickbait titles using AI"""

    def __init__(self, provider="groq"):
        self.provider = provider
        self.api_key = os.getenv(f"{provider.upper()}_API_KEY")

    def generate_title(self, video_path: str = None, source_context: str = None, transcript: str = None, video_title: str = "", duration: int = 0) -> str:
        """
        Generate clickbait title.

        Simple interface:
            video_path: Path to video file (for subtitle extraction)
            source_context: Context about the source video

        Advanced interface:
            transcript: Transcribed text from clip
            video_title: Original YouTube video title
            duration: Clip duration in seconds
        """
        # Parse source context if provided
        if source_context:
            lines = source_context.strip().split('\n')
            for line in lines:
                if line.startswith('Video:'):
                    video_title = line.split(':', 1)[1].strip()
                elif line.startswith('Channel:'):
                    # Could use channel name for context
                    pass

        # Try to extract subtitle from video if transcript not provided
        if not transcript and video_path:
            transcript = self._extract_subtitle_from_video(video_path)

        # If still no transcript, use video title as context
        if not transcript:
            transcript = video_title or "Konten menarik"

        # Use default duration if not provided
        if duration == 0:
            duration = 30  # Assume 30 seconds

        # Extract key phrases from transcript
        key_text = self._extract_key_phrases(transcript)

        if self.provider == "groq":
            return self._generate_groq(key_text, video_title, duration)
        elif self.provider == "openai":
            return self._generate_openai(key_text, video_title, duration)
        elif self.provider == "anthropic":
            return self._generate_anthropic(key_text, video_title, duration)
        elif self.provider == "gemini":
            return self._generate_gemini(key_text, video_title, duration)
        else:
            return self._generate_template(key_text, video_title, duration)

    def _extract_subtitle_from_video(self, video_path: str) -> Optional[str]:
        """Try to extract subtitle from video file using ffmpeg"""
        import subprocess
        import tempfile

        try:
            # Check if there's a subtitle stream
            probe_cmd = [
                "ffprobe", "-v", "error",
                "-select_streams", "s",
                "-show_entries", "stream=index",
                "-of", "csv=p=0",
                video_path
            ]
            result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=5)

            if result.returncode == 0 and result.stdout.strip():
                # Has subtitle, extract it
                with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False) as f:
                    srt_path = f.name

                extract_cmd = [
                    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                    "-i", video_path,
                    "-map", "0:s:0",
                    srt_path
                ]
                subprocess.run(extract_cmd, capture_output=True, timeout=10)

                # Read and parse subtitle
                with open(srt_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Extract text from SRT (simple parsing)
                lines = content.split('\n')
                text_lines = []
                for line in lines:
                    line = line.strip()
                    # Skip timestamps, index numbers, and empty lines
                    if line and not line.startswith(('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')) and '-->' not in line:
                        # Remove HTML tags
                        import re
                        clean = re.sub(r'<[^>]+>', '', line)
                        if len(clean) > 2:
                            text_lines.append(clean)

                # Clean up temp file
                try:
                    os.unlink(srt_path)
                except:
                    pass

                if text_lines:
                    return ' '.join(text_lines[:20])  # First 20 subtitle lines
        except Exception as e:
            print(f"Subtitle extraction failed: {e}")

        return None

    def _extract_key_phrases(self, transcript: str, max_chars: int = 200) -> str:
        """Extract most interesting part from transcript"""
        # Remove common filler words
        filler = ["yang", "dan", "ada", "ini", "itu", "yang", "jadi", "karena"]
        words = transcript.split()
        meaningful = [w for w in words if len(w) > 3 and w.lower() not in filler]

        # Take first N characters (most important usually at beginning)
        text = " ".join(meaningful)
        return text[:max_chars]

    def _generate_groq(self, text: str, video_title: str, duration: int) -> str:
        """Generate using Groq (FREE - Llama 3)"""
        url = "https://api.groq.com/openai/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
            "Content-Type": "application/json"
        }

        prompt = self._build_prompt(text, video_title, duration)

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": "Kamu adalah ahli membuat judul clickbait viral bahasa Indonesia untuk konten media sosial (TikTok, Instagram Reels, YouTube Shorts). Judul harus: pendek (maks 15 kata), menarik, memancing rasa penasaran, dan menggunakan emoji yang tepat. Jangan terlalu berlebihan tapi tetap viral."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.9,
            "max_tokens": 60
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            if response.status_code == 200:
                result = response.json()
                title = result["choices"][0]["message"]["content"].strip()
                # Clean up any quotes and common prefixes
                title = title.strip('"\'')
                # Remove common AI prefixes if any
                for prefix in ["Judul:", "Title:", "Berikut ", "Ini "]:
                    if title.startswith(prefix):
                        title = title[len(prefix):].strip()
                return title if title else self._generate_template(text, video_title, duration)
            else:
                print(f"Groq API returned status {response.status_code}")
        except requests.exceptions.Timeout:
            print("Groq API timeout (15s)")
        except Exception as e:
            print(f"Groq API error: {e}")

        # Fallback to template
        return self._generate_template(text, video_title, duration)

    def _generate_openai(self, text: str, video_title: str, duration: int) -> str:
        """Generate using OpenAI GPT"""
        import openai

        client = openai.OpenAI(api_key=self.api_key)

        prompt = self._build_prompt(text, video_title, duration)

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Kamu adalah ahli membuat judul clickbait viral bahasa Indonesia."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.9,
                max_tokens=60
            )
            return response.choices[0].message.content.strip('"\'')
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._generate_template(text, video_title, duration)

    def _generate_gemini(self, text: str, video_title: str, duration: int) -> str:
        """Generate using Google Gemini"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.api_key}"

        prompt = self._build_prompt(text, video_title, duration)

        payload = {
            "contents": [{
                "parts": [{"text": f"Kamu adalah ahli membuat judul clickbait viral bahasa Indonesia.\n\n{prompt}"}]
            }],
            "generationConfig": {
                "temperature": 0.9,
                "maxOutputTokens": 60,
            }
        }

        try:
            response = requests.post(url, json=payload, timeout=15)
            if response.status_code == 200:
                result = response.json()
                title = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                return title.strip('"\'')
        except Exception as e:
            print(f"Gemini API error: {e}")

        return self._generate_template(text, video_title, duration)

    def _build_prompt(self, text: str, video_title: str, duration: int) -> str:
        """Build prompt for AI"""
        # Extract keywords for better context
        keywords = self._extract_keywords(text, num_keywords=5)
        keyword_str = ", ".join(keywords[:5])

        return f"""Buat 1 judul clickbait viral bahasa Indonesia (maks 15 kata, pakai emoji) untuk klip video pendek.

Konteks:
- Kata kunci: {keyword_str}
- Judul video asli: "{video_title[:100] if video_title else 'N/A'}"
- Durasi: {duration} detik

Style judul yang diinginkan:
- Pendek & padat (maks 15 kata)
- Memancing rasa penasaran
- Viral & engaging untuk TikTok/Reels/Shorts
- Menggunakan emoji yang tepat
- Natural seperti bahasa sehari-hari
- Tidak terlalu berlebihan tapi tetap menarik

Contoh style yang bagus:
- "Gak nyangka bisa segininya... 🤯"
- "Satu detik ini yang bikin heboh... 🔥"
- "Reaksi yang gak terduga... 😱"

Hanya output judulnya saja, tanpa penjelasan tambahan."""

    def _generate_template(self, text: str, video_title: str, duration: int) -> str:
        """Fallback template-based generation with more variety"""
        import random

        # Extract keywords from text for more personalized templates
        keywords = self._extract_keywords(text)

        # Templates organized by category
        viral_templates = [
            f"Gak nyangka {random.choice(keywords)} bisa segininya... 🤯",
            f"Momen {random.choice(keywords)} yang NGGAKAK banget nih... 😂🔥",
            f"{duration} detik yang bikin {random.choice(keywords)} viral... 🔥",
            f"Fase童 {random.choice(keywords)} bikin MERINDING... 😱",
            f"Satu detik ini yang bikin heboh tentang {random.choice(keywords)}... 💥",
            f"INI yang bikin {random.choice(keywords)} jadi trending... 😯",
            f"Dibandingin sama {random.choice(keywords)} mah... gak ada! 🤔",
            f"Cuma {duration} detik tapi {random.choice(keywords)}-nya luar biasa... ✨",
            f"Gak akan nyangka {random.choice(keywords)} bisa begini... 😱",
            f"Detik-detik {random.choice(keywords)} yang paling epik... 🔥",
            f"Sumpah {random.choice(keywords)} ini parah banget... 😂",
            f"Reaksi {random.choice(keywords)} yang gak terduga... 🤯",
            f"Waduh {random.choice(keywords)} ternyata... 😱",
            f"Baru tau kalau {random.choice(keywords)} bisa begini... 🤔",
            f"{random.choice(keywords)} versi lain yang bikin heboh... 💥",
            f"Konten tentang {random.choice(keywords)} yang gak boleh dilewatkan... 🔥",
            f"Salah satu momen {random.choice(keywords)} terbaik... ✨",
            f"Bukan kaleng-kaleng {random.choice(keywords)}-nya... 😂",
            f"Level {random.choice(keywords)} berbeda banget... 🤯",
            f"Epic banget {random.choice(keywords)}-nya... 🔥",
        ]

        # If we have video title, create title-specific templates
        if video_title and len(video_title) > 10:
            title_words = video_title.split()[:5]  # First 5 words
            random_word = random.choice(title_words) if title_words else ""
            if random_word:
                title_templates = [
                    f"Potongan {random_word} yang paling viral... 🔥",
                    f"{random_word} versi beda yang bikin heboh... 😂",
                    f"Momen {random_word} yang gak akan terlupakan... ✨",
                    f"Reaksi {random_word} yang gak terduga... 🤯",
                    f"{random_word} tapi versi yang beda banget... 😱",
                ]
                viral_templates.extend(title_templates)

        return random.choice(viral_templates)

    def _extract_keywords(self, text: str, num_keywords: int = 10) -> list:
        """Extract meaningful keywords from text"""
        if not text:
            return ["ini", "konten", "moment"]

        # Common words to filter out
        filler = ["yang", "dan", "ada", "ini", "itu", "jadi", "karena", "dengan",
                  "untuk", "dari", "pada", "ke", "di", "aku", "kamu", "iya", "tidak"]

        # Extract meaningful words (longer than 3 chars)
        words = text.lower().replace('.', ' ').replace(',', ' ').split()
        meaningful = [w for w in words if len(w) > 3 and w not in filler and not w.isdigit()]

        # Remove duplicates
        seen = set()
        unique_meaningful = []
        for w in meaningful:
            if w not in seen:
                seen.add(w)
                unique_meaningful.append(w)

        # Return first N keywords or defaults
        if unique_meaningful:
            return unique_meaningful[:num_keywords]
        else:
            return ["konten", "moment", "kejadian"]


# Singleton instance
_ai_generator = None

def get_ai_generator() -> ClickbaitAI:
    """Get or create AI generator instance"""
    global _ai_generator
    if _ai_generator is None:
        provider = os.getenv("AI_PROVIDER", "groq")  # Default to groq (free)
        _ai_generator = ClickbaitAI(provider=provider)
    return _ai_generator
