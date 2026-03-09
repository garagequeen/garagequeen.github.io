# Changelog

All notable changes to Garage Log will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com)

-----

## [0.4.2] - 2026-03-09

### Added

- Project cover photo fills entire card background
- Progress overlay — light fill grows left→right as tasks complete (% shown in meta)

### Fixed

- Settings tab scroll — version now reachable
- Inventory — gap between search and filters removed
- Project detail header — Rename replaced with ✏️ icon

-----

## [0.4.1] - 2026-03-09

### Added

- 🎬 Film flag on tasks — checkbox in Edit task, icon shown on card
- Cover photo for projects — upload in Edit project sheet, stored in Supabase Storage
- Progress bar on project cards
- Copy task to another project — button in Edit task sheet

### Fixed

- Swipe delete — now actually deletes on tap (touchend + stopPropagation)
- Objects in Settings — compact single-line display
- Task filter capsules — box-shadow color accent at bottom

-----

## [0.4.0] - 2026-03-09

### Added

- Garage section in Settings — add/edit/delete vehicles (name, make, model, year, VIN, color code, mileage)
- Objects loaded from Supabase `objects` table
- Focus — project name shown in project color
- Task filters — capsule style with project color as active background
- Projects — “+ New” button in header, sheet instead of inline form
- Inventory — search field

### Fixed

- Task filter buttons — no border-bottom artifact, clean capsule style
- Inventory gap between search and filters

-----

## [0.3.8] - 2026-03-09

### Added

- Tasks tab — search field
- Tasks tab — filter by project (capsule buttons)
- Focus — empty states: 🎉 All done!, blocked state, no projects state with button
- Swipe — closes on tap elsewhere (global touchstart handler)

### Changed

- Projects — “+ New” button in header (later moved to sheet in 0.4.0)

-----

## [0.3.7] - 2026-03-09

### Added

- Block task button in Focus — opens sheet with reason input
- Background photo — fixed z-index (photo now visible behind content)

### Fixed

- Project cards — border-left only (not full border)
- Task filter buttons — no border-bottom scroll artifact
- “Priority optional” → “No priority” in selects
- Filter tabs — scrollbar hidden

-----

## [0.3.6] - 2026-03-09

### Added

- Tasks tab — search by title/notes
- Tasks tab — filter by project with color-coded buttons
- Tasks tab — project name in project color, category in grey
- Blocked tasks — field in Edit task, badge on card, hidden from Focus
- Category field in “+ Task” sheet
- Block reason field in Edit task
- Toast “✓ Done!” on Complete

### Fixed

- Swipe delete button — smaller (60px)

-----

## [0.3.5] - 2026-03-08

### Added

- Shared `makeTaskCard()` — used in both Tasks tab and Project detail
- Swipe left on task → Delete button (60px)
- Tap task body → Edit task sheet (title, category, priority, notes, delete)
- Rename project sheet — name + color picker
- Project cards — “74 open · 12 done” format
- Detail header — Rename button

-----

## [0.3.4] - 2026-03-08

### Added

- Import parser — digit-only lines (≥4 digits) treated as article/part number
- Import preview — article numbers show with checkbox “add to Parts”
- Part numbers inserted to inventory as `missing` with article as location

-----

## [0.3.3] - 2026-03-08

### Fixed

- Focus — category shown in grey, not uppercase
- Background — object-position: center top (shows from top)
- Settings — custom “Choose photo” button

-----

## [0.3.2] - 2026-03-08

### Added

- Background saved to Supabase Storage (`backgrounds/{user_id}/bg`), fallback to localStorage
- Inventory — tap item → edit sheet (Save + Delete)
- Import — duplicate detection (grey strikethrough + “already exists”)
- Import — toast after import
- Project cards — color stripe left side
- Toast system

-----

## [0.3.1] - 2026-03-08

### Fixed

- Safe area: `max(env(safe-area-inset-top), 44px)` on h2 and filter-tabs
- Scrollbar hidden everywhere
- Add project button: opacity + pointer-events instead of disabled
- Parser: notes no longer bleed between tasks

-----

## [0.2.5] - 2026-03-08

### Added

- Feedback button in Settings (🐛 Problem / 💡 Idea) — saves to Supabase
- Tasks tab — global list of all tasks across projects
- Dynamic placeholder in feedback sheet per type

### Fixed

- Task checkbox now toggles done ↔ open
- Redirect to Projects only on first login, not on every data reload
- Removed duplicate element IDs that broke OAuth login

-----

## [0.2.4] - 2026-03-08

### Fixed

- Auth broken by i18n — removed i18n completely, back to hardcoded English
- Bottom tab bar safe area (viewport-fit=cover)
- New user redirects to Projects tab on first login

-----

## [0.2.1] - 2026-03-08

### Added

- New user auto-redirects to Projects tab on first login
- Touch event blocking: pinch zoom and double-tap zoom disabled

### Fixed

- Bottom tab bar now respects iPhone safe area (home bar no longer overlaps)
- viewport-fit=cover added for proper notch/home bar handling

-----

## [0.2.0] - 2026-03-08

### Added

- Projects are now clickable — opens detail screen with task list
- Tasks are linked to projects
- Add task sheet with priority and notes fields
- Delete project with confirmation dialog
- Focus tab shows all unblocked open tasks as cards with Skip button
- Empty states with hints for new users
- Auth fix: `flowType: 'pkce'` for Chrome on iOS

### Changed

- Tabs reduced to Focus / Projects / Settings
- Service worker switched to network-first

### Removed

- Gallery tab (temporary)
- Standalone Tasks tab (tasks now live inside projects)

-----

## [0.1.0] - 2026-03-01

### Added

- Initial version
- Google OAuth login
- Tasks list (global, not linked to projects)
- Projects list (display only)
- Focus tab (first open task only)
- Background image via localStorage
- PWA support (manifest + service worker)
- Settings tab with logout

### Added

- Feedback button in Settings (🐛 Problem / 💡 Idea) — saves to Supabase
- Tasks tab — global list of all tasks across projects
- Dynamic placeholder in feedback sheet per type

### Fixed

- Task checkbox now toggles done ↔ open
- Redirect to Projects only on first login, not on every data reload
- Removed duplicate element IDs that broke OAuth login

-----

## [0.2.4] - 2026-03-08

### Fixed

- Auth broken by i18n — removed i18n completely, back to hardcoded English
- Bottom tab bar safe area (viewport-fit=cover)
- New user redirects to Projects tab on first login

-----

## [0.2.1] - 2026-03-08

### Added

- New user auto-redirects to Projects tab on first login
- Touch event blocking: pinch zoom and double-tap zoom disabled

### Fixed

- Bottom tab bar now respects iPhone safe area (home bar no longer overlaps)
- viewport-fit=cover added for proper notch/home bar handling

-----

## [0.2.0] - 2026-03-08

### Added

- Projects are now clickable — opens detail screen with task list
- Tasks are linked to projects
- Add task sheet with priority and notes fields
- Delete project with confirmation dialog
- Focus tab shows all unblocked open tasks as cards with Skip button
- Empty states with hints for new users
- `v0.2.0` version label in Settings
- Auth fix: `flowType: 'pkce'` for Chrome on iOS

### Changed

- Tabs reduced to Focus / Projects / Settings (Tasks inside Projects for now)
- Service worker switched to network-first — no more stale cache issues

### Removed

- Gallery tab (temporary, returns in later version)
- Standalone Tasks tab (tasks now live inside projects)

-----

## [0.1.0] - 2026-03-01

### Added

- Initial version
- Google OAuth login
- Tasks list (global, not linked to projects)
- Projects list (display only, no interaction)
- Focus tab (first open task only)
- Background image via localStorage
- PWA support (manifest + service worker)
- Settings tab with logout
