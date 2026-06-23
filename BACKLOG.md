# Protein Diet Planner Backlog

## 🔴 Critical Bugs
- [x] Editing quantity resets nutrition values
- [x] Quick Add ingredients should remain editable
- [ ] Piece-based custom ingredients calculate incorrectly because nutrition fields are treated as per-100 instead of per-piece.
- [ ] Allow custom ingredients to enter nutrition for any serving amount, then convert automatically to the app's internal calculation format.
- [x] Decouple History logging from autosave/copy actions so Weekly-to-Today copy updates Today only and does not automatically write to History.
- [ ] Add explicit "Log Today" / "Save Today to History" action that calls saveTodayToHistory().

## 🟡 Refactoring
- [ ] Remove duplicate ingredient update logic
- [ ] Centralize food calculations
- [ ] Improve Local Storage handling
- [ ] Standardize unit calculation logic for g, ml, and piece.
- [ ] Add a unit normalization helper for converting serving-based nutrition into per-100 or per-piece values.

## 🟢 Features
- [ ] Merge both planner versions
- [ ] Recipe Builder
- [ ] Nutrition Score
- [ ] Dashboard redesign
- [ ] Analytics
- [ ] Protein Optimizer
- [ ] Mobile improvements

