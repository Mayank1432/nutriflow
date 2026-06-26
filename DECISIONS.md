# Architecture Decisions (ADR)

This document records important technical decisions made during the development of **Protein Diet Planner**.

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

Protein Diet Planner started as a plain HTML/CSS/Vanilla JavaScript app with Local Storage.

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
