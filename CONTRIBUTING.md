# Contributing to NutriFlow

Keep changes focused, preserve user data, follow the locked roadmap, and treat repository documentation plus explicit Main Chat approvals as the project source of truth.

## Project Roles

- **User / Product Owner:** owns final product decisions and all Git writes.
- **Main Chat:** coordinates roadmap/task scope, accepts review/QA results, and guides release/Git batches.
- **Sprint Chat:** engineering analysis, system design, implementation review, and technical recommendations.
- **UI/UX Chat:** UI-heavy design/spec review when required.
- **Data Compatibility Chat:** storage/data-sensitive review when required.
- **Codex:** implements only approved scope.
- **QA Chat:** tests only; it must not modify production/source code.

## Locked Roadmap Rule

After roadmap approval, do not introduce, remove, rename, reorder, merge, or skip sprint/tasks unless the user explicitly approves that roadmap change. Every implementation must map to the locked roadmap. Option C is the locked whole-app UI direction.

## Standard Task Workflow

1. Main Chat confirms the task number and goal.
2. UI/UX Chat reviews if UI-heavy.
3. Data Compatibility Chat reviews if storage/data-sensitive.
4. Sprint Chat performs engineering analysis.
5. Main Chat approves the implementation direction.
6. Sprint Chat prepares the Codex prompt.
7. Codex implements on the approved branch.
8. Sprint Chat performs implementation review.
9. QA Chat performs focused QA.
10. Main Chat accepts the QA verdict.
11. The user performs the approved Git batches.
12. Main Chat closes the task only after post-merge verification succeeds.

## Git Ownership

The **user owns Git writes**, including staging, commit, merge, push, branch deletion, cleanup, tags, and GitHub Releases.

Codex must not stage, commit, merge, push, delete branches, clean the repository, create tags, or publish releases unless the user explicitly changes that rule. Codex may create/switch the approved implementation branch when the task prompt allows it. QA must not modify source.

## Three Git Batches

After QA is accepted, Git work is performed exactly one batch at a time, with complete raw output reviewed before the next batch.

### Batch 1 — Validate / Stage / Commit
Validate the intended diff, stage only approved files, and create the feature/fix/docs commit.

### Batch 2 — Merge + Verify
Merge into `main` with a safe non-fast-forward merge and run post-merge verification.

Use a meaningful Conventional Commit-style merge message rather than the default `Merge branch ...` message.

```bash
git merge --no-ff --no-edit -m "feat: add meal-wise protein split" feature/meal-protein-split
```

Suitable prefixes include `feat:`, `fix:`, `docs:`, and `refactor:`.

### Batch 3 — Push / Delete / Cleanup
Push the verified result, delete the completed branch where approved, and confirm the final clean repository state.

## Sprint Tags

After a sprint is fully completed and its final merged state is verified/pushed, create the sprint's annotated Git tag **before starting the next sprint**.

Current milestone examples:

- `v0.6.0` — Sprint 5
- `v0.7.0` — Sprint 6
- `v0.8.0` — Sprint 7

The stable Vanilla production release uses a separate tag namespace:

- `vanilla-v1.0.0`

Sprint milestone tags must not be described as React production releases before the React production-launch sprint.

## Engineering Rules

- Read relevant implementation/data flow before editing.
- Keep changes within approved scope.
- Preserve behavior outside the task.
- Reuse existing helpers.
- Do not add dependencies outside approved tasks.
- Keep the root Vanilla production app stable until the locked production-replacement sprint.
- React code must not use protected Vanilla Local Storage keys.
- Do not change storage schemas without explicit approval and migration planning.

## Local Storage Safety

Protected Vanilla keys:

- `pptd_v5`
- `ppc_v5`
- `ppwk_v5`
- `ppst_v5`
- `ppl_v5`

React storage uses the locked separate `nutriflow_react_*_v1` family. React reset behavior must remain allowlist-only. Never use `localStorage.clear()`.

## Testing

Test in proportion to the change. Runtime changes should cover affected workflow, persistence, calculations, integrity, responsiveness/accessibility, and PWA behavior where relevant.

Documentation-only work should verify only intended documentation files changed, no runtime/package/PWA source changed, `git diff --check` passes, and stale statements are reviewed rather than blindly replaced.

## Documentation Checkpoint

Every task checks whether these files need updates:

- `README.md`
- `CHANGELOG.md`
- `BACKLOG.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `PROJECT_ANALYSIS.md`
- `CONTRIBUTING.md`
- `STORAGE_SCHEMA.md` when storage contract/status is affected

Only update documents relevant to the task.

## Runtime App and PWA Rule

For the live Vanilla app:

- if `index.html` changes, review/bump the cache name in `sw.js`
- update the expected cache name in `tests/pwa-smoke.spec.js`
- do not add `skipWaiting()` or `clients.claim()` without separate approval
- documentation-only changes do not require a PWA cache bump

## Change Reports

Implementation/review reports should identify branch/baseline, files changed, purpose, checks, protected paths, limitations, final Git status, and explicit confirmation of prohibited Git actions not performed.
