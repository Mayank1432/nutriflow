# NutriFlow Production Replacement Plan

Task 10.2 was the plan. Task 10.3 carried it out: React has been the production app at the site root since the launch, and the Vanilla archive is at `/classic/`.

## Decisions

- React becomes the app served at the site root: https://mayank1432.github.io/nutriflow/
- A frozen copy of the Vanilla app is published at /classic/. It contains `index.html` and `js/storage.js` only, with no service worker and no manifest.
- Vanilla source files in the repository root stay untouched. They are the rollback path.
- Launch goes straight to the root. There is no separate preview deployment.
- There is no Vanilla-to-React data migration. Only the owner used Vanilla. The owner's Vanilla data stays in the browser and is readable at /classic/.
- Deployment moves from "branch root" to a GitHub Actions workflow that assembles both apps.

## Current state

- GitHub Pages serves the repository root directly. No workflow exists.
- Vanilla registers `./sw.js` with cache `nutriflow-v0.6.0` (cache-first, no `skipWaiting`).
- Vanilla's `sw.js` deletes every cache whose name is not its own.
- The React app has no manifest, no service worker, no icons, and no `public/` folder. Its Vite base path is the default `/`. `react-app/dist/` is gitignored.
- Local Storage is shared per site, not per page. React keys (`nutriflow_react_*`) and Vanilla keys (`pptd_v5`, `ppc_v5`, `ppwk_v5`, `ppst_v5`, `ppl_v5`) do not collide.
- `tests/pwa-smoke.spec.js` hardcodes the Vanilla cache name and the Vanilla page heading.

## Target layout of the published site

- `/` : the React build (`index.html`, `assets/`, `manifest.json`, `sw.js`, `icons/`)
- `/classic/` : Vanilla `index.html` and `js/storage.js` only

## Work for Task 10.3

1. Vite: set `base: './'` so the build works at any path.
2. Add `react-app/public/` with:
   - `manifest.json`: name NutriFlow, `start_url` and `scope` `./`, display `standalone`, 192 and 512 icons
   - `icons/icon-192.png` and `icons/icon-512.png` (copied from the existing Vanilla icons)
   - `sw.js`: a new cache name (`nutriflow-react-v1`), `skipWaiting` on install, `clients.claim` on activate, and it must ignore any request whose path contains `/classic/`
3. React `index.html`: link the manifest, set the title to NutriFlow, set a correct `theme-color`. Register the service worker in `main.tsx`.
4. Add `.github/workflows/deploy-pages.yml`: install and build `react-app`, copy `index.html` and `js/storage.js` into `dist/classic/`, upload the artifact, deploy to Pages.
5. Update `tests/pwa-smoke.spec.js` for the React cache name and page content.
6. Test the assembled site locally before the switch.

## Pre-launch gates (all must pass)

- `tsc -b` is clean and every domain verifier passes.
- `npm run build` succeeds in `react-app`.
- The assembled site works locally: React at the root, Vanilla at `/classic/`, correct base paths.
- The tag `vanilla-v1.0.0` exists and points at the recorded snapshot.
- A fresh Vanilla backup is exported and stored safely (see Vanilla backup).
- A fresh React backup is exported using Backup & Restore.
- The current GitHub Pages source setting is recorded.

## Launch order

1. Merge the launch work to `main`. The deploy job may fail until the Pages source is switched. That is expected.
2. In GitHub: Settings, Pages, set Source to GitHub Actions.
3. Re-run the workflow and wait for it to finish.
4. Run the post-launch smoke checks.

## Post-launch smoke checks

- The root URL loads the React app (Today dashboard) with no console errors.
- `manifest.json`, `sw.js`, and both icons return 200.
- The app is installable.
- After one visit, an offline reload works.
- Add a food on Today, reload, and it persists.
- History, Weekly, Analytics, Pantry, Shopping, and Settings open.
- Backup & Restore: download a backup, then restore it.
- `/classic/` loads the Vanilla app and shows the owner's existing Vanilla data.
- The old installed app updates to React after closing and reopening it.

## Service worker and cache plan

- Vanilla and React both use the URL `/sw.js`. The new file replaces the old one, so installed copies update on their own.
- React's cache name starts with `nutriflow-react-`. On activate, the React worker deletes only older `nutriflow-` caches, which also removes `nutriflow-v0.6.0`.
- `/classic/` has no service worker, so Vanilla's cache-deleting logic never runs next to React.
- Because of `skipWaiting` and `clients.claim`, the first visit after launch may still show the old page. The next reload shows React.

## Rollback

1. Fast rollback: Settings, Pages, set Source back to "Deploy from a branch", `main`, `/ (root)`. The Vanilla files in the repository root were never changed, so Vanilla is live again.
2. Browsers that already took the React service worker update back to Vanilla's `sw.js` on their next visit.
3. Rollback never deletes Local Storage. Both data sets stay in place.
4. If the repository root was changed by mistake: restore from the tag `vanilla-v1.0.0` (snapshot `ddd67751c682fac7a3a4ac2db9c1fa62468427b7`).

## Vanilla backup plan

- Before launch, open the live Vanilla app and use its own export to download a backup file.
- The repository is public. Never commit personal backup files. Store them outside the repository (for example in cloud storage).
- The Vanilla source stays in the repository root and at `/classic/`.
- The Vanilla backup format is already documented, so a one-time importer into React can be added later if wanted.

## Out of scope

- A Vanilla-to-React data importer.
- Removing the Vanilla files from the repository root.
- Removing the `/classic/` archive.
- Play Store or TWA packaging (Sprint 15).

## Open checks before Task 10.3

- Confirm the Pages Source in repository Settings is "Deploy from a branch" (the `pages-build-deployment` runs and the missing `.github` folder suggest it is).
- Confirm no `pages-build-deployment` run is stuck in the queue.

## Launch record

- Deployed by the `Deploy site` workflow after the Pages Source was switched to GitHub Actions.
- Verified live: React at the root (service worker `nutriflow-react-<hash>`), the Vanilla archive at `/classic/`, and the hosted `npm run test:pwa` run (2 passed).
- The workflow deploys on every push to `main` (Markdown-only changes are skipped).
- One early check of the root briefly returned the old Vanilla page. It was most likely a stale GitHub Pages cache. When checking the live site from the command line, add a `?v=<timestamp>` query string.
- Rollback is unchanged: set Settings, Pages, Source back to "Deploy from a branch", `main`, `/ (root)`.
