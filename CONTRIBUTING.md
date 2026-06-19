# Contributing to Protein Diet Planner

Thanks for contributing. This project is intentionally simple: a browser-based app that works by opening `index.html` directly. Contributions should protect that simplicity.

## Core Rules

- Never redesign the UI unless explicitly requested.
- Never rewrite the application.
- Keep changes minimal and focused.
- Preserve Local Storage compatibility.
- Preserve existing functionality.
- Reuse existing functions wherever possible.
- Avoid duplicate logic.
- Explain every modified function in your change notes.
- Keep JavaScript readable.
- Do not add frameworks.
- Do not add npm packages.
- The app must continue working by opening `index.html` directly in a browser.

## Development Guidelines

Before making changes, read the relevant parts of `index.html` and understand the current data flow. Most behavior is implemented with plain JavaScript, global state, render functions, and Local Storage persistence.

Prefer small edits over broad restructuring. If a bug can be fixed by adjusting one existing function, do that instead of introducing a new architecture.

When adding behavior:

- Use existing state shapes.
- Use existing calculation helpers when possible.
- Use existing render/update patterns.
- Keep storage keys compatible.
- Keep backup import/export compatible with existing data.
- Avoid changing user-visible behavior outside the requested scope.

## Local Storage Compatibility

The app stores user data in browser Local Storage. Changes must not break existing saved data.

Be careful with:

- Local Storage keys.
- Ingredient object shapes.
- Staple object shapes.
- Weekly plan object shapes.
- History log object shapes.
- Custom ingredient IDs.
- Backup export/import format.

If a data shape must change, include a migration path that preserves existing user data.

## JavaScript Style

Use plain, readable JavaScript.

- Prefer clear names over clever abbreviations for new code.
- Keep functions small when adding new functionality.
- Avoid repeating calculation logic.
- Add comments only when they clarify non-obvious behavior.
- Do not introduce build steps, bundlers, transpilers, or dependencies.

## Testing Changes

After any change, verify that:

- `index.html` opens directly in a browser.
- Existing saved data still loads.
- Daily totals still calculate correctly.
- Staples still work.
- Meals, dishes, and ingredients can still be added and edited.
- Weekly planning still works.
- History still renders.
- Export and import still work.

## Change Notes

Every contribution should explain:

- What changed.
- Why it changed.
- Which functions were modified.
- How each modified function behaves after the change.
- What manual testing was performed.
