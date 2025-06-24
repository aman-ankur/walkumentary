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

## 3  Phase Breakdown
### Phase 0 – Setup & Styles
1. Install **shadcn/ui Sheet / ScrollArea** already in repo.
2. Add 10-15 SVG templates under `components/artwork/templates.ts`.

### Phase 1 – EnhancedAudioPlayer.tsx
✔️ Copy mock-up layout (`mock_audio_player_v2_with_sub.html`).  
✔️ Add subtitle + list buttons.  
✔️ Use `useRef` + `audio` element like current `AudioPlayer.tsx`, but **lift state** into `AudioPlayerProvider`.

### Phase 2 – SubtitleOverlay.tsx (MVP)
* Full-screen fixed overlay (light & dark via Tailwind class).
* Receives `transcript`, `currentTime`, `setCurrentTime`.
* Scrollable list **without auto-scroll**; clicking line seeks.
* Close button returns focus to player.

### Phase 3 – Routing Flow
1. Existing "Generate Tour" flow ends on _progress_ screen.
2. On **"Begin your journey"** → route to `/tour/[id]/play`.
3. Page fetches tour (audio + transcript) via SWR.

### Phase 4  – (Optional) Timed Auto-Scroll
* Parse transcript with timings.
* `useEffect` every 400 ms: find active index, `scrollIntoView({block:'center'})`.
* Future: switch to WebVTT + `TextTrack` API when hosted on <audio>.

### Phase 5  – Polish
* Random artwork generation (deterministic hash) in `TourArtwork`.
* Responsive tests (mobile VS desktop).
* Unit tests: Jest + React Testing Library for overlay open/seek.
* Cypress E2E: generation ⇒ play ⇒ open subtitles ⇒ seek line.

---

## 4  File/Directory Additions
```
frontend/src/components/audio/
  ├─ EnhancedAudioPlayer.tsx   (new)
  ├─ SubtitleOverlay.tsx       (new)
  └─ TourArtwork.tsx           (new)
frontend/src/app/tour/[tourId]/play/page.tsx  (new route)
frontend/src/lib/mockAudioData.ts             (dev fixtures)
```

---

## 5  Incremental Migration Path
1. **Keep old `AudioPlayer.tsx`** for existing pages.
2. Behind feature flag `NEXT_PUBLIC_PLAYER_V2`; enable for staging.
3. Once stable, delete legacy player & mocks.

---

## 6  Open Questions / Next Steps
1. **Transcript timing accuracy** – confirm LLM returns timestamps; else need aligner.
2. **Map integration** – placeholder now; later integrate Mapbox.
3. Accessibility: add ARIA roles, ensure contrast on dark overlay.

---

_End of plan_ 