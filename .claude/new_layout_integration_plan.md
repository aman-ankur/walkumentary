# New Layout Integration Plan – Walkumentary

> Spec source: `.claude/new_layout.txt` (orange/coral theme, Inter typography)
> Branch: `feature/ui-modern-redesign`

## 🗺️ Overview
The new layout introduces a warmer orange theme (`#E87A47`), re-imagined page structures, and a richer component library. We will migrate incrementally, keeping the codebase functional while replacing visual layers.

## 📐 High-Level Phases
| Phase | Goal | Key Tasks | Affected Paths |
|-------|------|-----------|----------------|
| 0 | **Foundation** | • Extend Tailwind theme (colors, typography)<br>• Import Google Inter font in `globals.css` | `frontend/tailwind.config.js`, `frontend/src/app/globals.css` |
| 1 | **Core Primitives** | • Update shared `Button`, `Card`, `Input` components with new tokens (rounded-xl/2xl, shadows)<br>• Ensure variants support orange palette | `frontend/src/components/ui/*` |
| 2 | **Header & Navigation** | • Replace `BottomNavBar.tsx` (mobile) & top header with new `Header` component (logo, nav, CTA)<br>• Add `/features` route placeholder | `frontend/src/components/Header.tsx`, routes |
| 3 | **Landing Page** | • Create `HeroSection`, `SearchSection`, `PopularDestinations` components<br>• Assemble in `src/app/page.tsx` (landing) | `frontend/src/components/landing/*` |
| 4 | **Features Page** | • Build `FeaturesHero`, `AudioPreviewCard`, `FeaturesGrid` components<br>• New route `/features` page | `frontend/src/app/features/page.tsx` |
| 5 | **Audio Player Page** | • Re-skin existing `TourPlayer` page: map sections to `MapViewCard`, `AudioPlayerCard`, `NowPlayingCard` | `frontend/src/app/tour/[id]/page.tsx`, components |
| 6 | **Customization Flow** | • Implement `/customize` route with new warm-cream layout (see mock_customization_v2). Components:
  * `InterestsSection` – circular image cards (select multiple).
  * `NarrativeStyleSection` – avatar cards for guide persona.
  * `PaceSection` – big numeric display + orange range slider.
  * `VoiceSection` – avatar cards with personality badges.
  * `StartJourneySection` – CTA disabled until at least one interest chosen.
• Persist selections in local state; POST to `/tours/generate` with extra fields but keep optional behind flag until backend ready. | `frontend/src/app/customize/page.tsx`, `frontend/src/components/customize/*` |
| 7 | **Polish & QA** | • Update Jest snapshots, visual regression tests<br>• Lighthouse & a11y audits<br>• Code cleanup & doc updates | tests, CI |

## 🔄 Mapping Current ➜ New Components
| Current Component | Status | Action |
|-------------------|--------|--------|
| `AuthButton`, `AuthProvider` | unchanged | carry over UI tweaks only |
| `BottomNavBar` | redesign | merge into new `Header` / responsive nav |
| `GPSLocationDetector` | reuse logic | wrap in new styled card (orange buttons) |
| `LocationSearch` | keep logic | embed within `SearchSection` UI |
| `TourList`, `TourCard`, `AudioPlayer` | style overhaul | split into `AudioPlayerCard` & postcard-styled cards |
| `TourStatusTracker` | functional | minor color edits |

## 🛠️ Detailed Tasks per Phase
### Phase 0 – Foundation
1. Update `tailwind.config.js`:
   ```js
   colors: {
     orange: {50:'#FFF7ED',500:'#E87A47',600:'#D16A37'},
     warm: {50:'#FEFBF8'},
   }
   ```
2. Add Google Fonts import in `globals.css` and set body font.

### Phase 1 – Core Primitives
* Update `Button` to allow `variant="primary"` & `variant="outline"` with orange defaults.
* Increase default `rounded` and apply `shadow-lg` hover.

### Phase 2 – Header & Navigation
* Create `components/Header.tsx` as per spec (logo MapPin icon, links, CTA).
* Conditionally render simplified bottom nav for `<md` screens.

### Phase 3 – Landing Page
* Build new folder `components/landing`.
* Implement `HeroSection`, `SearchSection`, `PopularDestinations`.
* Replace placeholder in `page.tsx`.

### Phase 4 – Features Page
* Add new route `features` (Next.js app router).
* Implement hero + grid.

### Phase 5 – Audio Player Page
* Migrate existing `/tour/[id]` page layout.
* Swap in new `AudioPlayerCard`, keep hooks/state.

### Phase 6 – Customization Flow
* Implement `/customize` route with new warm-cream layout (see mock_customization_v2). Components:
  * `InterestsSection` – circular image cards (select multiple).
  * `NarrativeStyleSection` – avatar cards for guide persona.
  * `PaceSection` – big numeric display + orange range slider.
  * `VoiceSection` – avatar cards with personality badges.
  * `StartJourneySection` – CTA disabled until at least one interest chosen.
* Persist selections in local state; POST to `/tours/generate` with extra fields but keep optional behind flag until backend ready. | `frontend/src/app/customize/page.tsx`, `frontend/src/components/customize/*` |

### Phase 7 – Polish & QA
* Snapshot update: `pnpm test -- -u`.
* Lighthouse performance; ensure CLS < 0.1.
* Deploy preview & gather feedback.

## 🚧 Rollback Plan
* Each phase merged separately behind Feature Flags if needed (e.g., `NEXT_PUBLIC_UI_V2`).
* Rolling back → simply disable flag and revert to V1 components.

### Backend Alignment & API Stability
* **Endpoint Audit**: Confirm UI calls `/api/locations`, `/api/tours`, `/api/auth`, `/api/health`. No contract changes required – redesign is purely presentational.
* **CORS & Rate-limits**: Ensure new routes (e.g., `/features`, `/customize`) are whitelisted if server-side rendering calls backend (Next.js `getServerSideProps`).
* **Cache Invalidation**: UI adds popular-destinations feature that may call `/locations?popular=true`; add optional query param with sane defaults to prevent breaking existing endpoint.
* **AI Tour Generation Flow**: Maintain current POST `/tours/generate` signature. `Customization` page will pass additional fields (interests, tone, duration, voice). If backend lacks these keys, feature-gate payload behind version flag until API support lands.

### Alternative Approaches Considered
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Big-bang release** | Fast delivery; simpler branch management | High risk of regressions; longer QA freeze | ❌ Rejected |
| **Incremental behind feature flag** | Ship value gradually; easy rollback | Slight runtime overhead for flag checks | ✅ Chosen (env `NEXT_PUBLIC_UI_V2`) |
| **Separate v2 folder, swap at build-time** | Isolation, no flags | Duplication of logic; merge hell | ❌ Rejected |

### Breaking-Change Mitigation
1. **Snapshot Tests** – Jest + Testing-Library updated each phase; diff reviewed in PR.
2. **E2E Coverage** – Playwright scenarios for signup, search, GPS detect, generate tour, audio controls.
3. **API Contract Tests** – `backend/tests/test_contract.py` to assert schemas consumed by UI (pydantic‐based snapshots).
4. **Rollback** – Toggle `NEXT_PUBLIC_UI_V2=false` + revert deploy; no DB migrations required.

### CI/CD Updates
* Extend GitHub Action to install Playwright browsers & run `pnpm playwright test`.
* Add Lighthouse CI for performance budgets (TTI < 3s, LCP < 2.5s, CLS < 0.1).
* Slack webhook notification on regression.

### Deployment Sequence
1. Deploy backend hotfix to accept optional customization fields (ignored server-side for now).
2. Merge Phase 0 → prod with flag off (no UX change) to validate Tailwind changes.
3. Sequentially merge Phases 1-3, keeping flag off; run Playwright & Lighthouse in staging.
4. Enable flag for internal testers only via cookie override.
5. After sign-off, set `NEXT_PUBLIC_UI_V2=true` in production.

### Documentation & Handoff
* Update `README.md` with new env vars and Tailwind tokens.
* Add Storybook docs for new components (`pnpm storybook` task).
* Record Loom demo for stakeholders.

<!-- End of expanded integration plan -->

---

## 📊 Current Progress Snapshot (2025-06-24)

| Phase | Status | Notes |
|-------|--------|-------|
| 0 – Foundation | ✅ Complete | Tailwind palette + Inter font merged. |
| 1 – Core Primitives | ✅ Complete | UI primitives updated (`Button`, `Card`, etc.). |
| 2 – Header & Navigation | ✅ Complete | New `Header.tsx` in place; bottom-nav folded. |
| 3 – Landing Page | ✅ MVP skeleton | `HeroSection`, `SearchSection`, `PopularDestinations` implemented with placeholder copy. |
| 4 – Features Page | ⬜ Not started | Await design approval. |
| 5 – Audio Player Page | ⬜ Not started | Waiting on final visuals. |
| 6 – Customization Flow | ⬜ Back-end fields added, UI pending | API accepts `narration_style`, `voice`; UI build blocked until Phase 4. |
| 7 – Polish & QA | ⬜ Pending | Will commence after Phase 6. |

Legend: ✅ done ⬜ pending / in-progress.

---
End of integration plan. 