# Changelog — Garage Log

All notable changes documented here.

---

## [0.7.3] - 2026-03-22

### Added
- Project type field: General, Vehicle, Content, Build, Home
- SVG icons per project type (Lucide-style, inline)
- Type icon shown on project card — semi-transparent, right side
- Collapse all / Expand all categories button in project detail (▽)
- Category suggestions when adding a task (iOS-compatible custom dropdown)
- Category suggestions when editing a task
- Toast on task creation with category name

### Fixed
- selectedProjectType declared at top level (was causing initialization error)
- selectProjectType function moved outside openRenameProject
- Duplicate let declarations removed (isContentValue, allCollapsed, selectedColor)
- isContentToggle code removed from switchImportTab (wrong placement)

---

## [0.7.2] - 2026-03-21

### Added
- Category autocomplete in Add task sheet (custom suggestions, iOS-compatible)
- showEditTaskCatSuggestions — same for Edit task sheet

---

## [0.7.1] - 2026-03-21

### Added
- Content project flag (is_content) — collects all 🎬 tasks from all projects
- Content project view — grouped by To film / Filmed with toggle button
- filmed boolean field on tasks
- Sale system: sale_price, sale_currency, sold_for, listings (platform + URL)
- For sale fields appear immediately on drum status change
- For sale filter tab in inventory
- Sale price and listings shown on inventory card
- Qty stepper (- N +) in inventory edit sheet, centered
- Type buttons moved left of status drum
- Blocked inventory item — red left border if linked to blocked task
- invSaleCurrency connected to save/reset/open

### Changed
- Removed block field from inventory (auto-block via task links only)
- Currency select width increased to 90px

### Fixed
- Filter tabs highlight active state correctly
- toggleIsContent was nested inside closeDetail

---

## [0.7.0] - 2026-03-20

### Added
- Focus — scroll-snap drum: one task per screen, one swipe per card
- Focus — filter shows only projects with open unblocked tasks
- Inventory — currency field (UAH/EUR/USD) per item
- Inventory — spending overview: Spent / Planned by currency with qty
- Inventory — sale fields (sale_price, listings, sold_for)
- Convert item → task — duplicate check + item deleted after

### Changed
- Refactor: index.html split into index.html / style.css / js/app.js

---

## [0.6.7] - 2026-03-12

### Added
- deleteEditTask — undo toast with 4s delay
- APP_VERSION constant shown on login and settings

---

## [0.6.x] - 2026-03-11

### Added
- Tasks — long press multiselect, collapse categories, blocked filter
- Inventory — film flag, tag suggestions, swipe right toggle
- Focus — film filter, blocked filter

---

## [0.4.x] - 2026-03-09

### Added
- Project cover photo, progress overlay
- Film flag on tasks, copy task to project
- Garage section, service log

---

## [0.3.x] - 2026-03-08/09

### Added
- Tasks search + filter, block task, swipe delete
- Import from text/notes + CSV
- Background photo, feedback button, safe area support

---

## [0.2.0] - 2026-03-08

### Added
- Projects → detail screen, Focus cards, delete project

---

## [0.1.0] - 2026-03-01

### Added
- Initial version: Google OAuth, Tasks, Projects, Focus, PWA
