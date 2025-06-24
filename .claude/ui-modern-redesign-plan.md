# Walkumentary – UI Modern Redesign Plan

> Branch: `feature/ui-modern-redesign`

## 1. Design Goals
1. Refresh the interface to feel modern, elegant, and travel-inspired.
2. Improve visual hierarchy and readability on mobile & desktop.
3. Reduce cognitive load – intuitive discoverability for Search & GPS.
4. Introduce a cohesive design language that can scale (design-tokens).
5. Maintain excellent performance, accessibility (WCAG AA), and responsive behaviour.

## 2. Visual Language
| Token              | Value (HEX)    | Usage                                   |
|--------------------|----------------|-----------------------------------------|
| Midnight Navy      | `#12263A`      | Primary text, buttons, icons            |
| Champagne Beige    | `#F7F1E8`      | Card backgrounds, top-level background  |
| Wanderlust Gold    | `#CE9C46`      | Accents, active states, highlights      |
| Cloud Mist         | `#EEF3F9`      | Page gradient start                     |
| Sky Haze           | `#FAFCFF`      | Page gradient end                       |

Typography:
* **Headings:** "Playfair Display", serif – evokes classic travel journals.
* **Body/UI:** "Inter", sans-serif – crisp & highly legible.
* Scale: 32 / 24 / 20 / 16 / 14 / 12 (rem-based).

Imagery & Motifs:
* Soft paper-texture backgrounds or faint map contours.
* Subtle drop-shadow (4-6 px, 10 % opacity) for depth.
* Rounded corners: 8 px (cards), 9999 px (pill buttons).

## 3. Component Overhaul
1. **Global Layout**
   * Full-width top header with light gradient background.
   * Centralised container (`max-w-4xl`, `mx-auto`, `px-4`).
2. **Header**
   * App name + travel tagline; sign-out button right-aligned.
3. **Location Search**
   * Pill-shaped input with embedded location icon; micro-interaction hover & focus ring.
4. **GPS Discovery**
   * "Passport stamp"-styled card; CTA button with compass icon.
5. **Your Tours List**
   * Postcard-like card for each tour.
   * Large circular play button; progress bar resembles a luggage tag strap.
   * Tags (history, culture…) rendered as small badges.
6. **Bottom Navigation (mobile)**
   * 3-icon bar: Home, Discover, Profile; translucent glass-morphism effect.

## 4. Technical Implementation Steps
1. **Tailwind Config**
   * Extend theme with colours, fonts, shadows.
   * Enable container padding & breakpoints.
2. **Layout Wrapper**
   * Create `frontend/src/app/layout.tsx` gradient background & font classes.
3. **Component Refactor** (incremental commits)
   * SearchBar ➜ new styles & accessibility labels.
   * `GPSLocationDetector` ➜ new card UI & loading state animation.
   * `LocationList` & `LocationCard` ➜ card restyle.
   * `TourList`, `TourStatusTracker`, `AudioPlayer` ➜ postcard & player skin.
4. **State & Logic**
   * No major logic changes expected; purely presentational.
5. **Testing & QA**
   * Update Jest snapshots.
   * Lighthouse performance & a11y check.
   * Cross-device manual testing (Safari iOS, Chrome Android, desktop).

## 5. Milestones & Timeline (estimate)
| Day | Task | Deliverable |
|-----|------|-------------|
| 1   | Tailwind theme + global layout | PR with base styles |
| 2-3 | Search & GPS components | PR with screenshots |
| 4-5 | Tour card/player redesign | PR + Jest snapshot updates |
| 6   | Bottom nav + final polish | PR + Lighthouse report |

## 6. Version Control Workflow
* Keep commits atomic & descriptive (e.g., `style: add midnight-navy palette token`).
* Push to remote branch `feature/ui-modern-redesign` regularly.
* Open draft PR early for feedback & screenshot diffs.

---
End of planning document. 