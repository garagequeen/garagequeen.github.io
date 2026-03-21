# Changelog — Garage Log

All notable changes documented here.
Format: Keep a Changelog

---

## [0.7.1] - 2026-03-21

### Added
- Content project flag (is_content) — collects all 🎬 tasks from all projects
- Content project view — grouped by To film / Filmed with toggle button
- filmed boolean field on tasks
- Sale system: sale_price, sale_currency, sold_for, listings (platform + URL)
- For sale fields appear immediately on drum status change (no save needed)
- For sale filter tab in inventory
- Sale price and listings shown directly on inventory card
- Qty stepper (- N +) in inventory edit sheet, centered
- Type buttons (Part/Tool/Consumable) moved left of status drum
- Blocked inventory item — red left border if linked to blocked task
- invSaleCurrency field connected to save/reset/open

### Changed
- Removed block field from inventory item (auto-block via task links only)
- Currency select width increased to 90px (H no longer clipped)
- Edit item sheet scrolls to top on open
- Duplicate .focus-card CSS removed

### Fixed
- Filter tabs in inventory now highlight active state correctly
- toggleIsContent was nested inside closeDetail — moved to top level

---

## [0.7.0] - 2026-03-20

### Added
- Focus — scroll-snap drum: one task per screen, one swipe per card
- Focus — filter shows only projects with open unblocked tasks
- Inventory — currency field (UAH/EUR/USD) per item, default UAH
- Inventory — spending overview: Spent / Planned by currency including qty
- Inventory — sale_price, listed_on, sold_for, storage_location columns
- Inventory — listings (jsonb): platform + URL, multiple per item
- Convert item → task — duplicate check before creating
- Convert item → task — item deleted after successful conversion

### Changed
- Refactor: index.html split into index.html / style.css / js/app.js

### Fixed
- Convert item → task — fixed (editingInvItem declaration order)
- Toast pointer-events — Undo button now clickable

---

## [0.6.7] - 2026-03-12

### Added
- deleteEditTask — undo toast with 4s delay before DB delete
- APP_VERSION constant — shown on login screen and in settings footer

### Fixed
- versionLogin HTML — broken style attribute fixed
- docement typo fixed

---

## [0.6.x] - 2026-03-11

### Added
- Tasks — deleteEditTask with undo
- Tasks — long press multiselect (Complete / Category / Delete)
- Tasks — collapse/expand categories with count badge
- Tasks — blocked chip filter inside project list
- Inventory — film_flag + blocked_reason columns
- Inventory — tag suggestions with global delete
- Inventory — swipe right to toggle Have/Missing
- Focus — film filter and blocked filter

### Fixed
- Qty stepper alignment (flex centering)
- Tasks All button correct states
- New category input — mixed case + autofocus
- Priority simplified to High or null
- font-size 16px on inputs (prevents iOS zoom)
- Blocked filter auto-reset after saveEditTask

---

## [0.4.x] - 2026-03-09

### Added
- Project cover photo fills card background
- Progress overlay on project cards
- Film flag on tasks
- Copy task to another project
- Garage section — add/edit/delete vehicles
- Service log — entries with date and mileage

---

## [0.3.x] - 2026-03-08/09

### Added
- Tasks tab — search + filter by project
- Block task with reason, badge on card, hidden from Focus
- Swipe left to delete task
- Rename project — name + color picker
- Import parser — text/notes + CSV
- Background photo saved to Supabase Storage
- Feedback button (Problem / Idea)
- Safe area support everywhere

---

## [0.2.0] - 2026-03-08

### Added
- Projects clickable → detail screen with task list
- Focus tab — cards with Skip button
- Delete project with confirmation
- Auth fix: flowType pkce for Chrome on iOS

---

## [0.1.0] - 2026-03-01

### Added
- Initial version
- Google OAuth login
- Tasks list, Projects list, Focus tab
- Background image via localStorage
- PWA support (manifest + service worker)
- Settings tab with logout
