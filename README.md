# Protein Diet Planner

Protein Diet Planner is a lightweight, browser-based diet tracking app focused on daily protein intake, food cost, and simple meal planning. It runs entirely on the client side and stores data in the browser using Local Storage.

## Purpose

The project helps users plan and track a protein-focused diet without needing an account, server, or database. It is designed for quick daily use: check staple foods, add meals and ingredients, monitor protein totals, estimate cost, and keep a rolling history of recent days.

## Features

- Daily protein, calories, macronutrients, fibre, and cost tracking.
- Built-in ingredient library with common protein sources.
- Custom ingredient creation with nutrition and price data.
- Daily staples such as eggs, milk, and almonds with checkboxes and quantity controls.
- Meal organization for breakfast, lunch, dinner, and snacks.
- Dish and ingredient management inside each meal.
- Editable all-ingredients table for quick corrections.
- Protein target progress bar and weekly spend progress bar.
- Weekly ingredient planning by day.
- Copy planned ingredients into today's meals.
- Last 30 days history view.
- Cost-per-gram-of-protein comparison table.
- JSON backup export and import.
- Basic PWA support through an inline manifest and service worker.

## Folder Structure

```text
Protein Diet Planner/
├── index.html             # Main application: HTML, CSS, JavaScript, PWA setup
├── README.md              # Project documentation
├── PROJECT_ANALYSIS.md    # Technical analysis of the current codebase
├── script.js              # Currently empty placeholder
├── style.css              # Currently empty placeholder
└── CONTRIBUTING.md        # Currently empty placeholder
```

The active application code currently lives in `index.html`.

## How to Run Locally

No installation is required.

1. Download or clone the project.
2. Open `index.html` in a modern browser.

For better PWA/service-worker behavior, serve the folder through a local web server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## PWA Smoke Test

Install dev dependencies:

```bash
npm install
```

Install Chromium for Playwright:

```bash
npx playwright install chromium
```

Run against live GitHub Pages in PowerShell:

```powershell
$env:PWA_BASE_URL="https://mayank1432.github.io/protein-diet-planner/"
npm run test:pwa
```

Run against a local static server:

```bash
python -m http.server 4173
```

Then in another PowerShell terminal:

```powershell
$env:PWA_BASE_URL="http://127.0.0.1:4173/"
npm run test:pwa
```

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Browser Local Storage
- Browser File APIs for backup import/export
- Service Worker API for basic offline support
- Web App Manifest via inline data URL

## Future Roadmap

- Split inline CSS and JavaScript into `style.css` and `script.js`.
- Add automatic new-day rollover for daily tracking.
- Add stronger validation for imported backup files.
- Improve data migration support between storage versions.
- Add tests for nutrition calculations and Local Storage behavior.
- Add configurable protein and budget targets.
- Add meal selection controls for weekly plan custom items.
- Improve accessibility and keyboard navigation.
- Add charts for protein, calorie, and spend trends.
- Support reusable meal templates or saved recipes.
