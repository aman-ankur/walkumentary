# Walkumentary ‑ Next-Gen Audio Player & Subtitles – Implementation Plan

## Overview
This document turns the approved mock-ups into an actionable engineering plan.  It covers API/data needs, React/Next.js component work, routing changes, and phased rollout.  MVP scope is **scrollable transcript (no timed auto-scroll)** with future hooks ready for full sync.

---

## 1  Data & API Contracts
| Purpose | Field | Type | Notes |
|---------|-------|------|-------|
| Audio stream | `audio_url` | string | Already returned by `/tours/{id}` |
| Transcript | `transcript` | array of `{ startTime: number; endTime: number; text: string; }` | LLM generates when tour is created; keep in DB |
| Artwork | deterministic index | number (0-14) | **Hash(tour.id) % artworkTemplates.length** on FE – no BE change |

> MVP: if timestamps absent, set them to incremental 8 s blocks so overlay still renders.

---

## 2  Component Tree (Frontend)
```
app/tour/[tourId]/play/page.tsx  (➡ new)
 ├─ <EnhancedAudioPlayer>  (frontend/src/components/audio/EnhancedAudioPlayer.tsx)
 │    ├─ <TourArtwork>
 │    ├─ progress / controls / subtitle + list buttons
 │    └─ <SubtitleOverlay> (portal)
 └─ (optional) <MapRoute>  (placeholder)
```
Supporting context:
* `AudioPlayerProvider` already exists → extend with `transcript`, `currentTime`, `setCurrentTime` to share state between player & overlay.

---

## 3  Phase Breakdown & Current Status

### Phase 0 – Setup & Styles ✅ COMPLETE
✅ **shadcn/ui components** already available in repo  
⏳ Add 10-15 SVG templates under `components/artwork/templates.ts` (basic implementation done)

### Phase 1 – EnhancedAudioPlayer.tsx ✅ COMPLETE
✅ **Modern layout implemented** (`EnhancedAudioPlayer.tsx` - 125 lines)  
✅ **Subtitle + controls** integrated with proper button styling  
✅ **AudioPlayerProvider integration** - using existing context for state management  
✅ **Orange theme styling** with rounded corners, shadows, professional appearance
✅ **Progress controls** with time display and seek functionality
✅ **Skip controls** (±15s) with proper button layout

### Phase 2 – SubtitleOverlay.tsx (MVP) ✅ COMPLETE
✅ **Full-screen overlay** implemented (`SubtitleOverlay.tsx` - 66 lines)
✅ **Transcript display** with proper scrollable list interface
✅ **Click-to-seek** functionality working with onSeek callback
✅ **Current segment highlighting** - active transcript segment highlighted
✅ **Close button** with proper focus management
✅ **Responsive design** with max-height and proper mobile handling

### Phase 3 – Routing Flow ✅ COMPLETE  
✅ **New route** `/tour/[tourId]/play` implemented
✅ **Tour fetching** via api.getTour() with proper loading states
✅ **Feature flag integration** - `NEXT_PUBLIC_PLAYER_V2` conditional rendering
✅ **Audio loading** - automatic track loading when tour has audio_url
✅ **Error handling** - graceful fallbacks and navigation

### Phase 4 – Timed Auto-Scroll ⏳ IN PROGRESS
⏳ **Auto-scroll implementation** - basic current segment detection working
⏳ **Smooth scroll behavior** - needs `scrollIntoView` with center alignment
⏳ **Performance optimization** - implement 400ms useEffect interval
🔄 **Future enhancement** - WebVTT + TextTrack API integration planned

### Phase 5 – Polish ⏳ PARTIALLY COMPLETE
✅ **Basic artwork generation** - TourArtwork.tsx with deterministic hash concept
⏳ **15 artwork templates** - currently basic implementation, needs expansion
✅ **Mobile responsive** - player works on mobile and desktop  
⏳ **Unit tests** - Jest + React Testing Library for components
⏳ **E2E tests** - Cypress flow: generation → play → subtitles → seek

---

## 4  File/Directory Status ✅ IMPLEMENTED
```
frontend/src/components/audio/
  ├─ EnhancedAudioPlayer.tsx   ✅ COMPLETE (125 lines)
  ├─ SubtitleOverlay.tsx       ✅ COMPLETE (66 lines)
  └─ TourArtwork.tsx           ✅ BASIC IMPL (34 lines) - needs template expansion
frontend/src/app/tour/[tourId]/play/page.tsx  ✅ COMPLETE (117 lines)
frontend/src/lib/mockAudioData.ts             ⏳ Not needed - using real API data
```

**Latest Implementation Details (Commit 7e93591):**
- **EnhancedAudioPlayer**: Professional UI with orange theme, progress slider, skip controls
- **SubtitleOverlay**: Full-screen modal with transcript list, current segment highlighting
- **TourArtwork**: Placeholder for SVG generation (needs 15 template variations)
- **Player page**: Feature flag conditional rendering, proper tour fetching, error handling
- **Integration**: Works with existing AudioPlayerProvider context

---

## 5  Incremental Migration Path
1. **Keep old `AudioPlayer.tsx`** for existing pages.
2. Behind feature flag `NEXT_PUBLIC_PLAYER_V2`; enable for staging.
3. Once stable, delete legacy player & mocks.

---

## 6  Next Steps & Outstanding Items

### 🎯 Immediate Priorities (Next Sprint)
1. **Auto-scroll subtitles** - implement smooth scroll to current segment every 400ms
2. **Advanced artwork** - expand TourArtwork with 15 SVG template variations  
3. **Backend transcript verification** - ensure `/tours/{id}` returns proper timestamped format
4. **Performance optimization** - minimize re-renders in SubtitleOverlay

### 🔍 Technical Verification Needed
1. **Transcript timing accuracy** - ⚠️ Need to verify LLM returns proper timestamps
2. **Audio sync precision** - test subtitle alignment with actual audio playback
3. **Mobile performance** - optimize large transcript scrolling on mobile devices

### 🚀 Future Enhancements (Phase 2B)
1. **Map integration** - replace placeholder with interactive Mapbox integration
2. **Accessibility** - add ARIA roles, keyboard navigation, screen reader support
3. **Advanced features** - playback speed affects subtitle timing, bookmarks
4. **WebVTT support** - upgrade from custom format to standard WebVTT + TextTrack API

### ✅ Successfully Completed
- Core audio player v2 with modern UI ✅
- Subtitle overlay with basic functionality ✅  
- Feature flag system for safe rollout ✅
- Mobile-responsive design ✅
- Integration with existing AudioPlayerProvider ✅
- End-to-end flow from tour generation to enhanced playback ✅

---

_End of plan_ 