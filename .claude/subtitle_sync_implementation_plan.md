# Subtitle Synchronization Implementation Plan

_**Priority**: Phase 2 feature for Enhanced Audio Player v2_  
_**Dependencies**: Audio Player v2 UI implementation complete_  
_**Estimated Timeline**: 2-3 weeks development + 1 week testing_

---

## Overview

This document outlines the technical implementation for precise subtitle synchronization in the Walkumentary Enhanced Audio Player. The system ensures perfect timing between generated audio content and transcript display through multiple alignment strategies.

---

## Current State Analysis

### What We Have
- ✅ Audio generation via OpenAI TTS-1
- ✅ Text content generation via multi-LLM system
- ✅ Basic transcript storage in database
- ✅ Audio player UI with basic controls

### What's Missing
- ❌ Precise timing data for transcript segments
- ❌ Audio-text alignment pipeline
- ❌ Subtitle synchronization engine
- ❌ Fallback timing strategies

---

## Technical Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Tour Content  │───▶│ Alignment Engine │───▶│ Timed Transcript│
│   Generation    │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Audio File     │    │ Alignment Data   │    │ Frontend Sync   │
│  (.mp3)         │    │ (.json)          │    │ Engine          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## Implementation Strategy

### Phase 1: Data Model Updates

#### Backend Schema Changes
```python
# backend/models/tour.py

class TranscriptSegment(BaseModel):
    text: str
    start_time: float  # seconds
    end_time: float    # seconds
    confidence: Optional[float] = None  # alignment confidence 0-1
    word_count: int
    
class Tour(BaseModel):
    # existing fields...
    transcript: List[TranscriptSegment] = []
    audio_duration: Optional[float] = None
    alignment_method: Optional[str] = None  # "forced", "estimated", "manual"
```

#### Database Migration
```sql
-- Add columns to tours table
ALTER TABLE tours ADD COLUMN audio_duration REAL;
ALTER TABLE tours ADD COLUMN alignment_method VARCHAR(20);

-- Update transcript JSON structure
-- (handled by application layer - no schema change needed)
```

### Phase 2: Alignment Engine Implementation

#### Option A: Forced Alignment (Recommended)
```python
# backend/services/audio_alignment.py

import gentle
import subprocess
import tempfile
from pathlib import Path

class AudioAlignmentService:
    def __init__(self):
        self.gentle_resample = gentle.resample
        self.gentle_align = gentle.align
    
    async def align_transcript(self, audio_data: bytes, transcript_text: str) -> List[TranscriptSegment]:
        """
        Use forced alignment to generate precise timestamps
        """
        try:
            # Save audio to temp file
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_audio:
                temp_audio.write(audio_data)
                temp_audio_path = temp_audio.name
            
            # Convert to WAV for Gentle
            wav_path = temp_audio_path.replace('.mp3', '.wav')
            subprocess.run([
                'ffmpeg', '-i', temp_audio_path, 
                '-ar', '8000', '-ac', '1', wav_path
            ], check=True)
            
            # Run forced alignment
            alignment_result = self.gentle_align(wav_path, transcript_text)
            
            # Convert to our format
            segments = []
            for word_info in alignment_result['words']:
                if word_info.get('case') == 'success':
                    segments.append(TranscriptSegment(
                        text=word_info['word'],
                        start_time=word_info['start'],
                        end_time=word_info['end'], 
                        confidence=word_info.get('confidence', 0.8),
                        word_count=1
                    ))
            
            # Group words into sentences
            return self._group_into_sentences(segments, transcript_text)
            
        except Exception as e:
            logger.error(f"Forced alignment failed: {e}")
            return self._fallback_alignment(transcript_text, estimated_duration)
    
    def _group_into_sentences(self, word_segments: List[TranscriptSegment], 
                            original_text: str) -> List[TranscriptSegment]:
        """Group individual words into sentence-level segments"""
        sentences = original_text.split('.')
        grouped_segments = []
        
        current_word_idx = 0
        for sentence in sentences:
            if not sentence.strip():
                continue
                
            sentence_words = sentence.strip().split()
            if current_word_idx + len(sentence_words) > len(word_segments):
                break
                
            start_time = word_segments[current_word_idx].start_time
            end_time = word_segments[current_word_idx + len(sentence_words) - 1].end_time
            
            grouped_segments.append(TranscriptSegment(
                text=sentence.strip() + '.',
                start_time=start_time,
                end_time=end_time,
                confidence=min(seg.confidence for seg in 
                             word_segments[current_word_idx:current_word_idx + len(sentence_words)]),
                word_count=len(sentence_words)
            ))
            
            current_word_idx += len(sentence_words)
        
        return grouped_segments
```

#### Option B: Fallback Estimation
```python
# backend/services/audio_alignment.py (continued)

def _fallback_alignment(self, transcript_text: str, 
                       estimated_duration: float) -> List[TranscriptSegment]:
    """
    Simple time-based estimation when forced alignment fails
    """
    sentences = [s.strip() + '.' for s in transcript_text.split('.') if s.strip()]
    total_chars = sum(len(s) for s in sentences)
    
    segments = []
    current_time = 0.0
    
    for sentence in sentences:
        # Estimate duration based on character count and speaking rate
        char_ratio = len(sentence) / total_chars
        segment_duration = estimated_duration * char_ratio
        
        segments.append(TranscriptSegment(
            text=sentence,
            start_time=current_time,
            end_time=current_time + segment_duration,
            confidence=0.6,  # Lower confidence for estimates
            word_count=len(sentence.split())
        ))
        
        current_time += segment_duration
    
    return segments
```

### Phase 3: Integration with Tour Generation

#### Updated Tour Generation Flow
```python
# backend/services/tour_service.py

class TourService:
    def __init__(self):
        self.audio_service = AudioService()
        self.alignment_service = AudioAlignmentService()
    
    async def generate_tour_with_sync(self, tour_request: TourRequest) -> Tour:
        """Enhanced tour generation with subtitle synchronization"""
        
        # Step 1: Generate content (existing)
        content = await self.content_service.generate_content(tour_request)
        
        # Step 2: Generate audio (existing)
        audio_data = await self.audio_service.generate_audio(content.text)
        
        # Step 3: NEW - Generate synchronized transcript
        try:
            transcript_segments = await self.alignment_service.align_transcript(
                audio_data, content.text
            )
            alignment_method = "forced"
        except Exception as e:
            logger.warning(f"Forced alignment failed, using fallback: {e}")
            transcript_segments = self.alignment_service._fallback_alignment(
                content.text, estimated_duration=len(audio_data) / 16000  # rough estimate
            )
            alignment_method = "estimated"
        
        # Step 4: Save tour with synchronized data
        tour = Tour(
            id=str(uuid.uuid4()),
            title=content.title,
            description=content.description,
            content=content.text,
            transcript=transcript_segments,
            audio_duration=transcript_segments[-1].end_time if transcript_segments else None,
            alignment_method=alignment_method,
            # ... other fields
        )
        
        return await self.save_tour(tour, audio_data)
```

### Phase 4: Frontend Synchronization Engine

#### Enhanced Audio Player State Management
```typescript
// frontend/src/lib/stores/audioPlayerStore.ts

interface AudioPlayerState {
  // Existing state...
  currentTime: number;
  transcript: TranscriptSegment[];
  currentSegmentIndex: number;
  autoScroll: boolean;
  
  // New sync methods
  getCurrentSegment: () => TranscriptSegment | null;
  getVisibleSegments: () => TranscriptSegment[];
  seekToSegment: (segmentIndex: number) => void;
  syncTranscript: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  // ... existing state
  
  getCurrentSegment: () => {
    const { currentTime, transcript } = get();
    return transcript.find(
      segment => currentTime >= segment.start_time && currentTime <= segment.end_time
    ) || null;
  },
  
  getVisibleSegments: () => {
    const { currentSegmentIndex, transcript } = get();
    const startIndex = Math.max(0, currentSegmentIndex - 2);
    const endIndex = Math.min(transcript.length, currentSegmentIndex + 6);
    return transcript.slice(startIndex, endIndex);
  },
  
  seekToSegment: (segmentIndex: number) => {
    const { transcript, audioRef } = get();
    if (audioRef && transcript[segmentIndex]) {
      audioRef.currentTime = transcript[segmentIndex].start_time;
      set({ currentSegmentIndex: segmentIndex });
    }
  },
  
  syncTranscript: () => {
    const { currentTime, transcript } = get();
    const newIndex = transcript.findIndex(
      segment => currentTime >= segment.start_time && currentTime <= segment.end_time
    );
    
    if (newIndex !== -1 && newIndex !== get().currentSegmentIndex) {
      set({ currentSegmentIndex: newIndex });
    }
  }
}));
```

#### Sync Engine Component
```typescript
// frontend/src/components/audio/TranscriptSyncEngine.tsx

import { useEffect, useRef } from 'react';
import { useAudioPlayerStore } from '@/lib/stores/audioPlayerStore';

interface TranscriptSyncEngineProps {
  syncInterval?: number; // milliseconds
  autoScrollEnabled?: boolean;
}

export function TranscriptSyncEngine({ 
  syncInterval = 100,
  autoScrollEnabled = true 
}: TranscriptSyncEngineProps) {
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const scrollContainerRef = useRef<HTMLElement>();
  
  const {
    isPlaying,
    currentTime,
    syncTranscript,
    getCurrentSegment,
    currentSegmentIndex
  } = useAudioPlayerStore();
  
  // Main sync loop
  useEffect(() => {
    if (isPlaying) {
      syncIntervalRef.current = setInterval(() => {
        syncTranscript();
      }, syncInterval);
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    }
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isPlaying, syncInterval, syncTranscript]);
  
  // Auto-scroll to current segment
  useEffect(() => {
    if (autoScrollEnabled && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector(
        `[data-segment-index="${currentSegmentIndex}"]`
      );
      
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentSegmentIndex, autoScrollEnabled]);
  
  return null; // This is a logic-only component
}
```

---

## Performance Optimizations

### Backend Optimizations
```python
# Caching alignment results
@cached(ttl=3600)
async def get_cached_alignment(audio_hash: str, text_hash: str) -> List[TranscriptSegment]:
    """Cache alignment results to avoid recomputation"""
    pass

# Background processing
async def process_alignment_async(tour_id: str):
    """Process alignment in background after initial tour creation"""
    pass
```

### Frontend Optimizations
```typescript
// Memoized segment rendering
const MemoizedSegment = React.memo(({ segment, isActive, onClick }) => (
  <div 
    className={`segment ${isActive ? 'active' : ''}`}
    onClick={() => onClick(segment.start_time)}
  >
    {segment.text}
  </div>
));

// Virtual scrolling for long transcripts
import { FixedSizeList as List } from 'react-window';

const VirtualizedTranscript = ({ segments }) => (
  <List
    height={400}
    itemCount={segments.length}
    itemSize={60}
    itemData={segments}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <MemoizedSegment segment={data[index]} />
      </div>
    )}
  </List>
);
```

---

## Testing Strategy

### Unit Tests
```python
# backend/tests/test_audio_alignment.py

def test_forced_alignment_success():
    service = AudioAlignmentService()
    # Mock audio data and transcript
    result = service.align_transcript(mock_audio, mock_transcript)
    assert len(result) > 0
    assert all(seg.start_time < seg.end_time for seg in result)

def test_fallback_alignment():
    service = AudioAlignmentService()
    result = service._fallback_alignment("Hello world. How are you?", 10.0)
    assert len(result) == 2
    assert result[0].confidence < 1.0
```

```typescript
// frontend/src/components/audio/__tests__/sync-engine.test.tsx

describe('TranscriptSyncEngine', () => {
  it('should sync transcript on time updates', () => {
    const mockStore = createMockStore();
    render(<TranscriptSyncEngine />, { store: mockStore });
    
    // Simulate time update
    act(() => {
      mockStore.setState({ currentTime: 15.5 });
    });
    
    expect(mockStore.getState().currentSegmentIndex).toBe(2);
  });
});
```

### Integration Tests
```python
# backend/tests/test_tour_generation_with_sync.py

async def test_full_tour_generation_with_sync():
    tour_request = TourRequest(location="Paris", interests=["history"])
    tour = await tour_service.generate_tour_with_sync(tour_request)
    
    assert tour.transcript is not None
    assert len(tour.transcript) > 0
    assert tour.audio_duration > 0
    assert tour.alignment_method in ["forced", "estimated"]
```

---

## Deployment Strategy

### Phase 1: Backend Infrastructure
1. Deploy alignment service behind feature flag
2. Update tour generation API to include transcript timing
3. Migrate existing tours with fallback alignment

### Phase 2: Frontend Integration  
1. Deploy sync engine as opt-in feature
2. A/B test synchronized vs non-synchronized experience
3. Monitor performance metrics

### Phase 3: Full Rollout
1. Enable sync by default for new tours
2. Background processing for existing tour alignment
3. Monitor user engagement metrics

---

## Monitoring & Metrics

### Key Performance Indicators
- **Alignment Accuracy**: % of segments with >0.8 confidence
- **Sync Latency**: Time from audio position change to transcript update
- **User Engagement**: Time spent with subtitles enabled
- **Error Rate**: % of tours failing alignment

### Monitoring Setup
```python
# backend/monitoring/alignment_metrics.py

import prometheus_client

alignment_duration = prometheus_client.Histogram(
    'audio_alignment_duration_seconds',
    'Time spent on audio alignment',
    ['method']
)

alignment_confidence = prometheus_client.Histogram(
    'audio_alignment_confidence',
    'Confidence score of alignment results',
    ['method']
)
```

---

## Risk Mitigation

### Technical Risks
1. **Alignment Failure**: Always fallback to time-based estimation
2. **Performance Impact**: Cache results, use background processing
3. **Audio Quality**: Validate alignment against known good samples

### User Experience Risks
1. **Sync Drift**: Implement drift correction algorithm
2. **Mobile Performance**: Reduce sync frequency on low-end devices
3. **Network Issues**: Preload transcript data with audio

---

## Future Enhancements

### Advanced Features
- **Word-level highlighting**: Highlight individual words as they're spoken
- **Multi-language support**: Alignment for different languages
- **Voice activity detection**: Skip silence periods in alignment
- **User corrections**: Allow manual timing adjustments

### Integration Opportunities
- **WebVTT export**: Standard subtitle format support
- **Screen reader compatibility**: Enhanced accessibility features
- **Analytics integration**: Track which segments users replay most

---

## Conclusion

This implementation plan provides a robust foundation for subtitle synchronization in Walkumentary's Enhanced Audio Player. The multi-tier approach ensures reliability through fallback mechanisms while optimizing for performance and user experience.

**Next Steps**: Begin with Phase 1 (data model updates) once Audio Player v2 UI is complete.