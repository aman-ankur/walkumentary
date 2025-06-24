# Audio Player v2 + Subtitle Overlay – Technical Specification

_Last updated: {{DATE}}_

---

## 0. Glossary
| Term | Meaning |
|------|---------|
| **Tour** | Generated walking-tour entity in DB (audio + transcript) |
| **Transcript** | Array of timed text segments ( `startTime`, `endTime`, `text` ) |
| **EAP** | _EnhancedAudioPlayer_ component |
| **SO** | _SubtitleOverlay_ component |

---

## 1. Architecture Overview
```
                   ┌───────────────┐
API (FastAPI)  ⇄  │  /tours/:id    │  → returns { audio_url, transcript, ... }
                   └───────────────┘
                          ↓
Next.js / React (frontend)
  ├─ app/tour/[id]/play/page.tsx (route-level fetch)
  │    ↳ <AudioPlayerProvider>
  │         ↳ <EnhancedAudioPlayer>
  │               ↳ <TourArtwork>
  │               ↳ <SubtitleOverlay> (portal)
  └─ lib/stores/useAudioContext.ts (Zustand context for shared state)
```

### 1.1  Data Flow
1. _Begin your journey_ → router push to `/tour/[id]/play`.
2. **SWR** fetches `/api/tours/:id` – adapter around FastAPI endpoint.
3. Provider initialises audio element, loads MP3 via `audio_url`.
4. Transcript stored in provider; overlay subscribes to `currentTime`.
5. Artwork index derived client-side → deterministic (hash of `tour.id`).

---

## 2. Backend Adjustments (FastAPI)
- **Schema**: extend `tour` table JSON column `transcript` (TEXT) – already exists for LLM content but ensure typed.
```python
class TranscriptSegment(BaseModel):
    startTime: float  # seconds
    endTime: float
    text: str
```
- **Endpoint change**: `/tours/{id}` now returns `transcript` (list) not string.
- **Generation Pipeline**: after audio synthesis, run `alignment.py` to generate timestamped transcript (or simple fallback 8-second buckets).

_No breaking changes: old clients ignore extra field._

---

## 3. Frontend Detailed Design
### 3.1 Types
```ts
// lib/types.ts (extend)
export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
}

export interface Tour {
  id: string;
  title: string;
  audio_url: string;
  transcript: TranscriptSegment[];
  // existing fields ...
}
```

### 3.2  AudioPlayerProvider (Zustand)
```ts
interface AudioState {
  audioRef: HTMLAudioElement | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  transcript: TranscriptSegment[];
  setCurrentTime: (t:number)=>void;
  // …volume, playbackRate, etc.
}
```
*Reason*: keeps EAP and SO in sync without prop-drilling.

### 3.3  EnhancedAudioPlayer (EAP)
* JSX copied from `mock_audio_player_v2_with_sub.html` (light) and tailwind `dark:` variants.
* New props: `{ tour: Tour }`.
* `useHashArtwork(tour.id)` returns SVG component.
* Subtitle button toggles `overlayOpen` in context.

### 3.4  SubtitleOverlay (SO) – MVP
* Portal to `body` (`createPortal`).
* Auto-scroll disabled for Phase-1 (see Phases).
* Accessibility: `role="dialog" aria-modal="true"`.
* Close returns focus to originating button.

### 3.5  Artwork System
```
components/artwork/templates.ts
export const templates: ArtworkTemplate[] = [ ...15 svg defs... ];
export function pickTemplate(id:string){
  const hash = Array.from(id).reduce((h,c)=>h+(c.charCodeAt(0)),0);
  return templates[hash % templates.length];
}
```

---

## 4. Build Phases & Test Checklist
| Phase | Dev Tasks | Testing | Flag |
|-------|-----------|---------|------|
| 0  – Boilerplate |  • Feature flag env var<br/>• Tailwind variants added | Build passes CI | `PLAYER_V2` off |
| 1  – Data API |  • Add `transcript` to API & mock data | `curl /api/tours/1` returns array |  |
| 2  – Provider & Route |  • Create AudioPlayerProvider<br/>• New `/play` page loads tour & provider | Unit test provider context default values |  |
| 3  – EAP UI |  • Implement controls, artwork, list btns | RTL snapshot of EAP renders |  |
| 4  – SO MVP |  • Overlay renders list, seek on click | Open overlay, click item seeks audio (Cypress) |  |
| 5  – Feature flag on staging |  • Enable `PLAYER_V2` env var | Manual QA mobile & desktop | on |
| 6  – AutoScroll (V2) |  • `useEffect` sync scroll every 300 ms | Integration test scrolls |  |

---

## 5. Edge Cases / Error Handling
* If audio fails → provider exposes `error` → EAP shows retry.
* Transcript absent → show info banner _"Transcript unavailable"_.
* Long transcripts (>500 lines) → `react-virtualized` list in SO.

---

## 6. Performance
* Lazy-import `SubtitleOverlay` (`next/dynamic`) to cut main bundle.
* Memoise `TourArtwork` SVG renders.
* Use `will-change: transform` on scrolling overlay for smoothness.

---

## 7. Security & Privacy
* Ensure audio URLs are signed, expire 24h.
* No transcript PII expected; if future tours include user text, redact before storage.

---

## 8. Rollback Strategy
* Keep legacy player accessible via `?legacy=true` query for 1 version.
* Feature flag toggles quickly on Vercel env.

---

## 9. Documentation
* Update README + SETUP.md with `PLAYER_V2` flag, new route.
* Storybook stories for EAP & SO components.

---

_End of spec_ 