# NutriFlow Locked Roadmap

This file mirrors the approved NutriFlow roadmap and records current completion status. The sprint/task names and order are locked. No sprint or task may be introduced, removed, renamed, merged, reordered, or skipped without explicit user approval.

## Locked Product Direction

- Option C – Colorful & Friendly applies to the whole app.
- Light mode is default.
- Dark mode belongs in Settings.
- The UI name is **Macro Goals**.
- Bottom navigation: Today, Weekly, History, Analytics.
- Hamburger drawer contains tools, account/data, backup/restore, settings, and separate flows.
- Quick Add V2 supports **Add more** and **Add & return**.
- Today dashboard must show Protein, Calories, Cost, 7-Day Protein Trend, and Meals.
- Cloud/accounts come only after the local React app is stable.
- Barcode/image work comes only after storage, ingredients, and account/cloud direction are stable.
- Play Store work comes only after production app, accounts/cloud, camera/media, and sharing are stable.
- React does not replace the live Vanilla app until the production-replacement sprint is completed.

## Status Legend

- ✅ Completed
- ⏭️ Skipped by explicit user approval
- ⬜ Not started / remaining locked roadmap work

## Sprint 1 — React Real Data Foundation ✅

**Goal:** Make the React app use real persistent data safely.

### Task 1.1 — React Storage Schema Lock ✅
Define the fresh React storage schema: Today, Weekly, History, custom ingredients, Settings, Theme, Macro Goals, export/import direction, storage keys, defaults, and reset behavior.

### Task 1.2 — React Storage Helpers ✅
Implement storage keys, schema versioning, safe JSON parse/write, fallback defaults, reset helpers, protected-key safety, and no root production changes.

### Task 1.3 — Persist Today ✅
Persist Today additions, quantity edits, removals, and approved UI state across refresh.

### Task 1.4 — Persist Weekly ✅
Persist Weekly Planner data, selected day where approved, Copy Day, and Clear Day.

### Task 1.5 — Basic Real History ✅
Use real saved days with Save Today to History, saved-day list, saved-day detail, and read-only-first behavior.

## Sprint 2 — Core Data + Ingredient Workflows ✅

**Goal:** Fix data/workflow problems before the big Option C UI.

### Task 2.1 — Core Data & Editing Fixes ✅
Includes focus-safe editing, Today deletion integrity, zero-value cleanup, History integrity where applicable, cleaner meal handling, and reduced unnecessary dish dependency.

### Task 2.2 — Ingredient Library Foundation ✅
Includes custom ingredients, per-100 and per-unit support, default quantity/meal, category, cost, protein, kcal, carbs, fat, and fibre. Piece-unit semantics must remain correct.

### Task 2.3 — Daily Staples Management ✅
Includes add/edit/delete staple, default quantity, default meal, and Today workflow integration.

## Sprint 3 — Settings, Theme + Macro Goals ✅

**Goal:** Add the control center for the final app.

### Task 3.1 — Settings Screen ✅
Includes Settings, grouped sections, Theme area, Macro Goals area, and account/data placeholders where not yet implemented.

### Task 3.2 — Light/Dark Theme Foundation ✅
Includes light default, dark toggle in Settings, design tokens, and persisted theme setting.

### Task 3.3 — Macro Goals ✅
Editable Protein, Calories, Carbs, Fat, Fibre, and Cost/Budget goals.

## Sprint 4 — Final App Shell + Navigation ✅

**Goal:** Create the real mobile app structure.

### Task 4.1 — Option C Mobile Header ✅
Option C-style header, hamburger icon, NutriFlow title/logo area, date row where needed, and approved theme access.

### Task 4.2 — Hamburger Drawer ✅
Locked sections and destinations:

Main:
- Today
- Quick Add
- Analytics
- Weekly Planner
- History
- Shopping List
- Pantry / Stock

Today Tools:
- Today Ingredients
- Daily Staples
- Custom Ingredient
- Cost / Protein Table

Account & Data:
- Sign in / Sign out
- Account
- Cloud Sync
- Backup & Restore
- Multi-user Sharing

Settings:
- Settings
- Macro Goals
- Theme
- App Info / Help

### Task 4.3 — Bottom Navigation ✅
Today, Weekly, History, Analytics.

## Sprint 5 — Quick Add V2 ✅

**Goal:** Make food entry fast, smooth, and app-like.

### Task 5.1 — Quick Add Library UI ✅
Full-screen Quick Add, search, recommended foods, all-food list, category chips, and food cards/rows.

Categories:
- High protein
- Low cost
- Veg
- Animal
- Custom/Saved

### Task 5.2 — Quantity While Adding ✅
Ask quantity before adding, show default quantity, plus/minus or input, and calculate macros/cost correctly.

### Task 5.3 — Add More / Add & Return Flow ✅
Add more stays in Quick Add. Add & return goes back to Today and shows the added item in the selected meal flow.

**Sprint tag:** `v0.6.0`

## Sprint 6 — Option C App UI Redesign ✅

**Goal:** Apply Option C – Colorful & Friendly across the whole app.

### Task 6.1 — Today Dashboard Cards ✅
Today’s Protein, Today’s Calories, Today’s Cost, 7-Day Protein Trend preview, and Option C styling.

### Task 6.2 — Protein + Calories Progress ✅
Protein progress, Calories progress where useful, target-vs-actual, friendly progress visuals.

### Task 6.3 — Meal Selector + Meal Card Redesign ✅
Breakfast / Lunch / Dinner / Snacks selector, selected meal card, ingredient rows, Quick Add button, Add Ingredient button.

### Task 6.4 — Quick Add Visual Redesign ✅
Option C cards, category chips, friendly rows, clean quantity UI, and confirmation/toast polish.

### Task 6.5 — Weekly Visual Redesign ✅
Option C Weekly layout, day selector, planned-day cards, weekly summary cards, copy/clear polish.

### Task 6.6 — History Visual Redesign ✅
Option C saved-day cards, selected-day detail, summary cards, and read-only History presentation unless editing is already implemented.

### Task 6.7 — Settings / Account / Data Screen Styling ✅
Settings visual polish, Macro Goals styling, Theme styling, Backup/Restore styling, and account placeholder/actual styling according to implementation status.

**Sprint tag:** `v0.7.0`

## Sprint 7 — Analytics + Chart Library ✅

**Goal:** Build the graph screen from the agreed Option C design.

### Task 7.1 — Chart Library Decision ✅
Recharts selected after size, mobile fit, React support, and maintainability review.

### Task 7.2 — Analytics Screen Shell ✅
Analytics header, seven-day date context, summary cards, and empty states.

### Task 7.3 — Protein Trend ✅
Seven-day protein trend, current target reference, and weekly-average wording.

### Task 7.4 — Calories Trend ✅
Calories trend, target vs actual, and weekly calorie average.

### Task 7.5 — Cost / Spend Trend ✅
Daily spend trend, seven-day spend context, and budget comparison.

### Task 7.6 — Macro Split Trend ✅
Protein, carbs, fat, fibre trends plus Macro Split visualization.

### Task 7.7 — Meal-wise Protein Split ✅
Breakfast, Lunch, Dinner, and Snacks protein split. Final implementation uses a donut chart and independent saved-date / seven-day-average selection.

### Task 7.8 — Weight Trend, If Added Later ⏭️
Optional body-weight tracking and progress chart. **Intentionally skipped by explicit user approval; not outstanding required Sprint 7 work.**

**Sprint tag:** `v0.8.0`

## Sprint 8 — Shopping List + Pantry Stock ✅

**Goal:** Help the user track what is in stock and what needs buying.

### Task 8.1 — Pantry / Stock List ✅
Mark items in stock, quantity in stock, low-stock indicator, used-often/staple flag.

### Task 8.2 — Shopping List ✅
Add items manually, check off bought items, clear completed items.

### Task 8.3 — Generate Shopping List ✅
Generate from Weekly Planner, Daily Staples, and low-stock pantry items.

### Task 8.4 — Shopping Cost Estimate ✅
Estimated cost, protein-focused shopping view, and budget comparison if useful.

### Task 8.5 — Cost / Protein Table ✅
Ingredient name, quantity basis/unit, protein, calories, cost, cost per gram of protein, sorting, filtering/search, correct per-100/per-unit handling, responsive layout, and light/dark support.

**Sprint tag:** `v0.9.0`

## Sprint 9 — History Catch-Up Editing ⬜

**Goal:** Allow fixing missed previous days safely.

### Task 9.1 — Edit Previous Day ⬜
Open saved day, edit quantity, add missing item, remove wrong item.

### Task 9.2 — History Delete/Restore Safety ⬜
Delete confirmation, optional undo/restore, and accidental-loss prevention.

## Sprint 10 — Backup, Export/Import + Local Production Readiness ⬜

**Goal:** Prepare React for safe production replacement.

### Task 10.1 — React Export/Import ⬜
Export React data, import React data, validate backup file, handle invalid backup, restore safely.

### Task 10.2 — Production Replacement Plan ⬜
Plan React root replacement, GitHub Pages, PWA cache, rollback, and old Vanilla backup handling.

### Task 10.3 — React PWA Production Launch ⬜
Replace root production with React, update PWA/service worker, verify live URL, install/offline behavior, and post-launch smoke tests.

At this point, NutriFlow becomes the real local-first React PWA.

### Task 10.4 — App Info / Help ⬜
App/version info, feature overview, navigation help, Today/Quick Add/Weekly/History/Analytics guidance, backup guidance, local-first explanation, account/cloud status, PWA/offline/update guidance, privacy/data ownership, known limitations, and recovery help.

## Sprint 11 — Accounts + Cloud Architecture ⬜

**Goal:** Prepare login/accounts and cloud sync properly.

### Task 11.1 — Backend/Auth Decision ⬜
Choose backend approach, account model, privacy/data ownership plan, pricing/free-tier risk review.

### Task 11.2 — Account Data Model ⬜
User profile, settings, ingredients, Today, Weekly, History, pantry/shopping, Analytics data source.

### Task 11.3 — Sync Strategy ⬜
Local-first vs cloud-first, conflict handling, offline behavior, multi-device behavior.

**Rule:** No login/accounts until the local React app is stable.

## Sprint 12 — Login + Cloud Sync ⬜

**Goal:** Make data available across devices.

### Task 12.1 — Login / Account Creation ⬜
Sign up, sign in, sign out, account state.

### Task 12.2 — Cloud Sync ⬜
Upload local data, download cloud data, sync after changes, offline queue if needed.

### Task 12.3 — Multi-Device Testing ⬜
Phone + desktop, offline/online behavior, conflict safety.

## Sprint 13 — Food Image Upload + Barcode Scanner ⬜

**Goal:** Add camera/media-powered food entry.

### Task 13.1 — Food Image Upload ⬜
Upload image for custom ingredient, preview, edit/remove, storage strategy based on account/cloud state.

### Task 13.2 — Barcode Scanner ⬜
Camera scanner, manual fallback, link barcode to saved food, unknown-barcode flow.

### Task 13.3 — Camera Permission + Mobile Testing ⬜
Permission handling, unsupported-browser fallback, Android testing.

**Rule:** No camera/media work before storage, ingredients, and account/cloud direction are stable.

## Sprint 14 — Multi-User Sharing ⬜

**Goal:** Allow sharing data/plans/lists with others.

### Task 14.1 — Sharing Model ⬜
Define what can be shared, view-only vs edit access, invite flow.

### Task 14.2 — Shared Weekly Plan / Shopping List ⬜
Share Weekly Plan, share Shopping List, update visibility.

### Task 14.3 — Multi-User Safety ⬜
Permissions, conflict handling, owner controls.

**Rule:** Sharing comes after accounts/cloud sync.

## Sprint 15 — Google Play Store Release ⬜

**Goal:** Make NutriFlow downloadable from Google Play Store.

### Task 15.1 — Android Packaging Decision ⬜
Choose packaging route, PWA/TWA/native wrapper decision, icon/splash review.

### Task 15.2 — Play Store Assets ⬜
App name, screenshots, description, privacy policy, store listing.

### Task 15.3 — Play Store QA ⬜
Install, login/cloud, camera/barcode, offline/PWA, release-candidate testing.

### Task 15.4 — Publish ⬜
Internal testing, closed/open testing if needed, production release.

**Rule:** Play Store comes after the app is stable and privacy/data behavior is clear.

## Sprint 16 — Final Stabilization + Project Completion ⬜

**Goal:** Finish NutriFlow properly.

### Task 16.1 — Full Regression QA ⬜
Test Today, Weekly, History, Quick Add, Analytics, Shopping List, Pantry/Stock, Settings, Macro Goals, Backup/Restore, Accounts, Cloud Sync, Barcode, Image Upload, Sharing, and Export/Import.

### Task 16.2 — Performance + Mobile Polish ⬜
Loading speed, layout stability, installability, offline behavior, data recovery, mobile touch behavior, desktop responsive checks.

### Task 16.3 — Final Docs + Version Tag ⬜
README, changelog, roadmap final status, release tag, known limitations, final project summary.

## Release / Tag State

Stable live-production rollback release:

- `vanilla-v1.0.0` — NutriFlow Vanilla v1.0.0

React sprint milestone tags:

- `v0.6.0` — Sprint 5
- `v0.7.0` — Sprint 6
- `v0.8.0` — Sprint 7

After each future sprint is fully completed, create its annotated sprint tag before starting the next sprint.
