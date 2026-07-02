# React Storage Helpers

This module is infrastructure for the schema in the root `STORAGE_SCHEMA.md`.

- Operations are restricted to the active React-only key allowlist.
- Vanilla production keys are never read, written, inspected, removed, or reset.
- Reads and writes enforce `schemaVersion` and store shape.
- Missing, unavailable, corrupt, or incompatible data falls back to fresh defaults.
- Migration, export/import, and screen persistence are not implemented here.
- Reset helpers remove only allowlisted React keys.
- Never use `localStorage.clear()`.

Reserved Shopping, Pantry, and Daily Staples key names are documented constants only. They are not active or included in the runtime allowlist.
