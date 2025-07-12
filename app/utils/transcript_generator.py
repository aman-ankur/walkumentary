"""
Transcript generation utilities for creating timestamped transcript segments
from tour content and estimated audio duration.
"""

import re
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class TranscriptGenerator:
    """Generates timestamped transcript segments from tour content."""
    
    @staticmethod
    def generate_transcript_segments(content: str, estimated_duration_seconds: float) -> List[Dict[str, Any]]:
        """
        Generate transcript segments with estimated timing from tour content.
        
        Args:
            content: The tour content text
            estimated_duration_seconds: Expected audio duration in seconds
            
        Returns:
            List of transcript segments with startTime, endTime, and text
        """
        try:
            # Split content into logical segments (sentences/paragraphs)
            segments = TranscriptGenerator._split_content_into_segments(content)
            
            if not segments:
                return []
            
            # Calculate timing for each segment
            transcript_segments = []
            total_chars = sum(len(segment) for segment in segments)
            
            current_time = 0.0
            
            for segment in segments:
                # Calculate segment duration based on character count ratio
                segment_ratio = len(segment) / total_chars if total_chars > 0 else 0
                segment_duration = estimated_duration_seconds * segment_ratio
                
                # Ensure minimum segment duration of 2 seconds
                segment_duration = max(segment_duration, 2.0)
                
                transcript_segments.append({
                    "startTime": round(current_time, 2),
                    "endTime": round(current_time + segment_duration, 2),
                    "text": segment.strip()
                })
                
                current_time += segment_duration
            
            # Adjust final segment to match total duration
            if transcript_segments:
                transcript_segments[-1]["endTime"] = round(estimated_duration_seconds, 2)
            
            logger.info(f"Generated {len(transcript_segments)} transcript segments for {estimated_duration_seconds}s audio")
            return transcript_segments
            
        except Exception as e:
            logger.error(f"Error generating transcript segments: {e}")
            return []
    
    @staticmethod
    def _split_content_into_segments(content: str) -> List[str]:
        """
        Split content into logical segments for transcript timing.
        
        Prioritizes:
        1. Paragraph breaks (double newlines)
        2. Sentence boundaries (periods, exclamation marks, question marks)
        3. Comma-separated phrases if sentences are too long
        """
        # First try to split by paragraphs
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        segments = []
        for paragraph in paragraphs:
            # If paragraph is short enough (< 200 chars), use as single segment
            if len(paragraph) <= 200:
                segments.append(paragraph)
                continue
            
            # Split longer paragraphs by sentences
            sentences = re.split(r'[.!?]+', paragraph)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            for sentence in sentences:
                # If sentence is still too long (> 300 chars), split by phrases
                if len(sentence) > 300:
                    phrases = [p.strip() for p in sentence.split(',') if p.strip()]
                    segments.extend(phrases)
                else:
                    segments.append(sentence)
        
        # Filter out very short segments (< 10 chars) and combine with next
        filtered_segments = []
        for segment in segments:
            if len(segment) < 10 and filtered_segments:
                # Combine with previous segment
                filtered_segments[-1] += f" {segment}"
            else:
                filtered_segments.append(segment)
        
        return filtered_segments
    
    @staticmethod
    def estimate_audio_duration(content: str, words_per_minute: int = 150) -> float:
        """
        Estimate audio duration based on content length and speaking rate.
        
        Args:
            content: Text content
            words_per_minute: Average speaking rate (default: 150 WPM)
            
        Returns:
            Estimated duration in seconds
        """
        word_count = len(content.split())
        duration_minutes = word_count / words_per_minute
        return duration_minutes * 60