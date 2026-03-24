# Changelog — Garage Log

All notable changes documented here.

---

## [0.7.4] - 2026-03-24

### Added
- Quick capture — floating + button always visible above tab bar
- Quick capture sheet — add task to any project from anywhere in the app
- Task dependencies — "Blocked by task" section in Edit task sheet
- Task dependencies — auto-blocks task with ⏳ Waiting: reason
- Task dependencies — auto-unblocks when blocking task is completed
- task_dependencies table in Supabase
- place column on tasks (home / garage / car / other) — UI pending

---

## [0.7.3] - 2026-03-22

### Added
- Project type field: General, Vehicle, Content, Build, Home
- SVG icons per project type
- Type icon on project card (semi-transparent, right side)
- Collapse all / Expand all categories button (▽) in project detail
- Category suggestions when adding a task (custom dropdown, iOS-compatible)
- Category suggestions when editing a task
- Toast on task creation with category name

### Fixed
- selectedProjectType initialization error
- selectProjectType moved outside openRenameProject
- Duplicate variable declarations removed
- isContentToggle code removed from switchImportTab

---

## [0.7.2] - 2026-03-21

### Added
- Category autocomplete in Add task sheet
- Category autocomplete in Edit task sheet

---

## [0.7.1] - 2026-03-21

### Added
- Content project (is_content flag) — collects all 🎬 tasks
- filmed boolean field on tasks
- Sale system: sale_price, sale_currency, sold_for, listings
- For sale fields appear on drum change (no save needed)
- For sale filter tab in inventory
- Sale price and listings on inventory card
- Qty stepper in inventory edit sheet
- Type buttons left of status drum
- Blocked item red left border

### Changed
- Removed block field from inventory item
- Currency select width 90px

---

## [0.7.0] - 2026-03-20

### Added
- Focus scroll-snap drum
- Inventory currency field + spending overview
- Inventory sale fields + listings
- Convert item → task with duplicate check

### Changed
- Refactor: index.html / style.css / js/app.js

---

## [0.6.7] - 2026-03-12

### Added
- deleteEditTask undo toast
- APP_VERSION constant

---

## [0.6.x] - 2026-03-11

### Added
- Tasks multiselect, collapse categories, blocked filter
- Inventory film flag, tag suggestions, swipe toggle
- Focus film + blocked filters

---

## [0.4.x] - 2026-03-09

### Added
- Project cover photo, progress overlay
- Film flag, copy task, garage section, service log

---

## [0.3.x] - 2026-03-08/09

### Added
- Tasks search + filter, block task, swipe delete
- Import text/CSV, background photo, feedback

---

## [0.2.0] - 2026-03-08

### Added
- Projects detail, Focus cards, delete project

---

## [0.1.0] - 2026-03-01

### Added
- Initial version: Google OAuth, Tasks, Projects, Focus, PWA
