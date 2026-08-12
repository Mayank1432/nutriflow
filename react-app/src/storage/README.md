# React Storage Helpers

This module implements infrastructure for the locked schema in the root `STORAGE_SCHEMA.md`.

- Operations are restricted to the active React-only key allowlist.
- Vanilla production keys are never read, written, inspected, removed, or reset.
- Reads and writes enforce `schemaVersion` and store shape.
- Missing, unavailable, corrupt, or incompatible data falls back to fresh defaults.
- Store-specific helpers provide the persistence primitives used by approved React screens.
- Screen-level persistence is implemented by approved callers using this helper layer.
- Old Vanilla migration and old backup import are not implemented here.
- React export/import remains future roadmap work.
- Reset helpers remove only allowlisted React keys.
- Never use `localStorage.clear()`.

Pantry, Shopping, and Daily Staples are active and included in the React-only runtime allowlist. Shopping was activated in Sprint 8 Task 8.2. Sprint 8 Task 8.3 keeps the same Shopping v1 key/schema and adds an optional validated provenance snapshot for explicitly confirmed generated items. Weekly Planner, Daily Staples, and Low-stock Pantry are read-only generation sources; preview state is ephemeral and confirmation performs at most one Shopping write.
