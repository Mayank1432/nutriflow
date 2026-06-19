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