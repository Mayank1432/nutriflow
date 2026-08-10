# Architecture Decisions (ADR)

This document records important technical decisions made during the development of **NutriFlow**.

Each decision includes:
- The problem
- The chosen solution
- Why it was chosen
- The consequences

---

## ADR-001: Use Git Feature Branches

**Status:** Accepted

### Decision

Every feature, bug fix, or refactor will be developed in its own Git branch.

Examples:

- feature/recipe-builder
- fix/quantity-reset
- refactor/local-storage

### Reason

This keeps the `main` branch stable and makes code reviews easier.

### Alternatives Considered

- Developing directly on `main`

### Consequences

- Cleaner Git history.
- Easier rollback.
- Safer experimentation.

---

## ADR-002: Today's Ingredients Become Editable Snapshots

**Status:** Accepted

### Decision

Ingredients added to "Today's Ingredients" should become editable snapshots rather than depending on the Food Library after insertion.

Library items are templates.

Today's ingredients are instances.

### Reason

Users must be able to edit:

- Name
- Quantity
- Unit
- Nutrition
- Cost

without affecting the original library.

### Alternatives Considered

Keeping `libId` permanently attached.

### Consequences

- Editing becomes predictable.
- Prevents nutrition reset bugs.
- Supports future Recipe Builder.
- Supports import/export.

---

## ADR-003: Centralize Ingredient Detachment

**Status:** Accepted

### Decision

Introduce `ensureEditableIngredient()` as the single helper responsible for converting a library-backed ingredient into an editable snapshot.

### Reason

Previously the detach logic existed in multiple places.

Centralizing it removes duplicate logic and reduces bugs.

### Alternatives Considered

Duplicating the detach logic inside each update function.

### Consequences

- Easier maintenance.
- Single source of truth.
- Simpler future updates.

---

## ADR-004: Architecture Before Features

**Status:** Accepted

### Decision

Every major feature will be preceded by an architecture review.

### Reason

Prevent technical debt and unnecessary rewrites.

### Alternatives Considered

Implementing features immediately.

### Consequences

- Better long-term maintainability.
- Smaller, safer changes.
- Higher code quality.

---

## ADR-005: Plan Migration from Vanilla Prototype to React/Vite PWA

**Status:** Accepted

### Decision

The project started as a plain HTML/CSS/Vanilla JavaScript app with Local Storage.

The project will continue short-term bug fixes in the current vanilla app, but the long-term product direction is to migrate toward a modern React + Vite + TypeScript PWA after core data/editing bugs are fixed.

The migration should be planned and staged rather than done as a rushed rewrite.

### Reason

The app has grown beyond a small prototype. The new product goal is a polished, share-worthy, installable mobile PWA with:

- Option C colorful and friendly UI direction
- Light mode as default
- Optional dark mode
- Mobile app shell navigation
- Bottom navigation for core screens
- Hamburger menu for tools/settings
- Quick Add V2 with search, categories, quantity prompt, Add More, and Add & Return
- Analytics and graphs
- Editable goals and macro targets
- Cleaner architecture for future expansion

The current single-file/global-state structure made early development fast, but it is becoming harder to maintain as the UI, analytics, settings, and workflow requirements grow.

### Alternatives Considered

- Continue expanding the single `index.html` app indefinitely.
- Rewrite the full app immediately before fixing known data bugs.
- Add more UI patches without changing architecture direction.

### Consequences

- Core data/editing bugs should be fixed before framework migration.
- Documentation must stay updated as architecture and features change.
- The migration should preserve existing Local Storage data and backup/export compatibility.
- The app should remain deployable as a GitHub Pages PWA.
- Future implementation tasks should separate bug fixes, documentation, migration planning, app shell, storage/calculation porting, UI redesign, analytics, and PWA QA.

---

## ADR-006: Use a Parallel, Incremental React/Vite Migration

**Status:** Accepted

### Context

The current vanilla PWA is deployed, stores user data in Local Storage, supports old backups and History entries, and remains the working production application. Replacing it in one rewrite would combine framework, data, UI, deployment, and service-worker risk in a single release.

### Decision

Develop the future app as a parallel React + Vite + TypeScript implementation and port modules incrementally.

- Keep the vanilla app stable and deployed until the React version passes compatibility and PWA checks.
- Preserve `pptd_v5`, `ppc_v5`, `ppwk_v5`, `ppst_v5`, and `ppl_v5` during the initial port.
- Add a storage adapter, calculation utilities, normalization helpers, and export/import compatibility helpers before porting feature screens.
- Preserve the internal `meals -> dishes -> ingredients` shape initially.
- Port Today and Quick Add before Weekly Planner and History, then add analytics and themes.
- Delay the production PWA switch until the final deployment and QA task.
- Keep a rollback path to the vanilla app until React feature and data parity is confirmed.
- Consider Capacitor or another native Android wrapper only after the React PWA is stable.

Use simple TypeScript types and React state patterns initially. Do not add a state-management library without a demonstrated need.

### Alternatives Considered

- A big-bang rewrite that replaces the vanilla app in one release.
- Continuing to expand the single-file vanilla implementation indefinitely.
- Changing the storage schema during the first React port.
- Switching service workers before feature and data compatibility is verified.

### Consequences

- Migration takes place in more, smaller tasks but each step is easier to review, test, and roll back.
- Temporary duplication between vanilla and React implementations is expected.
- Compatibility tests need representative Local Storage data, exports, and old backups.
- GitHub Pages base-path and PWA behavior remain explicit release gates.
- The deployed vanilla app remains the fallback until the final production switch succeeds.

---

## ADR-007: Use a Separate React-Only v1 Storage Namespace

**Status:** Accepted

### Context

ADR-006 originally expected the first React port to preserve/read the existing Vanilla Local Storage keys. The approved React Storage Schema Lock later chose a safer fresh React namespace instead.

### Decision

React uses versioned `nutriflow_react_*_v1` keys and must not read, write, reset, inspect, or remove the protected Vanilla keys:

- `pptd_v5`
- `ppc_v5`
- `ppwk_v5`
- `ppst_v5`
- `ppl_v5`

React reset operations are allowlist-only and must never call `localStorage.clear()`.

This decision supersedes the storage-key-preservation portion of ADR-006. The parallel/incremental migration and production-safety parts of ADR-006 remain valid.

### Consequences

- Vanilla production data remains isolated and safe.
- React starts from a clear versioned storage family.
- Old Vanilla migration/import requires a separately approved future task.
- Schema changes require explicit versioned migration planning.

---

## ADR-008: Lock Option C as the Whole-App React UI Direction

**Status:** Accepted

### Decision

Option C – Colorful & Friendly is the visual direction for the whole React application, not only Today.

The app uses:

- light mode by default
- optional dark mode through Settings
- Option C surfaces/cards/icons
- mobile-first focused screens
- hamburger drawer for tools/settings/account/data flows
- bottom navigation for Today, Weekly, History, and Analytics

### Consequences

- Future UI-heavy work must align to Option C unless the user explicitly changes the roadmap.
- Today must not become one oversized tools page.
- The navigation hierarchy remains stable across future sprints.

---

## ADR-009: Use Recharts and a Seven-Day Analytics Context

**Status:** Accepted

### Decision

Use Recharts for the Sprint 7 Analytics charts.

Analytics uses a seven-day local-calendar History context. The obsolete 30-day mode is not part of the final Sprint 7 implementation.

Business calculations remain in NutriFlow domain helpers; Recharts is a presentation layer.

### Consequences

- Protein, Calories, Spend, Macro, Macro Split, and Meal-wise Protein views share one chart library.
- Missing/incomplete History data must not be fabricated as zeros.
- Current goals are current references, not retroactive historical goals.
- Exact-data and empty/insufficient states remain explicit.
- Task 7.8 Weight Trend was optional and was skipped by explicit user approval.

---

## ADR-010: Keep the Stable Vanilla Release as the Rollback Production Path

**Status:** Accepted

### Decision

The root Vanilla application remains production until the locked React production-launch sprint succeeds.

The stable rollback release is:

- **NutriFlow Vanilla v1.0.0**
- tag: `vanilla-v1.0.0`
- snapshot: `ddd67751c682fac7a3a4ac2db9c1fa62468427b7`

React sprint tags (`v0.6.0`, `v0.7.0`, `v0.8.0`, and later sprint milestones) are development milestones and must not be described as production releases before the React production switch.

### Consequences

- A known-good production rollback stays identifiable.
- React development can continue without reclassifying the live app.
- Production replacement remains an explicit future release gate.
