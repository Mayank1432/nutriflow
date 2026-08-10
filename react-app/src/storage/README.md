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

Shopping and Pantry remain reserved constants until their approved sprint. Daily Staples is active and included in the React-only runtime allowlist.
