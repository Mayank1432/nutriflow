# Protein Diet Planner Roadmap

This roadmap tracks the current product and engineering direction for Protein Diet Planner.

The app began as a lightweight vanilla HTML/CSS/JavaScript Local Storage app. It is now moving toward a polished, share-worthy, installable PWA with better mobile UX, analytics, themes, and maintainable architecture.

---

## Current Direction

Chosen product direction:

- Mobile-first, app-like experience
- Option C: colorful and friendly visual style
- Light mode as the default
- Optional dark mode
- Smooth Quick Add workflow
- Analytics and graphs
- Better settings and editable targets
- Installable/shareable PWA
- Documentation kept up to date with feature and architecture changes

---

## Sprint 5 Forward Plan

### Task 4 – Core Data & Editing Fixes

Fix core workflow and data consistency issues before major UI redesign.

Planned scope:

- Fix Today Ingredients text input losing focus after one digit.
- Removing an item from Today Ingredients should remove it from the meal data too.
- Fix similar remove/zero-value issues in History where applicable.
- Remove leftover zero-value ingredients/dishes from meals.
- Improve meal change behavior in Today Ingredients.
- Reassess dish dependency in Today Ingredients and simplify if feasible.

Reason:

The new UI should not be built on top of broken editing or inconsistent meal data.

---

### Task 5 – Documentation Refresh + Architecture Decision

Refresh project documentation and record architecture decisions.

Planned scope:

- Update README.md.
- Update CHANGELOG.md.
- Update BACKLOG.md.
- Update CONTRIBUTING.md.
- Update PROJECT_ANALYSIS.md.
- Update DECISIONS.md.
- Maintain this ROADMAP.md.

Documentation must reflect:

- Current PWA setup with external manifest and service worker.
- Current Playwright PWA smoke testing.
- Current Sprint 5 mobile work.
- Known issues and planned tasks.
- Framework migration direction.
- QA and cache-bump rules.

---

### Task 6 – Framework Migration Planning

Plan the migration from the current vanilla app to a modern frontend stack.

Preferred stack:

- React
- Vite
- TypeScript
- Local Storage initially
- Playwright for PWA/mobile smoke tests
- Vitest for calculation/storage tests later
- Chart library only after data model and UI needs are clear

Planning must cover:

- Data preservation
- Export/import compatibility
- GitHub Pages deployment
- PWA behavior
- Component structure
- Route/navigation model
- Testing strategy
- Migration phases

---

### Task 7 – React/Vite App Shell Prototype

Create a minimal React/Vite PWA prototype without porting all features at once.

Planned scope:

- Set up React + Vite + TypeScript.
- Create the new app shell.
- Add mobile-first layout foundation.
- Add light default theme foundation.
- Add dark mode foundation.
- Add bottom navigation:
  - Today
  - Weekly
  - History
  - Analytics
- Add hamburger menu:
  - Quick Add
  - Today Ingredients
  - Daily Staples
  - Custom Ingredient
  - Cost / Protein Table
  - Backup & Restore
  - Settings

Goal:

Validate the new architecture and app shell before porting the full app.

---

### Task 8 – Port Storage + Calculations

Move storage and nutrition calculation logic into the new architecture.

Planned scope:

- Preserve existing Local Storage keys.
- Preserve existing backup/export compatibility.
- Port calculation helpers.
- Add tests for core calculations where feasible.
- Keep migration safe and reversible.

Existing storage keys must not be casually changed:

- `pptd_v5`
- `ppc_v5`
- `ppwk_v5`
- `ppst_v5`
- `ppl_v5`

Reason:

The visual redesign should use reliable calculation and storage logic before complex screens are rebuilt.

---

### Task 9 – Port Today + Quick Add

Port the core Today workflow and improve Quick Add.

Planned Today scope:

- Daily summary cards.
- Meal selector.
- Selected meal card.
- Today Ingredients.
- Custom Ingredient flow.
- Daily Staples integration.

Planned Quick Add V2 scope:

- Search.
- Categories.
- Quantity prompt while adding.
- Add More.
- Add & Return.
- Toast/confirmation.
- Smooth return to Today meal card.

Reason:

Today and Quick Add are the core daily-use workflows, so they should be ported before less frequent tools.

---

### Task 10 – Analytics + Theme System

Add analytics, graphing, and full settings/theme support.

Planned scope:

- Light mode as default.
- Dark mode toggle.
- Settings screen.
- Editable goals.
- Macro Targets:
  - Calories.
  - Protein.
  - Carbs.
  - Fat.
  - Fibre.
- Budget/cost target.
- Weekly average view.
- Protein trend.
- Spend trend.
- Macro split.
- Meal-wise protein split.

Reason:

Analytics should be based on stable Today, History, settings, and calculation data.

---

### Task 11 – PWA Deploy + QA

Finalize the migrated app as a reliable PWA.

Planned scope:

- GitHub Pages deployment.
- Manifest verification.
- Service worker verification.
- Offline reload testing.
- Local PWA smoke test.
- Hosted PWA smoke test.
- Android installed PWA manual check.
- Documentation update.
- Release notes.

Reason:

The app should remain installable, offline-capable, and share-worthy after migration.

---

## Documentation Rule

Every implementation task must include a documentation check.

Ask:

- Did this change user-facing features?
- Did this change architecture?
- Did this change storage/data?
- Did this change PWA/cache/deploy behavior?
- Did this add, remove, or change roadmap items?
- Did this create new known bugs, limitations, or QA notes?

Update docs as needed:

- README.md for current app usage/features.
- CHANGELOG.md for completed changes.
- BACKLOG.md for pending bugs/features.
- ROADMAP.md for planned task direction.
- DECISIONS.md for major product/architecture decisions.
- PROJECT_ANALYSIS.md for current architecture/state.
- CONTRIBUTING.md for workflow, QA, and cache rules.

---

## Current Non-Goals

Not planned immediately:

- User login.
- Cloud sync.
- Backend database.
- Multi-user sharing.
- Barcode scanning.
- Food image recognition.
- Full meal template system.
- Public food database integration.
- Immediate full rewrite before fixing core data/editing issues.
