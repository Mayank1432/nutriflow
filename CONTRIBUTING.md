# Contributing to Protein Diet Planner

Keep changes focused, preserve existing user data, and treat the repository documentation as the source of truth.

## Project Operating Model

- User: Product Owner.
- Main Chat: Project Manager and Release Manager.
- Sprint Chat: Engineer, System Designer, and Engineering Reviewer.
- Codex: Implementer only.
- QA Chat: Tester only.
- Repository docs: source of truth for current behavior, architecture, plans, and process.

## Implementation Workflow

1. Main Chat plans the task.
2. Main Chat gives an analysis prompt to Sprint Chat.
3. Sprint Chat provides an analysis report.
4. Main Chat reviews the analysis and approves the implementation direction.
5. Sprint Chat generates the Codex prompt only.
6. The user sends Sprint Chat's prompt directly to Codex.
7. Codex implements and reports to Sprint Chat.
8. Sprint Chat performs engineering review and reports to Main Chat.
9. Main Chat reviews the engineering report and gives the QA prompt.
10. QA Chat tests and reports `PASS`, `PASS WITH LIMITATIONS`, or `FAIL`.
11. Main Chat reviews QA.
12. Main Chat helps commit.
13. Main Chat helps merge.
14. Main Chat helps perform the post-merge live check.
15. Main Chat closes the task only after the live check passes.

## Codex Prompt Review Rule

Main Chat does not review every Codex prompt by default. Main Chat reviews a prompt when the task is high risk, scope is unclear, storage or schema changes are involved, deployment strategy changes, or the user asks for review.

## Approval Authority

Only Main Chat and the user approve:

- Task scope.
- Implementation direction.
- Sending work to QA.
- QA result acceptance and QA approval.
- Commits.
- Merges.
- Task completion.

Sprint Chat may say: "Ready to send to Main Chat for final review and QA prompt."

Sprint Chat must not approve commits or merges, declare a task complete, or approve QA. Codex must not commit unless explicitly instructed, merge, or approve anything. QA Chat must not change code, approve commits or merges, or declare a task complete.

## Engineering Rules

- Read the relevant implementation and data flow before editing.
- Keep changes minimal and within the approved scope.
- Preserve Local Storage keys, stored shapes, and backup compatibility.
- Preserve existing behavior outside the task.
- Reuse existing helpers and avoid duplicate logic.
- Do not add frameworks, dependencies, or build steps without approval.
- Keep the current runtime usable as plain HTML, CSS, and JavaScript until the planned migration begins.

## Local Storage Compatibility

Changes must preserve existing saved data. Take particular care with ingredient, weekly plan, History, custom-library, and legacy staple shapes. Any approved shape change needs an explicit compatibility or migration path.

## Testing Changes

Test in proportion to the change. Runtime work should cover affected workflows, persistence, calculations, import/export, and PWA behavior where relevant. Documentation-only work needs documentation checks and confirmation that runtime files were untouched.

## Documentation Checkpoint

Every task must check whether these files need updates:

- `CHANGELOG.md`: what shipped.
- `BACKLOG.md`: remaining work and follow-ups.
- `ROADMAP.md`: long-term task order changes.
- `DECISIONS.md`: architecture or product decisions.
- `PROJECT_ANALYSIS.md`: current architecture or state.
- `README.md`: user-facing features or setup.
- `CONTRIBUTING.md`: workflow or process.

Only update documents affected by the task.

## Runtime App and PWA Rule

- If `index.html` changes, bump the cache name in `sw.js`.
- Update the expected cache name in `tests/pwa-smoke.spec.js`.
- Do not add `skipWaiting()` or `clients.claim()` unless separately approved.
- Documentation-only changes do not require a PWA cache bump.

## Change Report

Implementation reports should identify what changed, why, files and functions affected, checks performed, known limitations, and Git status. Codex must not commit unless the approved prompt or Main Chat explicitly instructs it to do so.
